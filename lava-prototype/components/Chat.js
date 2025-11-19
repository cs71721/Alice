'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAdaptivePolling } from '@/hooks/useAdaptivePolling'

export default function Chat({ nickname, onNicknameChange, onDocumentUpdate, onChatActivity, sectionReference, onSectionReferenceConsumed }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isNicknameSet, setIsNicknameSet] = useState(false)
  const [tempNickname, setTempNickname] = useState('')
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [showNewMessages, setShowNewMessages] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isSending, setIsSending] = useState(false)
  
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const isFirstLoad = useRef(true)
  const userScrolled = useRef(false)


  const truncateUrl = (text) => {
    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.replace(urlRegex, (url) => {
      if (url.length > 40) {
        // Extract domain and last part
        const match = url.match(/https?:\/\/([^\/]+)(.*)/)
        if (match) {
          const domain = match[1]
          const path = match[2]
          if (path.length > 20) {
            const lastPart = path.slice(-10)
            return `...${domain}${lastPart}`
          }
        }
      }
      return url
    })
  }

  // Parse message text to make version numbers clickable
  const renderMessageText = (text) => {
    if (!text) return text

    // First truncate URLs
    const truncated = truncateUrl(text)

    // Split by version pattern (v followed by digits)
    const parts = truncated.split(/(v\d+)/gi)

    return parts.map((part, index) => {
      const versionMatch = part.match(/^v(\d+)$/i)
      if (versionMatch) {
        const versionNum = versionMatch[1]
        return (
          <span
            key={index}
            className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
            onClick={async () => {
              // Send the version command to the server so it persists
              try {
                // Add the command to messages immediately for visual feedback
                const commandMessage = {
                  id: Date.now(),
                  nickname: nickname,
                  text: `@v${versionNum}`,
                  timestamp: Date.now(),
                  optimistic: true
                }
                setMessages(prev => [...prev, commandMessage])

                // Send to server
                const response = await fetch('/api/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nickname, text: `@v${versionNum}` }),
                })

                if (response.ok) {
                  // Force refresh to get the server's response
                  forceRefresh()
                  // Scroll to bottom after a delay to show the version info
                  setTimeout(() => scrollToBottom(true), 500)
                }
              } catch (error) {
                console.error('Error viewing version:', error)
              }
            }}
            title={`Click to view version ${versionNum}`}
          >
            {part}
          </span>
        )
      }
      return part
    })
  }

  const isNearBottom = () => {
    if (!scrollContainerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    return scrollTop + clientHeight >= scrollHeight - 50
  }

  const forceScrollToBottom = () => {
    if (!scrollContainerRef.current) return

    // AGGRESSIVE SCROLL - try all methods
    const container = scrollContainerRef.current

    // Method 1: Nuclear option - scroll with huge value
    container.scrollTop = container.scrollHeight + 9999

    // Method 2: scrollIntoView on end marker
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView(false)
    }

    // Method 3: Scroll last message into view
    const messages = container.querySelectorAll('.message-appear')
    if (messages.length > 0) {
      messages[messages.length - 1].scrollIntoView(false)
    }
  }

  const scrollToBottom = (force = false) => {
    if (force || isNearBottom() || isFirstLoad.current) {
      forceScrollToBottom()
      setShowNewMessages(false)
      setUnreadCount(0)
      userScrolled.current = false
    }
  }

  const ensureScrolledToBottom = () => {
    // Multiple attempts with increasing delays for mobile
    forceScrollToBottom() // Immediate
    setTimeout(forceScrollToBottom, 10)
    setTimeout(forceScrollToBottom, 50)
    setTimeout(forceScrollToBottom, 100)
    setTimeout(forceScrollToBottom, 250)
    setTimeout(forceScrollToBottom, 500)
    setTimeout(forceScrollToBottom, 1000)
    setTimeout(forceScrollToBottom, 1500)
  }


  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputText])

  // Handle incoming section references
  useEffect(() => {
    if (sectionReference && isNicknameSet) {
      // Add the reference to the input text
      const prefix = inputText.trim() ? inputText + ' ' : ''
      setInputText(prefix + `@lava regarding ${sectionReference}: `)

      // Focus the textarea
      setTimeout(() => textareaRef.current?.focus(), 100)

      // Mark reference as consumed
      onSectionReferenceConsumed?.()
    }
  }, [sectionReference, isNicknameSet, onSectionReferenceConsumed])

  // Initial mount - NUCLEAR SCROLL
  useEffect(() => {
    // Mobile Safari detection
    const isMobileSafari = /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(navigator.userAgent)

    if (isMobileSafari && scrollContainerRef.current) {
      // Force reflow for Safari
      const container = scrollContainerRef.current
      container.style.display = 'none'
      container.offsetHeight // Force reflow
      container.style.display = ''
    }

    // Just scroll on mount
    ensureScrolledToBottom()

    // Add visibility change listener for mobile
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => forceScrollToBottom(), 100)
      }
    }

    // Add pageshow listener for iOS web app
    const handlePageShow = (event) => {
      if (event.persisted) {
        ensureScrolledToBottom()
      }
    }

    // Add orientation change for mobile
    const handleOrientationChange = () => {
      ensureScrolledToBottom()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('orientationchange', handleOrientationChange)

    // Brute force interval for first 3 seconds
    let scrollAttempts = 0
    const scrollInterval = setInterval(() => {
      forceScrollToBottom()
      scrollAttempts++
      if (scrollAttempts > 20) {
        clearInterval(scrollInterval)
      }
    }, 150)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('orientationchange', handleOrientationChange)
      clearInterval(scrollInterval)
    }
  }, [])

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0 && !userScrolled.current) {
      requestAnimationFrame(() => scrollToBottom(true))
      // Backup scroll after delay for async content
      setTimeout(() => scrollToBottom(true), 100)
    }
  }, [messages])

  // Create fetchMessages function for adaptive polling
  const fetchMessages = useCallback(async () => {
    if (!isNicknameSet) return

    try {
      const response = await fetch('/api/messages')
      const data = await response.json()

      const wasNearBottom = isNearBottom()
      setMessages(data.messages)

      if (data.messages.length > lastMessageCount && lastMessageCount > 0) {
        const newMessages = data.messages.slice(lastMessageCount)
        const hasLavaCommand = newMessages.some(msg => msg.text.includes('@lava'))
        const hasMention = newMessages.some(msg => msg.text.includes('@' + nickname) && msg.nickname !== nickname)
        const isLavaResponse = newMessages.some(msg => msg.nickname === 'Lava')
        const isMyMessage = newMessages.some(msg => msg.nickname === nickname)

        if (hasLavaCommand || hasMention) {
          onChatActivity?.()
        }

        // Auto-scroll if: user sent message, Lava responded, or user was already near bottom
        if (isMyMessage || isLavaResponse || wasNearBottom) {
          userScrolled.current = false
          setTimeout(() => scrollToBottom(true), 100)
        } else if (!wasNearBottom && !isFirstLoad.current) {
          const newCount = data.messages.length - lastMessageCount
          setUnreadCount(prev => prev + newCount)
          setShowNewMessages(true)
        }
      }

      setLastMessageCount(data.messages.length)

      if (isFirstLoad.current) {
        // NUCLEAR scroll on first data load
        ensureScrolledToBottom()
        isFirstLoad.current = false
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [isNicknameSet, lastMessageCount, nickname, onChatActivity])

  // Use adaptive polling hook
  const {
    recordActivity,
    forceRefresh,
    currentInterval
  } = useAdaptivePolling(fetchMessages, {
    minInterval: 1000,      // 1 second when active
    maxInterval: 10000,     // 10 seconds when very idle
    idleThreshold: 30000,   // 30 seconds before considered idle
    veryIdleThreshold: 120000, // 2 minutes before very idle
  })

  // Track user activity - typing
  useEffect(() => {
    recordActivity()
  }, [inputText, recordActivity])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    const nearBottom = isNearBottom()
    userScrolled.current = !nearBottom

    if (nearBottom) {
      setShowNewMessages(false)
      setUnreadCount(0)
    }

    // Record scrolling as activity
    recordActivity()
  }

  const handleNicknameSubmit = (e) => {
    e.preventDefault()
    if (tempNickname.trim()) {
      onNicknameChange(tempNickname.trim())
      setIsNicknameSet(true)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || isSending) return

    setIsSending(true)
    const messageText = inputText.trim()

    // 1. IMMEDIATELY add optimistic message to UI
    const optimisticMessage = {
      id: Date.now(),
      nickname: nickname,
      text: messageText,
      timestamp: Date.now(),
      optimistic: true
    }
    setMessages(prev => [...prev, optimisticMessage])

    // 2. IMMEDIATELY clear input
    setInputText('')

    // 3. IMMEDIATELY scroll to bottom
    userScrolled.current = false
    requestAnimationFrame(() => scrollToBottom(true))

    // 4. THEN send to server asynchronously (don't block UI)
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, text: messageText }),
      })

      const data = await response.json()

      if (data.documentUpdated) {
        onDocumentUpdate?.()
      }

      // Server will handle adding the real message, polling will pick it up
      // Remove optimistic message once server confirms
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => !msg.optimistic || msg.text !== messageText))
      }, 1000)

      // Force immediate refresh to get the server's response
      forceRefresh()
    } catch (error) {
      console.error('Error sending message:', error)
      // On error, remove optimistic message and show error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
    } finally {
      // Re-enable send button after a short delay
      setTimeout(() => setIsSending(false), 500)
    }
  }

  if (!isNicknameSet) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <form onSubmit={handleNicknameSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Enter your username</h2>
          <input
            type="text"
            value={tempNickname}
            onChange={(e) => setTempNickname(e.target.value)}
            placeholder="Your username"
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            autoFocus
            style={{ fontSize: '16px' }}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px]"
          >
            Join Chat
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="chat-container-parent flex flex-col h-full w-full max-w-full overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:block hidden flex-shrink-0">
        <h2 className="font-semibold text-gray-900">
          Chat <span className="text-sm text-gray-500">({nickname})</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Use @lava [instruction] to update the document
        </p>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="chat-messages-wrapper p-4 space-y-2 w-full"
      >
        {messages.map((msg) => {
          const isDocUpdate = msg.nickname === 'DocumentUpdate'
          const isMention = msg.text.includes('@' + nickname) && msg.nickname !== nickname

          return (
            <div key={msg.id} className={'group w-full max-w-full message-appear' + (msg.optimistic ? ' message-optimistic' : '')}>
              {isDocUpdate ? (
                <div className="text-sm text-gray-500 italic">
                  → Document updated ✓
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={'font-semibold text-sm ' + (msg.nickname === 'System' ? 'text-gray-500' : msg.nickname === nickname ? 'text-blue-600' : 'text-gray-700')}
                    >
                      {msg.nickname}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={'text-base mt-1 w-full max-w-full ' + (msg.nickname === 'System' ? 'text-gray-500 italic' : isMention ? 'text-gray-900 bg-yellow-50 px-2 py-1 rounded' : 'text-gray-900')}
                    style={{
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {renderMessageText(msg.text)}
                  </div>
                </>
              )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />

        {showNewMessages && (
          <button
            onClick={() => scrollToBottom(true)}
            className="md:hidden fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 text-sm font-medium z-10"
          >
            {unreadCount > 0 && (
              <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {unreadCount}
              </span>
            )}
            <span>New messages</span>
            <span>↓</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form border-t border-gray-200 p-4 w-full max-w-full">
        <div className="flex gap-2 items-center w-full max-w-full">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="message-input flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base resize-none overflow-y-auto"
            style={{ 
              fontSize: '16px',
              minHeight: '44px',
              maxHeight: '120px',
              lineHeight: '1.5'
            }}
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="send-button bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex-shrink-0 flex items-center justify-center"
            style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
            title="Send message (or press Enter)"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M3.4 20.4l17.45-7.48c.81-.35.81-1.49 0-1.84L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
