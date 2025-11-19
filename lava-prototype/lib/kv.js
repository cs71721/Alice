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
  const timestamp = Date.now()

  // Save current version to history before updating
  if (currentDoc && currentDoc.content) {
    await saveVersion(currentDoc.version || 1, {
      content: currentDoc.content,
      lastModified: currentDoc.lastModified,
      lastEditor: currentDoc.lastEditor,
      changeSummary: currentDoc.changeSummary
    })
  }

  // Update the main document
  const newDoc = {
    content,
    lastModified: timestamp,
    version: newVersion,
    lastEditor: editor,
    changeSummary
  }

  await kv.set('document', newDoc)

  // Also save the new version to history
  await saveVersion(newVersion, newDoc)

  return newDoc
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
 * Save a version to history
 * @param {number} version - Version number
 * @param {Object} data - Version data (content, editor, etc.)
 */
async function saveVersion(version, data) {
  // Save the version data
  await kv.set(`document-v${version}`, {
    version,
    content: data.content,
    lastModified: data.lastModified,
    lastEditor: data.lastEditor,
    changeSummary: data.changeSummary
  })

  // Update the version index
  const index = await kv.get('document-versions-index') || []
  if (!index.includes(version)) {
    index.push(version)
    index.sort((a, b) => a - b) // Keep sorted

    // Keep only last 100 versions
    if (index.length > 100) {
      const toDelete = index.shift()
      await kv.del(`document-v${toDelete}`)
    }

    await kv.set('document-versions-index', index)
  }
}

/**
 * Get a specific version
 * @param {number} version - Version number
 * @returns {Object|null} Version data or null if not found
 */
export async function getVersion(version) {
  return await kv.get(`document-v${version}`)
}

/**
 * Get list of available versions
 * @param {number} limit - Maximum number of versions to return
 * @returns {Array} Array of version metadata
 */
export async function getVersions(limit = 20) {
  const index = await kv.get('document-versions-index') || []
  const versions = index.slice(-limit).reverse() // Most recent first

  const versionList = []
  for (const v of versions) {
    const data = await kv.get(`document-v${v}`)
    if (data) {
      versionList.push({
        version: v,
        lastEditor: data.lastEditor,
        changeSummary: data.changeSummary,
        lastModified: data.lastModified
      })
    }
  }

  return versionList
}

/**
 * Restore a specific version
 * @param {number} version - Version to restore
 * @param {string} restoredBy - Who is restoring
 * @returns {Object} The restored document
 */
export async function restoreVersion(version, restoredBy = 'System') {
  const versionData = await getVersion(version)
  if (!versionData) {
    throw new Error(`Version ${version} not found`)
  }

  // Update the document with restored content
  return await updateDocument(
    versionData.content,
    restoredBy,
    `Restored to version ${version} (${versionData.changeSummary})`
  )
}

/**
 * Get document version history (last N versions)
 * Now actually implemented!
 */
export async function getDocumentHistory(limit = 10) {
  return await getVersions(limit)
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