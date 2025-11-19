import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// Initialize OpenAI client only if API key is available
let openai = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
} else {
  console.warn('[WARNING] OPENAI_API_KEY not found. OpenAI models will not work.')
}

// Initialize Anthropic client only if API key is available
let anthropic = null
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
} else {
  console.warn('[WARNING] ANTHROPIC_API_KEY not found. Claude models will not work.')
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

async function callGPT4o(config) {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
  }
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    ...config
  })
  return completion.choices[0].message.content.trim()
}

async function callClaudeSonnet(config) {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable.')
  }

  // Convert OpenAI message format to Claude format
  const systemMessage = config.messages.find(m => m.role === 'system')
  const userMessages = config.messages.filter(m => m.role !== 'system')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: config.max_tokens || 4096,
    temperature: config.temperature || 0.7,
    system: systemMessage ? systemMessage.content : undefined,
    messages: userMessages
  })

  return response.content[0].text.trim()
}

async function callClaudeHaiku(config) {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable.')
  }

  // Convert OpenAI message format to Claude format
  const systemMessage = config.messages.find(m => m.role === 'system')
  const userMessages = config.messages.filter(m => m.role !== 'system')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: config.max_tokens || 1024,
    temperature: config.temperature || 0.3,
    system: systemMessage ? systemMessage.content : undefined,
    messages: userMessages
  })

  return response.content[0].text.trim()
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
   * Use Claude Haiku for fast, cheap intent detection
   */
  async detectIntent(command, chatHistory) {
    // SIMPLE RULE: If user highlighted text, they want to work on it → EDIT mode
    // This is a concrete user action (highlighting), not keyword matching
    if (command.includes('CONTEXT:')) {
      return {
        role: 'EDIT',
        reasoning: 'User highlighted specific text to work on'
      };
    }

    const recentContext = chatHistory.slice(-5).map(m =>
      `${m.nickname}: ${m.text}`
    ).join('\n');

    const response = await callClaudeHaiku({
      messages: [
        {
          role: 'system',
          content: `You are an intent classifier for document commands (highlighted text cases are already handled).

Three modes:

EDIT: User wants to modify the document
- Change, rewrite, improve, fix existing text
- Follow-ups like "yes", "go ahead", "do it" after edit suggestions
- Any request to modify existing content

CREATE: User wants to add new content
- Write new sections, paragraphs, chapters
- Add content that doesn't exist yet
- Generate new material

CHAT: User wants to discuss without changes
- Questions about the document
- Asking for explanations or opinions
- General conversation

Default to EDIT if ambiguous - it's better to attempt an edit than refuse.`
        },
        {
          role: 'user',
          content: `Recent conversation:
${recentContext}

Command: "${command}"

JSON response:
{
  "role": "EDIT" or "CREATE" or "CHAT",
  "reasoning": "brief explanation"
}`
        }
      ],
      temperature: 0.1,
      max_tokens: 200
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

    const response = await callGPT4o({
      messages: [
        {
          role: 'system',
          content: `You are a surgical document editor. When users highlight specific text, they want you to improve ONLY that portion.

CRITICAL: Find the exact text shown in triple quotes (""") and modify ONLY that text. Leave everything else unchanged.

USER REQUEST TYPES:
1. Asking for feedback ("do you like this?", "thoughts?")
   → Provide brief feedback
   → Then improve ONLY the highlighted portion

2. Asking for changes ("make it more concise", "rewrite this")
   → Modify ONLY the highlighted text
   → Keep all surrounding text exactly as is

3. Follow-up ("yes", "go ahead", "apply it")
   → Apply changes to ONLY the previously highlighted portion

EDITING RULES:
- Locate the EXACT text in triple quotes (""") in the command
- Apply changes ONLY to that specific text
- Keep everything before and after it completely unchanged
- Maintain proper spacing and flow between sections
- Return the complete document with ONLY the targeted section modified

Think step by step:
1. Find the highlighted text in the document
2. Modify only that portion according to the request
3. Return full document with just that one section changed`
        },
        {
          role: 'user',
          content: `Document to edit:
${this.document}
${chatContext}${sectionInfo}
User request: ${command}

Remember: Change ONLY the text shown in triple quotes. Keep everything else identical.`
        }
      ],
      temperature: 0.2,  // Lower for precision - we want surgical edits
      max_tokens: 8192
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

    const response = await callClaudeSonnet({
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
      max_tokens: 8192   // Increased for Claude Sonnet capacity
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

    const response = await callClaudeSonnet({
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant having a conversation about a document.

Your job: Answer questions and discuss the content naturally.
- Answer questions thoughtfully
- Provide opinions and suggestions when asked
- Engage naturally, not mechanically
- Reference the document context when relevant
- Use conversation history to maintain context

IMPORTANT: You are in CHAT mode - you CANNOT edit the document. You can only discuss and provide suggestions.
If the user asks you to make changes, politely let them know they should use a command like "@lava edit..." or "@lava change..." to modify the document.`
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
      max_tokens: 2048   // Increased for Claude's more detailed responses
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