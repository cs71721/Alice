import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { addMessage, getDocument, updateDocument, getMessages } from '@/lib/kv'
import { DocumentEngine } from '@/lib/documentEngine'
import {
  countMessageTokens,
  calculateContextBudget,
  truncateMessagesToFit
} from '@/lib/tokenCounter'

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

// Removed estimateTokens - now using tiktoken via countMessageTokens

/**
 * Get adaptive chat context based on command and token limits
 * GPT-4 Turbo limit: 128,000 tokens total
 * Now uses tiktoken for accurate token counting
 */
function getAdaptiveContext(chatHistory, command, documentContent = '') {
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

  // Calculate available token budget
  const availableTokens = calculateContextBudget(documentContent)

  // Check token count and truncate if needed
  const messageTokens = countMessageTokens(messagesToSend)

  if (messageTokens > availableTokens) {
    // Use intelligent truncation
    messagesToSend = truncateMessagesToFit(messagesToSend, availableTokens)
  }

  return messagesToSend
}


export async function POST(request) {
  try {
    const { nickname, text } = await request.json()

    if (!nickname || !text) {
      return NextResponse.json(
        { error: 'Username and message are required' },
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

        // Save current version as previous BEFORE making changes
        await kv.set('document-previous', oldContent)

        // Initialize engine with current document
        const engine = new DocumentEngine()
        engine.setDocument(oldContent)

        // Process command with intent detection
        const result = await engine.processCommand(instruction, contextMessages)

        if (result.success) {
          if (result.mode === 'EDIT' || result.mode === 'CREATE') {
            // Document was modified
            const changeSummary = result.mode === 'EDIT' ? 'Applied edits' : 'Generated new content'
            await updateDocument(result.document, 'Lava', changeSummary)

            // Include version in Lava's response
            const updatedDoc = await getDocument()
            await addMessage('Lava', `${result.message} (v${updatedDoc.version})`)

            return NextResponse.json({
              message,
              documentUpdated: true
            })
          } else if (result.mode === 'CHAT') {
            // Conversational response, no document update
            await addMessage('Lava', result.message)

            return NextResponse.json({
              message,
              documentUpdated: false
            })
          }
        } else {
          // Handle unclear intent or errors
          await addMessage('Lava', result.message)

          return NextResponse.json({
            message,
            documentUpdated: false
          })
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
