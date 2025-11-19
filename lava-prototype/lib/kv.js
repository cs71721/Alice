import { kv } from '@vercel/kv'

export async function initDocument() {
  const doc = await kv.get('document')
  if (!doc) {
    await kv.set('document', {
      content: '# Welcome to Lava\n\nStart collaborating by chatting on the left. Use @lava followed by instructions to update this document.\n\nFor example: "@lava add a section about getting started"',
      lastModified: Date.now(),
      version: 1,
      lastEditor: 'System',
      changeSummary: 'Initial document created'
    })
  } else if (!doc.version) {
    // Migrate existing document to versioned structure
    await kv.set('document', {
      ...doc,
      version: 1,
      lastEditor: 'Unknown',
      changeSummary: 'Document versioning enabled'
    })
  }
}

export async function getDocument() {
  return await kv.get('document')
}

export async function updateDocument(content, editor = 'Lava', changeSummary = 'Document updated') {
  const currentDoc = await getDocument()
  const newVersion = (currentDoc?.version || 0) + 1

  return await kv.set('document', {
    content,
    lastModified: Date.now(),
    version: newVersion,
    lastEditor: editor,
    changeSummary
  })
}

/**
 * Update document with full metadata tracking
 * @param {string} content - The new document content
 * @param {string} editor - Who made the change (e.g., "Lava", "Manual", "User:nickname")
 * @param {string} changeSummary - Human-readable summary of the change
 * @returns {Object} The updated document
 */
export async function updateDocumentWithMetadata(content, editor, changeSummary) {
  return await updateDocument(content, editor, changeSummary)
}

/**
 * Get document version history (last N versions)
 * For future implementation when we store version history
 */
export async function getDocumentHistory(limit = 10) {
  // Future: Store and retrieve version history
  // For now, just return current version info
  const doc = await getDocument()
  if (!doc) return []

  return [{
    version: doc.version || 1,
    lastEditor: doc.lastEditor || 'Unknown',
    changeSummary: doc.changeSummary || 'No summary',
    lastModified: doc.lastModified
  }]
}

export async function getMessages() {
  const messages = await kv.get('messages')
  return messages || []
}

export async function addMessage(nickname, text, preview = null) {
  const messages = await getMessages()
  const newMessage = {
    id: Date.now(),
    nickname,
    text,
    timestamp: Date.now(),
  }

  if (preview) {
    newMessage.preview = preview
  }

  messages.push(newMessage)

  // REMOVED: message limit - keep ALL messages for full conversation history
  // This is a living document of the discussion, not a chat that forgets
  // if (messages.length > 100) {
  //   messages.shift()
  // }

  await kv.set('messages', messages)
  return newMessage
}