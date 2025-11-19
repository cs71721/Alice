import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * DocumentEngine: Hybrid AI+Code architecture for precise document editing
 * - GPT-4 parses user intent into structured operations
 * - Deterministic code executes the operations precisely
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

    // Just send everything to GPT-4 Turbo and let it handle the edit
    const prompt = `You are a document editor. Edit the document based on the user's command.

CURRENT DOCUMENT:
${this.document}
${chatContext}

USER COMMAND: ${userCommand}

Instructions:
- Understand what the user wants (use chat context if they reference previous messages)
- Make ONLY the requested change to the document
- Preserve all other content exactly as written
- Return ONLY the complete edited document with the change applied
- If the user references something (like "the poem", "that section"), find it in the document
- Apply formatting properly (bold: **text**, italic: *text*, heading: # text, etc.)
- Do NOT add explanations or commentary

Return the edited document:`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a precise document editor. You make the exact changes requested while preserving everything else. Return only the edited document, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Low for consistency
        max_tokens: 4000 // Plenty of room for full document
      })

      const editedDocument = completion.choices[0].message.content.trim()

      // Validate that something changed
      if (editedDocument === this.document) {
        return { success: false, error: 'No changes were made. The requested text might not have been found.' }
      }

      console.log('Document edited successfully')

      // Save to history and update
      this.saveToHistory()
      this.document = editedDocument
      return { success: true, document: this.document }
    } catch (e) {
      console.error('Failed to process command:', e)
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
