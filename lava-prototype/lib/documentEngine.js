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
   * GPT-4 intelligently understands context and figures out what to do
   */
  async parseIntent(userCommand, recentMessages = []) {
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

    // Format recent chat context
    const chatContext = recentMessages.length > 0
      ? '\n\nRECENT CONVERSATION:\n' + recentMessages.slice(-10).map(msg =>
          `${msg.nickname}: ${msg.text}`
        ).join('\n')
      : ''

    // Let GPT-4 understand the command in context
    const prompt = `You are editing a document. Understand what the user wants and how to do it.

CURRENT DOCUMENT:
${this.document}

${chatContext}

USER COMMAND: "${userCommand}"

If the user references something (like "the poem at the end" or "that paragraph"), find it in the document.
If the user wants formatting or transformation (like "display as a poem", "format as a list"), figure out what changes are needed.

Respond with ONLY valid JSON in this format:
{
  "action": "insert|delete|replace|format|transform|move|reorder",
  "target": "exact text to find (or position like start|end|after:text|before:text|paragraph:N)",
  "value": "new text, format type, or transformation description",
  "all": true/false (apply to all instances or just first),
  "explanation": "brief explanation of what you understood"
}

Actions:
- insert: Add new text at a position
- delete: Remove text
- replace: Replace text with other text
- format: Apply markdown formatting (bold, italic, heading, etc.)
- transform: Change the structure/layout of existing text (e.g., single line → poem format, list → paragraph)
- move: Move text to different position
- reorder: Change order of items

Examples:
"display the poem at the end in the form of a poem" → {"action":"transform","target":"[exact poem text]","value":"format as multi-line poem with proper line breaks","explanation":"Found poem at end, will reformat from single line to proper poem layout"}
"make Items to Buy bold" → {"action":"format","target":"Items to Buy","value":"bold","explanation":"Apply bold formatting"}
"add 'Hello' after the title" → {"action":"insert","target":"after:title","value":"Hello","explanation":"Insert text after title"}

CRITICAL: Respond with ONLY the JSON object, no explanations outside the JSON.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an intelligent document editor. You understand context, find referenced content in documents, and figure out what transformations are needed. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Slightly higher for better contextual understanding
        max_tokens: 1000 // More tokens for complex transformations
      })

      const response = completion.choices[0].message.content.trim()
      console.log('Intent parsing response:', response)

      // Extract JSON from response (in case GPT-4 adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      console.log('Parsed intent:', parsed.explanation || parsed.action)
      return parsed
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
    const { action, target, value, all, request, explanation } = operation

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
      case 'transform':
        return this.transformText(target, value, explanation)
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
        model: 'gpt-4-turbo-preview',
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
        max_tokens: 2000 // Increased for GPT-4 Turbo's 128K context
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
   * AI-powered text transformation
   * Uses GPT-4 to intelligently transform text structure/layout
   */
  async transformText(target, transformDescription, explanation = '') {
    if (!this.document.includes(target)) {
      return { success: false, error: `Cannot find "${target}"` }
    }

    console.log(`Transforming text: ${explanation || transformDescription}`)

    const prompt = `Transform the following text according to the instructions.

ORIGINAL TEXT:
${target}

TRANSFORMATION REQUESTED:
${transformDescription}

${explanation ? `CONTEXT: ${explanation}` : ''}

Instructions:
- Apply the requested transformation (e.g., format as poem with line breaks, convert to list, change layout)
- Preserve the content and meaning
- Return ONLY the transformed text, no explanations
- Use proper markdown formatting

Return the transformed text:`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a precise text transformer. You restructure and reformat text while preserving its content. Return only the transformed text with no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const transformedText = completion.choices[0].message.content.trim()
      console.log('Transformed text:', transformedText.substring(0, 100) + '...')

      // Replace the original text with transformed version
      this.saveToHistory()
      this.document = this.document.replace(target, transformedText)
      return { success: true, document: this.document }
    } catch (e) {
      console.error('Failed to transform text:', e)
      return { success: false, error: 'Failed to transform text' }
    }
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
  async processCommand(userCommand, recentMessages = []) {
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
        const genResult = await this.processCommand(genCommand, recentMessages)

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
    // Parse intent with GPT-4 (with chat context)
    const operation = await this.parseIntent(userCommand, recentMessages)
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
