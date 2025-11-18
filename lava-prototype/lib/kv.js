import { kv } from '@vercel/kv'

export async function initDocument() {
  const doc = await kv.get('document')
  if (!doc) {
    await kv.set('document', {
      content: '# Welcome to Lava\n\nStart collaborating by chatting on the left. Use @lava followed by instructions to update this document.\n\nFor example: "@lava add a section about getting started"',
      lastModified: Date.now(),
    })
  }
}

export async function getDocument() {
  return await kv.get('document')
}

export async function updateDocument(content) {
  return await kv.set('document', {
    content,
    lastModified: Date.now(),
  })
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
