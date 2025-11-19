import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import {
  addMessage,
  getDocument,
  updateDocument,
  getMessages,
  getVersions,
  getVersion,
  restoreVersion
} from '@/lib/kv'
import { DocumentEngine } from '@/lib/documentEngine'
import * as Diff from 'diff'
import {
  countMessageTokens,
  calculateContextBudget,
  truncateMessagesToFit
} from '@/lib/tokenCounter'

/**
 * Helper function to get human-readable time ago
 */
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

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

    // Clean hidden metadata from message before storing in chat
    // (metadata is used by backend but shouldn't be visible to users)
    const cleanText = text.replace(/<!--FULLCONTEXT:.+?-->/s, '').replace(/<!--FULLTEXT:.+?-->/s, '').trim()

    const message = await addMessage(nickname, cleanText)

    // Check for history commands first (simpler than @lava)
    const trimmedText = text.trim().toLowerCase()

    // Handle @history command
    if (trimmedText === '@history') {
      const versions = await getVersions(10)
      const currentDoc = await getDocument()

      let historyText = '📚 Recent versions:\n'
      historyText += `  v${currentDoc.version}: Current - ${currentDoc.changeSummary} (now)\n`

      for (const v of versions) {
        const timeAgo = getTimeAgo(v.lastModified)
        historyText += `  v${v.version}: ${v.lastEditor} - ${v.changeSummary} (${timeAgo})\n`
      }

      await addMessage('Lava', historyText)
      return NextResponse.json({ message })
    }

    // Handle @version or @v commands (now handled client-side by showing in document pane)
    // Just consume the command silently without adding to chat
    const versionMatch = text.match(/^@(?:version|v)\s+(\d+)$/i)
    if (versionMatch) {
      // Version viewing is now handled client-side
      return NextResponse.json({ message })
    }

    // Handle @diff command
    const diffMatch = text.match(/^@diff\s+(\d+)\s+(\d+)$/i)
    if (diffMatch) {
      const v1 = parseInt(diffMatch[1], 10)
      const v2 = parseInt(diffMatch[2], 10)

      const version1 = await getVersion(v1)
      const version2 = await getVersion(v2)

      if (!version1 || !version2) {
        await addMessage('Lava', `❌ Version ${!version1 ? v1 : v2} not found`)
      } else {
        const diffs = Diff.diffLines(version1.content, version2.content)
        let diffText = `📊 Changes from v${v1} to v${v2}:\n`

        let additions = 0
        let deletions = 0

        for (const part of diffs) {
          if (part.added) {
            additions += part.count || 1
          } else if (part.removed) {
            deletions += part.count || 1
          }
        }

        diffText += `  + ${additions} lines added\n`
        diffText += `  - ${deletions} lines removed\n`

        await addMessage('Lava', diffText)
      }

      return NextResponse.json({ message })
    }

    // Handle @restore command (needs confirmation)
    const restoreMatch = text.match(/^@restore\s+(\d+)$/i)
    if (restoreMatch) {
      const versionNum = parseInt(restoreMatch[1], 10)
      const versionData = await getVersion(versionNum)

      if (!versionData) {
        await addMessage('Lava', `❌ Version ${versionNum} not found`)
      } else {
        // Store pending restore in KV for confirmation
        await kv.set('pending-restore', {
          version: versionNum,
          requestedBy: nickname,
          timestamp: Date.now()
        }, { ex: 60 }) // Expire after 60 seconds

        await addMessage('Lava', `⚠️ This will restore to v${versionNum} (${versionData.lastEditor}'s version from ${getTimeAgo(versionData.lastModified)}).\nReply with "yes" or "confirm" to proceed, or wait 60 seconds to cancel.`)
      }

      return NextResponse.json({ message })
    }

    // Handle confirmation (natural language or @confirm)
    const confirmations = ['yes', 'confirm', 'ok', 'proceed', 'go ahead', 'do it', '@confirm', 'yep', 'yeah', 'sure']
    if (confirmations.includes(trimmedText)) {
      const pendingRestore = await kv.get('pending-restore')

      if (!pendingRestore) {
        await addMessage('Lava', '❌ No pending restoration to confirm')
      } else {
        try {
          const restoredDoc = await restoreVersion(pendingRestore.version, nickname)
          await kv.del('pending-restore')
          await addMessage(nickname, `Restored to v${pendingRestore.version} (created v${restoredDoc.version})`)

          return NextResponse.json({
            message,
            documentUpdated: true
          })
        } catch (error) {
          await addMessage('Lava', `❌ Failed to restore: ${error.message}`)
        }
      }

      return NextResponse.json({ message })
    }

    // @undo command removed - use version viewing and restore button instead

    // Original @lava command handling
    const lavaMatch = text.match(/@lava\s+([\s\S]+)/i)
    if (lavaMatch) {
      let instruction = lavaMatch[1]

      // Check for hidden FULLCONTEXT metadata (from highlighted text)
      const fullContextMatch = instruction.match(/<!--FULLCONTEXT:(.+?)-->/s)
      let selectedTextContext = null

      if (fullContextMatch) {
        try {
          const contextData = JSON.parse(fullContextMatch[1])
          selectedTextContext = contextData

          // Remove the hidden metadata from the instruction before processing
          instruction = instruction.replace(/<!--FULLCONTEXT:.+?-->/s, '').trim()

          // Build the CONTEXT format that the engine expects
          instruction = `${contextData.instruction}

CONTEXT: The user has highlighted this specific text to modify:
"""
${contextData.selectedText}
"""

IMPORTANT: Only apply "${contextData.instruction}" to the text shown above. Do not modify any other part of the document.`
        } catch (e) {
          console.error('Failed to parse FULLCONTEXT:', e)
        }
      }

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
