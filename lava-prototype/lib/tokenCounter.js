/**
 * Estimate tokens in a text string
 * Uses character-based estimation: ~4 chars per token for English text
 * This is a conservative estimate that works well for GPT-4
 * @param {string} text - The text to count tokens for
 * @returns {number} The estimated number of tokens
 */
export function countTokens(text) {
  if (!text) return 0
  // Conservative estimate: ~4 characters per token
  return Math.ceil(text.length / 4)
}

/**
 * Estimate tokens for an array of messages (chat format)
 * Accounts for message formatting overhead
 * @param {Array} messages - Array of message objects with text and nickname
 * @returns {number} Total token count estimate
 */
export function countMessageTokens(messages) {
  if (!messages || messages.length === 0) return 0

  // Estimate including overhead for message structure
  const totalChars = messages.reduce((sum, msg) => {
    return sum + (msg.text?.length || 0) + (msg.nickname?.length || 0) + 10 // overhead
  }, 0)

  return Math.ceil(totalChars / 4)
}

/**
 * Calculate available context budget for messages
 * @param {string} documentContent - The document content
 * @param {number} maxTotalTokens - Maximum total tokens (default: 200000 for Claude Sonnet 3.5)
 * @param {number} completionTokens - Reserved tokens for completion (default: 8192)
 * @returns {number} Available tokens for context
 */
export function calculateContextBudget(
  documentContent = '',
  maxTotalTokens = 200000,  // Updated for Claude Sonnet 3.5 (200K context)
  completionTokens = 8192    // Updated for larger completions
) {
  const SYSTEM_PROMPT_TOKENS = 1000 // Estimated system prompt size
  const documentTokens = countTokens(documentContent)
  const bufferTokens = 500 // Safety buffer

  const availableTokens = maxTotalTokens - documentTokens - completionTokens - SYSTEM_PROMPT_TOKENS - bufferTokens

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

  // Keep most recent messages, remove from the middle
  let truncated = [...messages]

  while (currentTokens > maxTokens && truncated.length > 3) {
    // Remove from the middle to preserve both early context and recent messages
    const removeIndex = Math.floor(truncated.length / 2)
    truncated.splice(removeIndex, 1)
    currentTokens = countMessageTokens(truncated)
  }

  return truncated
}

