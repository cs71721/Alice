import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * DocumentEngine: GPT-4 Turbo powered document editing
 * - Sends full document + command to GPT-4 Turbo
 * - GPT-4 understands context and returns edited document directly
 * - Simple, reliable, no complex parsing
 */
export class DocumentEngine {
  constructor(initialDocument = '') {
    this.document = initialDocument
    this.history = []
  }

  /**
   * History management for undo functionality
   */
  saveToHistory() {
    this.history.push(this.document)
    if (this.history.length > 50) {
      this.history.shift() // Keep only last 50 versions
    }
  }

  undo() {
    if (this.history.length > 0) {
      this.document = this.history.pop()
      return { success: true, document: this.document }
    }
    return { success: false, error: 'No history to undo' }
  }

  /**
   * Main entry point: Process a user command
   * SIMPLIFIED: Let GPT-4 Turbo handle everything directly
   */
  async processCommand(userCommand, recentMessages = []) {
    // Special commands
    if (userCommand.toLowerCase().includes('undo')) {
      return this.undo()
    }

    if (userCommand.toLowerCase().includes('previous version') || userCommand.toLowerCase().includes('go back')) {
      return this.undo()
    }

    // Format recent chat context
    const chatContext = recentMessages.length > 0
      ? '\n\nRECENT CONVERSATION:\n' + recentMessages.slice(-10).map(msg =>
          `${msg.nickname}: ${msg.text}`
        ).join('\n')
      : ''

    console.log('Processing command with GPT-4 Turbo:', userCommand)

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a document editor. You MUST edit the document based on user commands.

CRITICAL RULES:
- ALWAYS make the requested edit
- NEVER refuse or say it's unnecessary
- NEVER explain or add commentary
- Return ONLY the complete edited document with changes applied

Formatting:
- Bold: **text**
- Italic: *text*
- Strikethrough: ~~text~~
- Heading: # text
- Underline: <u>text</u>`
          },
          {
            role: 'user',
            content: `Current document:
${this.document}
${chatContext}

User command: ${userCommand}

Execute this edit and return the full document with changes applied.`
          }
        ],
        temperature: 0.1, // Very low for consistency
        max_tokens: 4000 // Plenty of room for full document
      })

      const editedDocument = completion.choices[0].message.content.trim()

      console.log('GPT-4 response length:', editedDocument.length, 'characters')
      console.log('GPT-4 response preview:', editedDocument.substring(0, 200))

      // Validate that something changed
      if (editedDocument === this.document) {
        console.warn('⚠️ No changes detected in document')
        return { success: false, error: 'No changes were made. The requested text might not have been found.' }
      }

      console.log('✓ Document edited successfully')

      // Save to history and update
      this.saveToHistory()
      this.document = editedDocument
      return { success: true, document: this.document }
    } catch (e) {
      console.error('❌ Failed to process command:', e)
      return { success: false, error: 'Failed to process command' }
    }
  }

  /**
   * Get current document state
   */
  getDocument() {
    return this.document
  }

  /**
   * Set document state (for initialization)
   */
  setDocument(doc) {
    this.document = doc
  }
}
