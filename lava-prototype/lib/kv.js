import { kv } from '@vercel/kv'

// Initialize document if it doesn't exist
export async function initDocument() {
  const doc = await kv.get('document')
  if (!doc) {
    await kv.set('document', {
      content: '# Welcome to Lava\n\nStart collaborating by chatting on the left. Use @lava followed by instructions to update this document.\n\nFor example: "@lava add a section about getting started"',
      lastModified: Date.now(),
    })
  }
}

// Get document
export async function getDocument() {
  return await kv.get('document')
}

// Update document
export async function updateDocument(content) {
  return await kv.set('document', {
    content,
    lastModified: Date.now(),
  })
}

// Get messages
export async function getMessages() {
  const messages = await kv.get('messages')
  return messages || []
}

// Add message
export async function addMessage(nickname, text) {
  const messages = await getMessages()
  const newMessage = {
    id: Date.now(),
    nickname,
    text,
    timestamp: Date.now(),
  }
  messages.push(newMessage)
  
  // Keep only last 100 messages
  if (messages.length > 100) {
    messages.shift()
  }
  
  await kv.set('messages', messages)
  return newMessage
}
