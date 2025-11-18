import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Smart pattern recognition for common editing requests
function enhanceInstruction(instruction) {
  const patterns = [
    // Formatting
    { pattern: /make (.+) bold/i,
      replace: 'Find "$1" and format it as bold using **$1**' },
    { pattern: /bold (.+)/i,
      replace: 'Find "$1" and format it as bold using **$1**' },
    { pattern: /italicize (.+)/i,
      replace: 'Find "$1" and format it as italic using *$1*' },
    { pattern: /underline (.+)/i,
      replace: 'Find "$1" and format it with <u>$1</u>' },

    // Structure
    { pattern: /add a heading (.+)/i,
      replace: 'Add "# $1" as a new heading' },
    { pattern: /make (.+) a heading/i,
      replace: 'Find "$1" and format it as a heading with # $1' },
    { pattern: /create a list of (.+)/i,
      replace: 'Format $1 as a bullet list with - before each item' },

    // Insertion
    { pattern: /add "(.+)" after (.+)/i,
      replace: 'Find "$2" and insert "$1" immediately after it' },
    { pattern: /insert (.+) before (.+)/i,
      replace: 'Find "$2" and insert "$1" immediately before it' },
    { pattern: /add (.+) at the (beginning|top)/i,
      replace: 'Insert "$1" at the very beginning of the document' },
    { pattern: /add (.+) at the (end|bottom)/i,
      replace: 'Insert "$1" at the very end of the document' },

    // Deletion
    { pattern: /delete (.+)/i,
      replace: 'Find and remove all instances of "$1"' },
    { pattern: /remove (.+)/i,
      replace: 'Find and remove all instances of "$1"' },
    { pattern: /delete everything after (.+)/i,
      replace: 'Find "$1" and delete all text that comes after it' },
    { pattern: /remove everything before (.+)/i,
      replace: 'Find "$1" and delete all text that comes before it' },

    // Replacement
    { pattern: /change (.+) to (.+)/i,
      replace: 'Replace all instances of "$1" with "$2"' },
    { pattern: /replace (.+) with (.+)/i,
      replace: 'Replace all instances of "$1" with "$2"' },

    // Movement
    { pattern: /move (.+) after (.+)/i,
      replace: 'Find "$1", remove it from its current position, and place it after "$2"' },
    { pattern: /move (.+) to the (top|beginning)/i,
      replace: 'Find "$1", remove it from its current position, and place it at the beginning' },

    // Case changes
    { pattern: /uppercase (.+)/i,
      replace: 'Find "$1" and change it to UPPERCASE' },
    { pattern: /lowercase (.+)/i,
      replace: 'Find "$1" and change it to lowercase' },
    { pattern: /capitalize (.+)/i,
      replace: 'Find "$1" and change it to Title Case' },
  ]

  // Check each pattern
  for (const { pattern, replace } of patterns) {
    if (pattern.test(instruction)) {
      const enhanced = instruction.replace(pattern, replace)
      console.log('Enhanced instruction:', instruction, '->', enhanced)
      return enhanced
    }
  }

  return instruction // Return as-is if no pattern matches
}

// Validate that edits were actually made
function validateEdit(originalDoc, editedDoc, instruction) {
  // Check if document actually changed
  if (originalDoc === editedDoc) {
    return {
      success: false,
      error: 'No changes were made. The text might not have been found.',
      suggestion: 'Try being more specific about which text to edit.'
    }
  }

  // For formatting commands, verify formatting was applied
  if (instruction.includes('bold') && !editedDoc.includes('**')) {
    return {
      success: false,
      error: 'Bold formatting may not have been applied correctly.',
      suggestion: 'Try selecting the exact text to make bold.'
    }
  }

  if (instruction.includes('underline') && !editedDoc.includes('<u>')) {
    return {
      success: false,
      error: 'Underline formatting may not have been applied correctly.',
      suggestion: 'Try selecting the exact text to underline.'
    }
  }

  return { success: true }
}

