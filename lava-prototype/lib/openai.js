import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function updateDocumentWithAI(currentContent, instruction) {
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
          content: 'You are a document editor. Apply the requested changes and return ONLY the document content in markdown format. Never include prompt text or meta-instructions in your response.',
        },
        {
          role: 'user',
          content: `CURRENT DOCUMENT:
${currentContent}

PREVIOUS VERSION FOR REFERENCE:
${previousContent}

USER INSTRUCTION: ${instruction}

Apply the instruction and return ONLY the updated document content. Do not include any explanations, labels like "Previous version", or meta-text.`,
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
