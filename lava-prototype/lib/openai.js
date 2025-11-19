import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})


export async function processLavaCommand(currentContent, instruction, chatHistory = []) {
  try {
    // Import kv to access previous version
    const { kv } = await import('@vercel/kv')

    // Get previous version (might be null on first edit)
    const previousContent = await kv.get('document-previous') || currentContent

    // Format chat history for context
    const chatContext = chatHistory.length > 0
      ? '\n\nCHAT CONVERSATION CONTEXT:\n' + chatHistory.map(msg =>
          `${msg.nickname}: ${msg.text}`
        ).join('\n') + '\n'
      : ''

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are Lava, an AI document assistant. You MUST prefix responses with "EDIT:" or "CHAT:".

RULES FOR DETERMINING MODE:
- If the user wants ANY change to the document (add, remove, format, etc.) → Use EDIT mode
- If the user asks a question or wants information → Use CHAT mode
- When in doubt about formatting requests → Use EDIT mode

EDIT MODE (prefix with "EDIT:"):
- Return ONLY the complete edited document
- Make the requested change
- Preserve everything else exactly
- NO explanations, just the edited document

Common formatting requests to ALWAYS handle in EDIT mode:
- "change the font to X" → Apply X formatting
- "make X bold/italic/strikethrough" → Apply formatting
- "can you change" → YES, always edit
- Any mention of formatting → EDIT mode

Formatting syntax:
- Bold: **text**
- Italic: *text*
- Strikethrough: ~~text~~
- Underline: <u>text</u>
- Heading: # text

CHAT MODE (prefix with "CHAT:"):
- Answer questions
- Provide information
- Have conversations

NEVER refuse to edit. NEVER say "conversation context" or "cannot edit".`,
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
${chatContext}
INSTRUCTION: ${instruction}

Analyze whether this is an EDIT request (modify the document) or a CHAT request (question/conversation).
Execute the instruction precisely and respond with "EDIT:" followed by the complete edited document, OR "CHAT:" followed by your conversational response.`,
        },
      ],
      temperature: 0.1, // Lower temperature for more consistent edits
      max_tokens: 4000, // Restored for GPT-4 Turbo's 128K context
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('OpenAI error:', error)
    throw error
  }
}