export async function processLavaCommand(currentContent, instruction) {
  try {
    // Import kv to access previous version
    const { kv } = await import('@vercel/kv')

    // Get previous version (might be null on first edit)
    const previousContent = await kv.get('document-previous') || currentContent

    // Enhance the instruction for better precision
    const enhancedInstruction = enhanceInstruction(instruction)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are Lava, a PRECISE document editor that handles ALL types of edits. You can either:
1. EDIT the document when asked to modify, add, remove, or change content
2. CHAT conversationally when asked questions or given non-editing requests

CRITICAL: You must prefix your response with exactly "EDIT:" or "CHAT:" to indicate the mode.

FORMATTING RULES:
- Bold: **text** or <b>text</b>
- Italic: *text* or <i>text</i>
- Underline: <u>text</u>
- Strikethrough: ~~text~~
- Heading 1: # Text
- Heading 2: ## Text
- Heading 3: ### Text
- Bullet list: - item or • item
- Numbered list: 1. item
- Blockquote: > text
- Code: \`code\` or \`\`\`code block\`\`\`
- Link: [text](url)
- Horizontal line: ---

EDITING OPERATIONS YOU MUST HANDLE:
1. INSERT/ADD: Add text at specific positions (beginning, end, after X, before Y, between X and Y)
2. DELETE/REMOVE: Remove specific text, paragraphs, sections, or everything after/before a point
3. REPLACE: Replace one piece of text with another (single or all occurrences)
4. MOVE: Move text from one location to another
5. FORMAT: Apply any formatting to specified text
6. REORDER: Change the order of paragraphs, lists, or sections
7. MERGE: Combine paragraphs or sections
8. SPLIT: Break apart paragraphs at specific points
9. CASE: Change to UPPERCASE, lowercase, Title Case, Sentence case
10. LISTS: Convert text to lists, or lists back to paragraphs
11. STRUCTURE: Add sections, subsections, table of contents
12. CLEAN: Remove formatting, extra spaces, empty lines

CRITICAL RULES FOR EDIT MODE:
- Prefix with "EDIT:"
- Make ONLY the requested change
- Preserve ALL other text exactly as written
- Never refuse edits or argue about necessity
- If text to edit cannot be found, return "CHAT: ERROR: Cannot find [exact text]"
- Never add explanations or commentary in the document
- Return ONLY the complete edited document in markdown format
- Use low temperature for consistency

CHAT MODE:
- Prefix with "CHAT:"
- Respond conversationally to questions or comments
- Keep responses concise and helpful
- Use this mode for questions, clarifications, or non-editing requests`,
        },
        {
          role: 'user',
          content: `CURRENT DOCUMENT:
<<<DOCUMENT_START>>>
${currentContent}
<<<DOCUMENT_END>>>

PREVIOUS VERSION FOR REFERENCE:
<<<PREVIOUS_START>>>
${previousContent}
<<<PREVIOUS_END>>>

INSTRUCTION: ${enhancedInstruction}

Analyze whether this is an EDIT request (modify the document) or a CHAT request (question/conversation).
Execute the instruction precisely and respond with "EDIT:" followed by the complete edited document, OR "CHAT:" followed by your conversational response.`,
        },
      ],
      temperature: 0.1, // Lower temperature for more consistent edits
      max_tokens: 4000,
    })

    const response = completion.choices[0].message.content

    // Validate EDIT responses
    if (response.startsWith('EDIT:')) {
      const editedContent = response.substring(5).trim()
      const validation = validateEdit(currentContent, editedContent, instruction)

      if (!validation.success) {
        console.warn('Edit validation failed:', validation.error)
        return `CHAT: ${validation.error} ${validation.suggestion}`
      }
    }

    return response
  } catch (error) {
    console.error('OpenAI error:', error)
    throw error
  }
}
