import { NextResponse } from 'next/server'
import { addMessage, getDocument, updateDocument } from '@/lib/kv'
import { updateDocumentWithAI } from '@/lib/openai'

export async function POST(request) {
  try {
    const { nickname, text } = await request.json()

    if (!nickname || !text) {
      return NextResponse.json(
        { error: 'Nickname and text are required' },
        { status: 400 }
      )
    }

    // Add message to chat
    const message = await addMessage(nickname, text)

    // Check if message contains @lava command
    const lavaMatch = text.match(/@lava\s+(.+)/i)
    if (lavaMatch) {
      const instruction = lavaMatch[1]
      
      try {
        // Get current document
        const doc = await getDocument()
        
        // Update document using AI
        const updatedContent = await updateDocumentWithAI(
          doc.content,
          instruction
        )
        
        // Save updated document
        await updateDocument(updatedContent)
        
        // Add system message about the update
        await addMessage('System', `Document updated by ${nickname} using @lava`)
        
        return NextResponse.json({ 
          message, 
          documentUpdated: true 
        })
      } catch (error) {
        console.error('Error updating document:', error)
        await addMessage('System', 'Error: Failed to update document with @lava command')
      }
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
