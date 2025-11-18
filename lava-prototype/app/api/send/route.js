import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { addMessage, getDocument, updateDocument } from '@/lib/kv'
import { processLavaCommand } from '@/lib/openai'

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

    const lavaMatch = text.match(/@lava\s+([\s\S]+)/i)
    if (lavaMatch) {
      const instruction = lavaMatch[1]

      try {
        const doc = await getDocument()
        const oldContent = doc.content

        // Save current version as previous BEFORE making changes
        await kv.set('document-previous', oldContent)

        const aiResponse = await processLavaCommand(oldContent, instruction)

        // Parse the AI response to determine mode
        if (aiResponse.startsWith('EDIT:')) {
          // EDIT mode: Update the document
          const updatedContent = aiResponse.substring(5).trim()

          await updateDocument(updatedContent)

          const preview = updatedContent.slice(0, 100) + (updatedContent.length > 100 ? '...' : '')

          await addMessage('DocumentUpdate', `Document updated by ${nickname}`, preview)

          return NextResponse.json({
            message,
            documentUpdated: true
          })
        } else if (aiResponse.startsWith('CHAT:')) {
          // CHAT mode: Post response as a message from Lava
          const chatResponse = aiResponse.substring(5).trim()

          await addMessage('Lava', chatResponse)

          return NextResponse.json({
            message,
            documentUpdated: false
          })
        } else {
          // Fallback: treat as chat if no prefix found
          await addMessage('Lava', aiResponse)

          return NextResponse.json({
            message,
            documentUpdated: false
          })
        }
      } catch (error) {
        console.error('Error processing @lava command:', error)
        await addMessage('System', 'Error: Failed to process @lava command')
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
