import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function processLavaCommand(currentContent, instruction) {
  try {
    // Import kv to access previous version
    const { kv } = await import('@vercel/kv')

    // Get previous version (might be null on first edit)
    const previousContent = await kv.get('document-previous') || currentContent

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are Lava, an AI assistant that helps with collaborative document editing. You can either:
1. EDIT the document when asked to modify, add, remove, or change content
2. CHAT conversationally when asked questions or given non-editing requests

CRITICAL: You must prefix your response with exactly "EDIT:" or "CHAT:" to indicate the mode.

EDIT MODE:
- Prefix: "EDIT:"
- Return the complete updated document in markdown format
- Never include explanations or meta-text, only the document content

CHAT MODE:
- Prefix: "CHAT:"
- Respond conversationally to questions or comments
- Keep responses concise and helpful`,
        },
        {
          role: 'user',
          content: `CURRENT DOCUMENT:
${currentContent}

PREVIOUS VERSION FOR REFERENCE:
${previousContent}

USER INSTRUCTION: ${instruction}

Analyze whether this is an EDIT request (modify the document) or a CHAT request (question/conversation).
Respond with "EDIT:" followed by the updated document, OR "CHAT:" followed by your conversational response.`,
        },
      ],
      temperature: 0.5,
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('OpenAI error:', error)
    throw error
  }
}
