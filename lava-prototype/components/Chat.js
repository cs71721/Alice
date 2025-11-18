'use client'

import { useState, useEffect, useRef } from 'react'

export default function Chat({ nickname, onNicknameChange, onDocumentUpdate, onChatActivity, onSwitchToDocument }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isNicknameSet, setIsNicknameSet] = useState(false)
  const [tempNickname, setTempNickname] = useState('')
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [showNewMessages, setShowNewMessages] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
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

  const isNearBottom = () => {
    if (!scrollContainerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    return scrollTop + clientHeight >= scrollHeight - 100
  }

  const scrollToBottom = (force = false) => {
    if (force || isNearBottom() || isFirstLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setShowNewMessages(false)
      setUnreadCount(0)
      userScrolled.current = false
    }
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

  useEffect(() => {
    if (!isNicknameSet) return

    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages')
        const data = await response.json()
        
        const wasNearBottom = isNearBottom()
        setMessages(data.messages)

        if (data.messages.length > lastMessageCount && lastMessageCount > 0) {
          const newMessages = data.messages.slice(lastMessageCount)
          const hasLavaCommand = newMessages.some(msg => msg.text.includes('@lava'))
          const hasMention = newMessages.some(msg => msg.text.includes('@' + nickname) && msg.nickname !== nickname)
          
          if (hasLavaCommand || hasMention) {
            onChatActivity?.()
          }

          if (!wasNearBottom && !isFirstLoad.current) {
            const newCount = data.messages.length - lastMessageCount
            setUnreadCount(prev => prev + newCount)
            setShowNewMessages(true)
          }
        }
        
        setLastMessageCount(data.messages.length)

        if (isFirstLoad.current) {
          setTimeout(() => scrollToBottom(true), 100)
          isFirstLoad.current = false
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 1000)
    return () => clearInterval(interval)
  }, [isNicknameSet, lastMessageCount, nickname, onChatActivity])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    
    const nearBottom = isNearBottom()
    userScrolled.current = !nearBottom

    if (nearBottom) {
      setShowNewMessages(false)
      setUnreadCount(0)
    }
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
    if (!inputText.trim()) return

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, text: inputText }),
      })
      
      const data = await response.json()
      
      if (data.documentUpdated) {
        onDocumentUpdate?.()
      }
      
      setInputText('')
      
      setTimeout(() => scrollToBottom(true), 100)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  if (!isNicknameSet) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <form onSubmit={handleNicknameSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Enter your nickname</h2>
          <input
            type="text"
            value={tempNickname}
            onChange={(e) => setTempNickname(e.target.value)}
            placeholder="Your nickname"
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
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:block hidden">
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
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 relative w-full max-w-full"
      >
        {messages.map((msg) => {
          const isDocUpdate = msg.nickname === 'DocumentUpdate'
          const isMention = msg.text.includes('@' + nickname) && msg.nickname !== nickname
          
          return (
            <div key={msg.id} className="group w-full max-w-full">
              {isDocUpdate ? (
                <>
                  {/* Mobile: Full card with preview */}
                  <div className="md:hidden border border-blue-200 rounded-lg p-3 space-y-2 w-full max-w-full" style={{ backgroundColor: "#f0f8ff" }}>
                                    <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                                      <span>📄</span>
                                      <span>Document updated</span>
                                    </div>
                                    {msg.preview && (
                                      <div 
                                        className="text-sm text-gray-700 italic line-clamp-2"
                                        style={{
                                          wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                          overflowWrap: 'break-word'
                                        }}
                                      >
                                        {msg.preview}
                                      </div>
                                    )}
                                    <button
                                      onClick={onSwitchToDocument}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      View full document →
                                    </button>
                  </div>

                  {/* Desktop: Simple one-line notification */}
                  <div className="hidden md:block text-sm text-gray-500 italic">
                    → Document updated ✓
                  </div>
                </>
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
                    {truncateUrl(msg.text)}
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

      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 w-full max-w-full">
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
