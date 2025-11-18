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
   * Helper to extract insertion point from command
   */
  extractInsertionPoint(command) {
    const lower = command.toLowerCase()
    if (lower.includes('at the end') || lower.includes('to the end')) return 'end'
    if (lower.includes('at the beginning') || lower.includes('at the start')) return 'start'
    if (lower.includes('after')) {
      const match = command.match(/after\s+(?:the\s+)?["']?([^"'.,]+)["']?/i)
      if (match) return `after:${match[1].trim()}`
    }
    if (lower.includes('before')) {
      const match = command.match(/before\s+(?:the\s+)?["']?([^"'.,]+)["']?/i)
      if (match) return `before:${match[1].trim()}`
    }
    return 'end' // Default to end if not specified
  }

  /**
   * STEP 1: Parse user intent with GPT-4 (understanding)
   * GPT-4 converts natural language to structured operations
   */
  async parseIntent(userCommand) {
    // Check if this is a GENERATION request (creating new content with AI)
    const generationKeywords = [
      'write', 'create', 'generate', 'add a paragraph about',
      'add a section on', 'add an introduction', 'add a conclusion',
      'draft', 'compose', 'elaborate on', 'expand on', 'add details about'
    ]

    const isGeneration = generationKeywords.some(keyword =>
      userCommand.toLowerCase().includes(keyword)
    )

    if (isGeneration) {
      return {
        action: 'generate',
        request: userCommand,
        target: this.extractInsertionPoint(userCommand)
      }
    }

    // Otherwise, parse as manipulation operation
    const prompt = `Convert this editing command into a structured operation.

Command: "${userCommand}"

Respond with ONLY valid JSON in this format:
{
  "action": "insert|delete|replace|format|move|reorder",
  "target": "exact text to find or position (start|end|after:text|before:text|paragraph:N)",
  "value": "new text or format type (bold|italic|underline|heading1|heading2)",
  "all": true/false (apply to all instances or just first)
}

Examples:
"add 'Hello' after the title" → {"action":"insert","target":"after:title","value":"Hello"}
"make Items to Buy bold" → {"action":"format","target":"Items to Buy","value":"bold"}
"delete the second paragraph" → {"action":"delete","target":"paragraph:2","value":""}
"replace all 'PJs' with 'Products'" → {"action":"replace","target":"PJs","value":"Products","all":true}
"insert 'New text' at the beginning" → {"action":"insert","target":"start","value":"New text"}
"remove everything after Summary" → {"action":"delete","target":"after:Summary","value":""}
"change 'old' to 'new'" → {"action":"replace","target":"old","value":"new","all":false}

CRITICAL: Respond with ONLY the JSON object, no explanations.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a precise intent parser. You convert natural language editing commands into structured JSON operations. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 150 // Reduced to fit within token limits
      })

      const response = completion.choices[0].message.content.trim()
      console.log('Intent parsing response:', response)

      // Extract JSON from response (in case GPT-4 adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      return JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('Failed to parse intent:', e)
      return null
    }
  }

  /**
   * STEP 2: Execute operations with code (deterministic)
   * Precise, predictable text manipulation
   */
  executeOperation(operation) {
    const { action, target, value, all, request } = operation

    switch (action) {
      case 'generate':
        return this.handleGeneration(request, target)
      case 'insert':
        return this.insertText(target, value)
      case 'delete':
        return this.deleteText(target, value)
      case 'replace':
        return this.replaceText(target, value, all)
      case 'format':
        return this.formatText(target, value)
      case 'move':
        return this.moveText(target, value)
      case 'reorder':
        return this.reorderText(target, value)
      default:
        return { success: false, error: `Unknown action: ${action}` }
    }
  }

  /**
   * STEP 3: Generate NEW content with AI when needed
   */
  async generateContent(request, context = '') {
    const contextText = context || this.document.substring(0, 500)
    const truncated = !context && this.document.length > 500

    const prompt = `Generate the requested content for this document.

Request: "${request}"

Current document context:
${contextText}${truncated ? '\n...[truncated]' : ''}

Generate ONLY the requested content, no explanations or meta-text. Make it fit naturally with the document's existing tone and style. Return clean markdown.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a precise content generator. You create content that fits naturally into existing documents. Return only the content requested, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7, // Higher temperature for creative content
        max_tokens: 800 // Reduced to fit within token limits
      })

      const newContent = completion.choices[0].message.content.trim()
      console.log('Generated content:', newContent.substring(0, 100) + '...')

      return { success: true, content: newContent }
    } catch (e) {
      console.error('Failed to generate content:', e)
      return { success: false, error: 'Failed to generate content' }
    }
  }

  /**
   * Handle content generation + insertion
   */
  async handleGeneration(request, insertionPoint) {
    // First, generate the content
    const result = await this.generateContent(request)
    if (!result.success) return result

    // Then, insert it at the right place
    return this.insertText(insertionPoint, result.content)
  }

  /**
   * Precise text insertion at specific positions
   */
  insertText(target, text) {
    let newDoc = this.document

    if (target === 'start') {
      newDoc = text + '\n\n' + this.document
    } else if (target === 'end') {
      newDoc = this.document + '\n\n' + text
    } else if (target.startsWith('after:')) {
      const afterText = target.substring(6)
      const index = this.document.indexOf(afterText)
      if (index === -1) {
        return { success: false, error: `Cannot find "${afterText}"` }
      }

      const insertPos = index + afterText.length
      newDoc = this.document.slice(0, insertPos) + '\n' + text + this.document.slice(insertPos)
    } else if (target.startsWith('before:')) {
      const beforeText = target.substring(7)
      const index = this.document.indexOf(beforeText)
      if (index === -1) {
        return { success: false, error: `Cannot find "${beforeText}"` }
      }

      newDoc = this.document.slice(0, index) + text + '\n' + this.document.slice(index)
    } else {
      // Try to find the target text and insert after it
      const index = this.document.indexOf(target)
      if (index === -1) {
        return { success: false, error: `Cannot find "${target}"` }
      }
      const insertPos = index + target.length
      newDoc = this.document.slice(0, insertPos) + '\n' + text + this.document.slice(insertPos)
    }

    this.saveToHistory()
    this.document = newDoc
    return { success: true, document: newDoc }
  }

  /**
   * Precise text deletion
   */
  deleteText(target, value) {
    let newDoc = this.document

    if (target.startsWith('paragraph:')) {
      const num = parseInt(target.substring(10))
      const paragraphs = this.document.split('\n\n').filter(p => p.trim())
      if (num > 0 && num <= paragraphs.length) {
        paragraphs.splice(num - 1, 1)
        newDoc = paragraphs.join('\n\n')
      } else {
        return { success: false, error: `Paragraph ${num} not found (document has ${paragraphs.length} paragraphs)` }
      }
    } else if (target.startsWith('after:')) {
      const afterText = target.substring(6)
      const index = this.document.indexOf(afterText)
      if (index === -1) {
        return { success: false, error: `Cannot find "${afterText}"` }
      }
      newDoc = this.document.slice(0, index + afterText.length)
    } else if (target.startsWith('before:')) {
      const beforeText = target.substring(7)
      const index = this.document.indexOf(beforeText)
      if (index === -1) {
        return { success: false, error: `Cannot find "${beforeText}"` }
      }
      newDoc = this.document.slice(index)
    } else {
      // Delete specific text
      if (!this.document.includes(target)) {
        return { success: false, error: `Cannot find "${target}"` }
      }
      newDoc = this.document.replace(target, '')
    }

    this.saveToHistory()
    this.document = newDoc.trim()
    return { success: true, document: newDoc }
  }

  /**
   * Precise text replacement
   */
  replaceText(target, replacement, all = false) {
    if (!this.document.includes(target)) {
      return { success: false, error: `Cannot find "${target}"` }
    }

    this.saveToHistory()
    if (all) {
      this.document = this.document.replaceAll(target, replacement)
    } else {
      this.document = this.document.replace(target, replacement)
    }

    return { success: true, document: this.document }
  }

  /**
   * Precise text formatting (bold, italic, headings, etc.)
   */
  formatText(target, format) {
    if (!this.document.includes(target)) {
      return { success: false, error: `Cannot find "${target}"` }
    }

    const formatters = {
      'bold': (text) => `**${text}**`,
      'italic': (text) => `*${text}*`,
      'underline': (text) => `<u>${text}</u>`,
      'heading1': (text) => `# ${text}`,
      'heading2': (text) => `## ${text}`,
      'heading3': (text) => `### ${text}`,
      'strikethrough': (text) => `~~${text}~~`,
      'code': (text) => `\`${text}\``,
      'quote': (text) => `> ${text}`
    }

    const formatter = formatters[format]
    if (!formatter) {
      return { success: false, error: `Unknown format: ${format}` }
    }

    this.saveToHistory()
    this.document = this.document.replace(target, formatter(target))
    return { success: true, document: this.document }
  }

  /**
   * Move text from one location to another
   */
  moveText(target, destination) {
    if (!this.document.includes(target)) {
      return { success: false, error: `Cannot find "${target}"` }
    }

    this.saveToHistory()

    // Remove from current position
    const textToMove = target
    let newDoc = this.document.replace(target, '')

    // Insert at new position
    if (destination === 'start') {
      newDoc = textToMove + '\n\n' + newDoc
    } else if (destination === 'end') {
      newDoc = newDoc + '\n\n' + textToMove
    } else if (destination.startsWith('after:')) {
      const afterText = destination.substring(6)
      const index = newDoc.indexOf(afterText)
      if (index === -1) {
        this.document = this.history.pop() // Undo
        return { success: false, error: `Cannot find destination "${afterText}"` }
      }
      const insertPos = index + afterText.length
      newDoc = newDoc.slice(0, insertPos) + '\n' + textToMove + newDoc.slice(insertPos)
    }

    this.document = newDoc.trim()
    return { success: true, document: this.document }
  }

  /**
   * Reorder paragraphs or sections
   */
  reorderText(target, value) {
    // Implementation for reordering
    return { success: false, error: 'Reorder not yet implemented' }
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
   * Handles both simple and complex/mixed commands
   */
  async processCommand(userCommand) {
    // Special commands
    if (userCommand.toLowerCase().includes('undo')) {
      return this.undo()
    }

    if (userCommand.toLowerCase().includes('previous version') || userCommand.toLowerCase().includes('go back')) {
      return this.undo()
    }

    // Detect mixed commands (e.g., "write a paragraph about pricing and make it bold")
    const hasGeneration = /write|create|draft|compose|generate/.test(userCommand.toLowerCase())
    const hasFormatting = /and\s+(make|format|turn)\s+(it|that|this)\s+(bold|italic|underline|heading)/i.test(userCommand)

    if (hasGeneration && hasFormatting) {
      console.log('Detected mixed command: generation + formatting')

      // Extract the generation part (everything before "and make/format")
      const genMatch = userCommand.match(/^(.+?)\s+and\s+(make|format|turn)/i)
      if (genMatch) {
        const genCommand = genMatch[1]
        const formatMatch = userCommand.match(/(make|format|turn)\s+(it|that|this)\s+(\w+)/i)

        // First, generate the content
        const genResult = await this.processCommand(genCommand)

        if (genResult.success) {
          // Store the current document before formatting
          const beforeFormat = this.document

          // Find what was just added (last paragraph/section)
          const oldLines = this.history[this.history.length - 1]?.split('\n') || []
          const newLines = this.document.split('\n')
          const addedContent = newLines.slice(oldLines.length).join('\n').trim()

          if (addedContent && formatMatch) {
            const formatType = formatMatch[3].toLowerCase()
            // Format the newly added content
            const formatResult = await this.formatText(addedContent, formatType)
            if (formatResult.success) {
              return formatResult
            }
          }

          return genResult
        }
        return genResult
      }
    }

    // Handle as single operation for simple commands
    // Parse intent with GPT-4
    const operation = await this.parseIntent(userCommand)
    if (!operation) {
      return { success: false, error: 'Could not understand the command. Try being more specific.' }
    }

    console.log('Parsed operation:', operation)

    // Execute operation with code
    return this.executeOperation(operation)
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
