// Lazy-load tiktoken to avoid WASM loading issues in serverless environments
// Cache the encoder for performance
let encoder = null
let tiktokenLoadAttempted = false

/**
 * Get the tiktoken encoder for GPT-4
 * Uses cl100k_base encoding which is used by GPT-4
 */
function getEncoder() {
  if (!tiktokenLoadAttempted) {
    tiktokenLoadAttempted = true
    try {
      // Dynamically import tiktoken only when needed
      const { encoding_for_model } = require('tiktoken')
      // GPT-4 uses cl100k_base encoding
      encoder = encoding_for_model('gpt-4-turbo')
      console.log('✓ Tiktoken loaded successfully')
    } catch (error) {
      console.warn('⚠️ Tiktoken not available, using fallback estimation:', error.message)
      encoder = null
    }
  }
  return encoder
}

/**
 * Count exact tokens in a text string using tiktoken
 * @param {string} text - The text to count tokens for
 * @returns {number} The number of tokens
 */
export function countTokens(text) {
  const enc = getEncoder()

  if (!enc) {
    // Fallback to estimation if tiktoken fails
    // More conservative: ~4 chars per token for English text
    return Math.ceil(text.length / 4)
  }

  try {
    const tokens = enc.encode(text)
    return tokens.length
  } catch (error) {
    console.warn('Error counting tokens, falling back to estimation', error)
    return Math.ceil(text.length / 4)
  }
}

/**
 * Count tokens for an array of messages (chat format)
 * Accounts for message formatting overhead
 * @param {Array} messages - Array of message objects with text and nickname
 * @returns {number} Total token count
 */
export function countMessageTokens(messages) {
  if (!messages || messages.length === 0) return 0

  const enc = getEncoder()

  if (!enc) {
    // Fallback estimation including overhead
    const totalChars = messages.reduce((sum, msg) => {
      return sum + (msg.text?.length || 0) + (msg.nickname?.length || 0) + 10 // overhead
    }, 0)
    return Math.ceil(totalChars / 4)
  }

  try {
    let totalTokens = 0

    for (const msg of messages) {
      // Format as it would appear in the prompt
      const formatted = `${msg.nickname}: ${msg.text}`
      totalTokens += countTokens(formatted)
      // Add overhead for message structure (approximately 4 tokens per message)
      totalTokens += 4
    }

    return totalTokens
  } catch (error) {
    console.warn('Error counting message tokens, falling back to estimation', error)
    const totalChars = messages.reduce((sum, msg) => {
      return sum + (msg.text?.length || 0) + (msg.nickname?.length || 0) + 10
    }, 0)
    return Math.ceil(totalChars / 4)
  }
}

/**
 * Calculate available context budget for messages
 * @param {string} documentContent - The document content
 * @param {number} maxTotalTokens - Maximum total tokens (default: 128000 for GPT-4 Turbo)
 * @param {number} completionTokens - Reserved tokens for completion (default: 4000)
 * @returns {number} Available tokens for context
 */
export function calculateContextBudget(
  documentContent = '',
  maxTotalTokens = 128000,
  completionTokens = 4000
) {
  const SYSTEM_PROMPT_TOKENS = 1000 // Estimated system prompt size
  const documentTokens = countTokens(documentContent)
  const bufferTokens = 500 // Safety buffer

  const availableTokens = maxTotalTokens - documentTokens - completionTokens - SYSTEM_PROMPT_TOKENS - bufferTokens

  console.log(`📊 Token budget breakdown:
    Max Total: ${maxTotalTokens}
    Document: ${documentTokens}
    Completion: ${completionTokens}
    System: ${SYSTEM_PROMPT_TOKENS}
    Buffer: ${bufferTokens}
    Available for context: ${availableTokens}`)

  return Math.max(0, availableTokens)
}

/**
 * Intelligently truncate messages to fit within token budget
 * Keeps the most recent messages and preserves important context
 * @param {Array} messages - Array of messages to truncate
 * @param {number} maxTokens - Maximum token budget
 * @returns {Array} Truncated array of messages
 */
export function truncateMessagesToFit(messages, maxTokens) {
  if (!messages || messages.length === 0) return []

  let currentTokens = countMessageTokens(messages)

  if (currentTokens <= maxTokens) {
    return messages // All messages fit
  }

  console.log(`⚠️ Context too large (${currentTokens} tokens > ${maxTokens}), truncating...`)

  // Keep most recent messages, remove from the middle
  let truncated = [...messages]

  while (currentTokens > maxTokens && truncated.length > 3) {
    // Remove from the middle to preserve both early context and recent messages
    const removeIndex = Math.floor(truncated.length / 2)
    truncated.splice(removeIndex, 1)
    currentTokens = countMessageTokens(truncated)
  }

  console.log(`✓ Truncated to ${truncated.length} messages (${currentTokens} tokens)`)

  return truncated
}

/**
 * Clean up encoder when done (frees memory)
 */
export function cleanup() {
  if (encoder) {
    encoder.free()
    encoder = null
  }
}