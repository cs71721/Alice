import OpenAI from 'openai'

// Initialize OpenAI client only if API key is available
let openai = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
} else {
  console.warn('[WARNING] OPENAI_API_KEY not found. @lava commands will not work.')
}

async function callGPT4(config) {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
  }
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    ...config
  })
  return completion.choices[0].message.content.trim()
}

export class DocumentEngine {
  constructor() {
    this.document = '';
    this.history = [];
    this.chatContext = [];
  }

  /**
   * Extract section references from command (e.g., #section-id: "quoted text")
   */
  extractSectionContext(command, document) {
    const referencePattern = /#([a-z0-9-]+):\s*"([^"]+)"/gi;
    const matches = [...command.matchAll(referencePattern)];

    if (matches.length === 0) return null;

    let sectionContext = [];

    for (const match of matches) {
      const [fullMatch, sectionId, quotedText] = match;

      // Find the section in the document by looking for headers with this ID pattern
      // Headers are formatted as: # Header Text
      // We need to find the section that would generate this ID
      const lines = document.split('\n');
      let sectionStart = -1;
      let sectionEnd = lines.length;
      let headerLevel = 0;

      // Look for the header that matches this ID
      for (let i = 0; i < lines.length; i++) {
        const headerMatch = lines[i].match(/^(#{1,6})\s+(.+)/);
        if (headerMatch) {
          const [, hashes, headerText] = headerMatch;
          const headerId = headerText
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 50);

          if (headerId === sectionId) {
            sectionStart = i;
            headerLevel = hashes.length;
            break;
          }
        }
      }

      if (sectionStart >= 0) {
        // Find the end of this section (next header of same or higher level)
        for (let i = sectionStart + 1; i < lines.length; i++) {
          const headerMatch = lines[i].match(/^(#{1,6})\s+/);
          if (headerMatch && headerMatch[1].length <= headerLevel) {
            sectionEnd = i;
            break;
          }
        }

        const sectionContent = lines.slice(sectionStart, sectionEnd).join('\n');
        sectionContext.push({
          sectionId,
          quotedText,
          content: sectionContent
        });
      }
    }

    return sectionContext.length > 0 ? sectionContext : null;
  }

  /**
   * Main entry point - detects intent and routes to appropriate handler
   */
  async processCommand(userCommand, chatHistory = []) {
    // Extract any section references from the command
    const sectionContext = this.extractSectionContext(userCommand, this.document);

    // First detect what role is needed
    const intent = await this.detectIntent(userCommand, chatHistory);

    console.log(`🎯 Detected intent: ${intent.role} - "${intent.reasoning}"`);

    // Route to appropriate handler with role-specific prompts AND context
    // Each handler gets appropriate amount of context based on intent
    switch(intent.role) {
      case 'EDIT':
        // Edits need less context (last 10-20 messages for references)
        return await this.handleEdit(userCommand, intent, chatHistory.slice(-20), sectionContext);
      case 'CREATE':
        // Creation needs medium context (last 30-50 messages for style/tone)
        return await this.handleCreate(userCommand, intent, chatHistory.slice(-50), sectionContext);
      case 'CHAT':
        // Chat might need full context for "summarize everything" type requests
        // But cap at 100 for cost/privacy
        return await this.handleChat(userCommand, intent, chatHistory.slice(-100), sectionContext);
      default:
        return await this.handleUnclear(userCommand);
    }
  }

  /**
   * Let GPT-4 detect intent naturally - no hard-coded keywords
   */
  async detectIntent(command, chatHistory) {
    const recentContext = chatHistory.slice(-5).map(m =>
      `${m.nickname}: ${m.text}`
    ).join('\n');

    const response = await callGPT4({
      messages: [
        {
          role: 'system',
          content: `Determine which role is needed for this command.

The three roles are:
EDIT: Mechanical changes to existing document text (formatting, moving, deleting, simple modifications)
CREATE: Generate new content to add to the document (writing paragraphs, summaries, introductions)
CHAT: Discuss, answer questions, provide opinions, have a conversation (not document-related)

Analyze the user's command and context to determine intent.`
        },
        {
          role: 'user',
          content: `Recent conversation:
${recentContext}

Current command: "${command}"

Respond with JSON only:
{
  "role": "EDIT" or "CREATE" or "CHAT",
  "reasoning": "brief explanation of why you chose this role"
}`
        }
      ],
      temperature: 0.3,  // Low temperature for consistent classification
      max_tokens: 100
    });

    try {
      return JSON.parse(response);
    } catch {
      return { role: 'CHAT', reasoning: 'Could not parse intent, defaulting to chat' };
    }
  }

  /**
   * EDIT: Precise mechanical changes
   */
  async handleEdit(command, intent, chatHistory = [], sectionContext = null) {
    // Format recent chat for context (might reference "that", "the above", etc.)
    const chatContext = chatHistory.length > 0
      ? `\n\nRecent conversation for context:\n${chatHistory.map(m => `${m.nickname}: ${m.text}`).join('\n')}\n`
      : '';

    // Add section context if provided
    const sectionInfo = sectionContext
      ? `\n\nReferenced sections (pay special attention to these):\n${sectionContext.map(s =>
          `Section "${s.sectionId}" (user highlighted: "${s.quotedText}"):\n${s.content}`
        ).join('\n\n')}\n`
      : '';

    const response = await callGPT4({
      messages: [
        {
          role: 'system',
          content: `You are a PRECISE document editor.

Your job: Execute the EXACT edit requested. Nothing more, nothing less.
- Apply formatting exactly as requested
- Move/delete text precisely
- Do not add creative flourishes
- Do not explain your changes
- Use chat context to understand references like "that text" or "the paragraph we discussed"
- Pay special attention to any referenced sections the user has highlighted
- Return ONLY the edited document`
        },
        {
          role: 'user',
          content: `Document to edit:
${this.document}
${chatContext}${sectionInfo}
Command: ${command}

Execute this edit precisely and return the complete edited document.`
        }
      ],
      temperature: 0.1,  // Very low for mechanical precision
      max_tokens: 4000  // Increased for larger documents
    });

    this.saveToHistory();
    this.document = response;

    return {
      success: true,
      document: this.document,
      mode: 'EDIT',
      message: '✓ Document updated'
    };
  }

  /**
   * CREATE: Generate new content
   */
  async handleCreate(command, intent, chatHistory = [], sectionContext = null) {
    // Format chat history - important for understanding what to write about
    const chatContext = chatHistory.length > 0
      ? `\n\nConversation context (to understand what has been discussed):\n${chatHistory.map(m => `${m.nickname}: ${m.text}`).join('\n')}\n`
      : '';

    // Add section context if provided
    const sectionInfo = sectionContext
      ? `\n\nReferenced sections (focus your additions around these areas):\n${sectionContext.map(s =>
          `Section "${s.sectionId}" (user highlighted: "${s.quotedText}"):\n${s.content}`
        ).join('\n\n')}\n`
      : '';

    const response = await callGPT4({
      messages: [
        {
          role: 'system',
          content: `You are a CREATIVE content generator.

Your job: Generate high-quality new content based on the request.
- Write engaging, well-structured content
- Match the tone and style of the existing document
- Be creative but relevant
- Use the conversation context to understand what topics have been discussed
- If sections are referenced, focus your additions on or around those areas
- Add the new content to the document appropriately`
        },
        {
          role: 'user',
          content: `Current document:
${this.document}
${chatContext}${sectionInfo}
Request: ${command}

Generate the requested content and return the complete document with your additions.`
        }
      ],
      temperature: 0.7,  // Higher for creativity
      max_tokens: 6000
    });

    this.saveToHistory();
    this.document = response;

    return {
      success: true,
      document: this.document,
      mode: 'CREATE',
      message: '✓ Content added to document'
    };
  }

  /**
   * CHAT: Conversational responses
   */
  async handleChat(command, intent, chatHistory = [], sectionContext = null) {
    // Use actual chatHistory instead of broken this.chatContext
    const conversationContext = chatHistory.map(m => `${m.nickname}: ${m.text}`).join('\n');

    // Add section context if provided - for chat, include full referenced sections
    const sectionInfo = sectionContext
      ? `\n\nUser is specifically asking about these sections:\n${sectionContext.map(s =>
          `Section "${s.sectionId}" (user highlighted: "${s.quotedText}"):\n${s.content}`
        ).join('\n\n')}\n`
      : '';

    const response = await callGPT4({
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant engaged in conversation.

Your job: Have a natural, helpful conversation.
- Answer questions thoughtfully
- Provide opinions and suggestions
- Engage naturally, not mechanically
- Reference the document context when relevant
- Use the full conversation history to maintain context
- If user references specific sections, focus your response on those areas
- Do NOT edit the document unless explicitly asked`
        },
        {
          role: 'user',
          content: `Document context:
${this.document.substring(0, 1000)}...
${sectionInfo}
Conversation history:
${conversationContext}

User asks: ${command}

Respond conversationally.`
        }
      ],
      temperature: 0.5,  // Balanced for natural conversation
      max_tokens: 1000  // Increased for more detailed responses
    });

    // Don't modify document for chat
    return {
      success: true,
      document: this.document,  // Unchanged
      mode: 'CHAT',
      message: response  // The conversational response
    };
  }

  /**
   * When intent is unclear, ask for clarification
   */
  async handleUnclear(command) {
    return {
      success: false,
      mode: 'UNCLEAR',
      message: `I'm not sure what you'd like me to do. Would you like me to:
- Edit the document (change existing text)
- Create new content (write something new)
- Discuss something (have a conversation)`
    };
  }

  saveToHistory() {
    this.history.push(this.document);
    if (this.history.length > 50) this.history.shift();
  }

  addChatMessage(sender, message) {
    this.chatContext.push(`${sender}: ${message}`);
    if (this.chatContext.length > 20) this.chatContext.shift();
  }

  setDocument(doc) {
    this.document = doc;
  }

  getDocument() {
    return this.document;
  }
}