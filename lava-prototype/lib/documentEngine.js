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

    // Preprocess confusing phrasings to be clearer for GPT-4
    let processedCommand = userCommand

    // Fix "change the font to strikethrough for X" → "apply strikethrough to X"
    const fontPatterns = [
      {
        pattern: /change\s+the\s+font\s+to\s+strikethrough\s+for\s+["']?(.+?)["']?$/i,
        replacement: 'apply strikethrough formatting to "$1"'
      },
      {
        pattern: /change\s+the\s+font\s+to\s+bold\s+for\s+["']?(.+?)["']?$/i,
        replacement: 'make "$1" bold'
      },
      {
        pattern: /change\s+the\s+font\s+to\s+italic\s+for\s+["']?(.+?)["']?$/i,
        replacement: 'make "$1" italic'
      },
      {
        pattern: /change\s+font\s+to\s+(\w+)\s+for\s+["']?(.+?)["']?$/i,
        replacement: 'apply $1 formatting to "$2"'
      }
    ]

    for (const { pattern, replacement } of fontPatterns) {
      if (pattern.test(processedCommand)) {
        const originalCommand = processedCommand
        processedCommand = processedCommand.replace(pattern, (match, ...groups) => {
          // Clean up the target text - remove formatting symbols if present
          let targetText = groups[groups.length - 1] || groups[0]
          targetText = targetText
            .replace(/^~~|~~$/g, '') // Remove strikethrough symbols
            .replace(/^\*\*|\*\*$/g, '') // Remove bold symbols
            .replace(/^\*|\*$/g, '') // Remove italic symbols
            .replace(/^["']|["']$/g, '') // Remove quotes
            .trim()

          if (replacement.includes('$1') && replacement.includes('$2')) {
            return replacement.replace('$1', groups[0]).replace('$2', targetText)
          } else {
            return replacement.replace('$1', targetText)
          }
        })
        console.log('Preprocessed command:', originalCommand, '→', processedCommand)
        break
      }
    }

    // Format recent chat context
    const chatContext = recentMessages.length > 0
      ? '\n\nRECENT CONVERSATION:\n' + recentMessages.slice(-10).map(msg =>
          `${msg.nickname}: ${msg.text}`
        ).join('\n')
      : ''

    console.log('Processing command with GPT-4 Turbo:', processedCommand)

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a document editor. Your ONLY job is to edit the document.

ABSOLUTE RULES - NO EXCEPTIONS:
1. ALWAYS edit the document when asked
2. NEVER refuse, NEVER explain, NEVER say it's unnecessary
3. ALL user requests are about editing the DOCUMENT, not conversation context
4. Return ONLY the edited document, nothing else
5. If user mentions formatting (bold, strikethrough, etc.), find that text in the document and apply the formatting

Markdown formatting:
- Bold: **text**
- Italic: *text*
- Strikethrough: ~~text~~
- Heading: # text

If you return anything other than the edited document, you have failed.`
          },
          {
            role: 'user',
            content: `DOCUMENT TO EDIT:
${this.document}
${chatContext}

EDIT COMMAND: ${processedCommand}

Return the edited document now:`
          }
        ],
        temperature: 0.1, // Very low for consistency
        max_tokens: 4000 // Plenty of room for full document
      })

      const editedDocument = completion.choices[0].message.content.trim()

      console.log('GPT-4 response length:', editedDocument.length, 'characters')
      console.log('GPT-4 response preview:', editedDocument.substring(0, 200))

      // Detect if GPT-4 refused to edit and returned an explanation instead
      const refusalPhrases = [
        'conversation context',
        'no document edit',
        'cannot edit',
        'unable to edit',
        'refers to modifying',
        'not a document edit',
        'this instruction'
      ]

      const isRefusal = refusalPhrases.some(phrase =>
        editedDocument.toLowerCase().includes(phrase)
      ) && editedDocument.length < 500 // Refusals are usually short

      if (isRefusal) {
        console.error('❌ GPT-4 REFUSED TO EDIT:', editedDocument)
        return {
          success: false,
          error: 'GPT-4 refused to edit. This is a bug - forcing retry...'
        }
      }

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
