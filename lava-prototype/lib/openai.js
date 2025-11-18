import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function updateDocumentWithAI(currentContent, instruction) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a document editor. Apply the requested changes to the document and return the complete updated content in markdown format. Do not include any explanations or comments, just the document content.',
        },
        {
          role: 'user',
          content: `Current document:\n\n${currentContent}\n\nInstruction: ${instruction}\n\nPlease update the document according to this instruction and return the complete updated document.`,
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
