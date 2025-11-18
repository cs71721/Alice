import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { addMessage, getDocument, updateDocument } from '@/lib/kv'
import { processLavaCommand } from '@/lib/openai'
import { DocumentEngine } from '@/lib/documentEngine'

/**
 * Detect if command is an editing operation or a question
 */
function isEditingCommand(instruction) {
  const editingKeywords = [
    'add', 'insert', 'delete', 'remove', 'replace', 'change',
    'make', 'format', 'bold', 'italic', 'underline', 'move',
    'reorder', 'undo', 'go back', 'previous version', 'heading',
    'strikethrough', 'quote', 'list', 'bullet',
    // Generation keywords
    'write', 'create', 'generate', 'draft', 'compose',
    'add a paragraph about', 'add a section on', 'add an introduction',
    'add a conclusion', 'elaborate on', 'expand on', 'add details about'
  ]

  const questionKeywords = [
    'what', 'how', 'why', 'when', 'where', 'who',
    'explain', 'tell me', 'show me', 'can you',
    'is there', 'are there', '?'
  ]

  const lowerInstruction = instruction.toLowerCase()

  // Check for question indicators first
  if (questionKeywords.some(keyword => lowerInstruction.includes(keyword))) {
    return false
  }

  // Check for editing indicators (including generation)
  if (editingKeywords.some(keyword => lowerInstruction.includes(keyword))) {
    return true
  }

  // Default to editing if unclear
  return true
}

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

        // HYBRID ARCHITECTURE: Detect if editing or chatting
        if (isEditingCommand(instruction)) {
          // EDITING MODE: Use DocumentEngine for precise edits
          console.log('Using DocumentEngine for editing command:', instruction)

          // Initialize engine with current document
          const engine = new DocumentEngine(oldContent)

          // Process command with hybrid AI+Code approach
          const result = await engine.processCommand(instruction)

          if (result.success) {
            // Update document with edited content
            await updateDocument(result.document)

            // Show success message in chat
            await addMessage('Lava', '✓ Document updated')

            return NextResponse.json({
              message,
              documentUpdated: true
            })
          } else {
            // Show error in chat
            await addMessage('Lava', `Could not edit: ${result.error}`)

            return NextResponse.json({
              message,
              documentUpdated: false
            })
          }
        } else {
          // CHAT MODE: Use GPT-4 for conversational responses
          console.log('Using GPT-4 chat mode for question:', instruction)

          const aiResponse = await processLavaCommand(oldContent, instruction)

          // Parse the AI response
          if (aiResponse.startsWith('EDIT:')) {
            // Fallback to old behavior if GPT-4 thinks it should edit
            const updatedContent = aiResponse.substring(5).trim()
            await updateDocument(updatedContent)
            await addMessage('DocumentUpdate', `Document updated by ${nickname}`)

            return NextResponse.json({
              message,
              documentUpdated: true
            })
          } else if (aiResponse.startsWith('CHAT:')) {
            const chatResponse = aiResponse.substring(5).trim()
            await addMessage('Lava', chatResponse)

            return NextResponse.json({
              message,
              documentUpdated: false
            })
          } else {
            // Fallback: treat as chat
            await addMessage('Lava', aiResponse)

            return NextResponse.json({
              message,
              documentUpdated: false
            })
          }
        }
      } catch (error) {
        console.error('Error processing @lava command:', error)
        await addMessage('Lava', `Error: ${error.message || 'Failed to process command'}`)

        return NextResponse.json({
          message,
          documentUpdated: false
        })
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
