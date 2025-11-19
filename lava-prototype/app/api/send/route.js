import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { addMessage, getDocument, updateDocument, getMessages } from '@/lib/kv'
import { processLavaCommand } from '@/lib/openai'
import { DocumentEngine } from '@/lib/documentEngine'

/**
 * Determine how much context is needed based on command type
 */
function determineContextNeeded(command) {
  const fullContextKeywords = [
    'summarize', 'summary', 'recap', 'overview',
    'everything', 'all', 'entire', 'whole conversation',
    'from the beginning', 'full discussion', 'all messages',
    'complete history', 'what we discussed', 'conversation so far'
  ]

  const mediumContextKeywords = [
    'recent', 'last few', 'we discussed',
    'earlier', 'before', 'previous', 'mentioned',
    'said', 'talked about', 'we were', 'someone'
  ]

  const cmdLower = command.toLowerCase()

  // Check what type of command it is
  if (fullContextKeywords.some(keyword => cmdLower.includes(keyword))) {
    return 'full' // Send ALL messages (for summarization)
  } else if (mediumContextKeywords.some(keyword => cmdLower.includes(keyword))) {
    return 'medium' // Send last 30-50 messages (for contextual questions)
  } else {
    return 'recent' // Send last 10-15 messages (for simple edits/questions)
  }
}

/**
 * Estimate token count for messages (rough approximation)
 * More conservative: 1 token ≈ 3 characters (accounts for tokenization overhead)
 */
function estimateTokens(messages) {
  const totalChars = messages.reduce((sum, msg) => sum + (msg.text?.length || 0) + (msg.nickname?.length || 0), 0)
  return Math.ceil(totalChars / 3) // More conservative estimate
}

/**
 * Get adaptive chat context based on command and token limits
 * GPT-4 Turbo limit: 128,000 tokens total
 * Budget: generous room for everything - no aggressive truncation needed!
 */
function getAdaptiveContext(chatHistory, command, documentContent = '') {
  const MAX_TOTAL_TOKENS = 128000 // GPT-4 Turbo: 128K tokens!
  const DOCUMENT_BUFFER = Math.ceil(documentContent.length / 3) + 500 // Document + formatting
  const COMPLETION_TOKENS = 4000 // Restored to 4000 (plenty of room now)
  const SYSTEM_PROMPT_TOKENS = 1000 // System instructions
  const MAX_CONTEXT_TOKENS = MAX_TOTAL_TOKENS - DOCUMENT_BUFFER - COMPLETION_TOKENS - SYSTEM_PROMPT_TOKENS
  // This will be ~122,000 tokens for context! (roughly 300-400 messages)
  const contextLevel = determineContextNeeded(command)

  let messagesToSend

  switch (contextLevel) {
    case 'full':
      messagesToSend = chatHistory // All messages
      break
    case 'medium':
      messagesToSend = chatHistory.slice(-30) // Last 30
      break
    case 'recent':
      messagesToSend = chatHistory.slice(-10) // Last 10
      break
  }

  // Check token count and truncate if needed
  let estimatedTokens = estimateTokens(messagesToSend)

  console.log(`📊 Token budget: MAX=${MAX_CONTEXT_TOKENS}, Document=${DOCUMENT_BUFFER}, Messages=${estimatedTokens}`)

  if (estimatedTokens > MAX_CONTEXT_TOKENS) {
    console.log(`⚠️ Context too large (${estimatedTokens} tokens > ${MAX_CONTEXT_TOKENS}), truncating...`)

    // Intelligently truncate: keep most recent messages
    while (estimatedTokens > MAX_CONTEXT_TOKENS && messagesToSend.length > 3) {
      // Remove from the middle (keep first few for context, last few for recency)
      const removeIndex = Math.floor(messagesToSend.length / 2)
      messagesToSend.splice(removeIndex, 1)
      estimatedTokens = estimateTokens(messagesToSend)
    }

    console.log(`✓ Truncated to ${messagesToSend.length} messages (${estimatedTokens} tokens)`)
  } else {
    console.log(`✓ Sending ${messagesToSend.length} messages (${estimatedTokens} tokens) - level: ${contextLevel}`)
  }

  return messagesToSend
}

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
        // Fetch chat history and document
        const chatHistory = await getMessages()
        const doc = await getDocument()
        const oldContent = doc.content

        // Get adaptive context based on command type (with document size considered)
        const contextMessages = getAdaptiveContext(chatHistory, instruction, oldContent)

        // === DIAGNOSTIC LOGGING (server-side only) ===
        console.log('=== LAVA PROCESSING ===')
        console.log('Command:', instruction)
        console.log('Total history:', chatHistory ? chatHistory.length + ' messages' : 'NO')
        console.log('Context sent:', contextMessages.length + ' messages')
        console.log('Is editing command?', isEditingCommand(instruction))
        console.log('=======================')

        // Save current version as previous BEFORE making changes
        await kv.set('document-previous', oldContent)

        // HYBRID ARCHITECTURE: Detect if editing or chatting
        if (isEditingCommand(instruction)) {
          // EDITING MODE: Use DocumentEngine for precise edits
          console.log('Using DocumentEngine for editing command:', instruction)

          // Initialize engine with current document
          const engine = new DocumentEngine(oldContent)

          // Process command with hybrid AI+Code approach (pass chat context)
          const result = await engine.processCommand(instruction, contextMessages)

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

          const aiResponse = await processLavaCommand(oldContent, instruction, contextMessages)

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
