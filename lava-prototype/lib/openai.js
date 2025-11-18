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
          content: 'You are a document editor. Apply the requested changes to the document and return the complete updated content in markdown format. Do not include any explanations or comments, just the document content.',
        },
        {
          role: 'user',
          content: `Current document:\n\n${currentContent}\n\nPrevious version (use if user wants to revert/undo):\n\n${previousContent}\n\nInstruction: ${instruction}\n\nReturn the appropriate version based on the instruction.`,
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
