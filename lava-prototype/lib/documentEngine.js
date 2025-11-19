import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function callGPT4(config) {
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
   * Main entry point - detects intent and routes to appropriate handler
   */
  async processCommand(userCommand, chatHistory = []) {
    // First detect what role is needed
    const intent = await this.detectIntent(userCommand, chatHistory);

    console.log(`🎯 Detected intent: ${intent.role} - "${intent.reasoning}"`);

    // Route to appropriate handler with role-specific prompts AND context
    // Each handler gets appropriate amount of context based on intent
    switch(intent.role) {
      case 'EDIT':
        // Edits need less context (last 10-20 messages for references)
        return await this.handleEdit(userCommand, intent, chatHistory.slice(-20));
      case 'CREATE':
        // Creation needs medium context (last 30-50 messages for style/tone)
        return await this.handleCreate(userCommand, intent, chatHistory.slice(-50));
      case 'CHAT':
        // Chat might need full context for "summarize everything" type requests
        // But cap at 100 for cost/privacy
        return await this.handleChat(userCommand, intent, chatHistory.slice(-100));
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
  async handleEdit(command, intent, chatHistory = []) {
    // Format recent chat for context (might reference "that", "the above", etc.)
    const chatContext = chatHistory.length > 0
      ? `\n\nRecent conversation for context:\n${chatHistory.map(m => `${m.nickname}: ${m.text}`).join('\n')}\n`
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
- Return ONLY the edited document`
        },
        {
          role: 'user',
          content: `Document to edit:
${this.document}
${chatContext}
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
  async handleCreate(command, intent, chatHistory = []) {
    // Format chat history - important for understanding what to write about
    const chatContext = chatHistory.length > 0
      ? `\n\nConversation context (to understand what has been discussed):\n${chatHistory.map(m => `${m.nickname}: ${m.text}`).join('\n')}\n`
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
- Add the new content to the document appropriately`
        },
        {
          role: 'user',
          content: `Current document:
${this.document}
${chatContext}
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
  async handleChat(command, intent, chatHistory = []) {
    // Use actual chatHistory instead of broken this.chatContext
    const conversationContext = chatHistory.map(m => `${m.nickname}: ${m.text}`).join('\n');

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
- Do NOT edit the document unless explicitly asked`
        },
        {
          role: 'user',
          content: `Document context:
${this.document.substring(0, 1000)}...

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