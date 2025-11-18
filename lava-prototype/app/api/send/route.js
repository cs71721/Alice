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

    const message = await addMessage(nickname, text)

    const lavaMatch = text.match(/@lava\s+(.+)/i)
    if (lavaMatch) {
      const instruction = lavaMatch[1]
      
      try {
        const doc = await getDocument()
        const oldContent = doc.content
        const updatedContent = await updateDocumentWithAI(oldContent, instruction)
        
        await updateDocument(updatedContent)
        
        const preview = updatedContent.slice(0, 100) + (updatedContent.length > 100 ? '...' : '')
        
        await addMessage('DocumentUpdate', `Document updated by ${nickname}`, preview)
        
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
