'use client'

import { useState, useEffect, useRef } from 'react'

export default function Chat({ nickname, onNicknameChange, onDocumentUpdate, onChatActivity, onSwitchToDocument }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isNicknameSet, setIsNicknameSet] = useState(false)
  const [tempNickname, setTempNickname] = useState('')
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!isNicknameSet) return

    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages')
        const data = await response.json()
        setMessages(data.messages)

        if (data.messages.length > lastMessageCount && lastMessageCount > 0) {
          const newMessages = data.messages.slice(lastMessageCount)
          const hasLavaCommand = newMessages.some(msg => msg.text.includes('@lava'))
          const hasMention = newMessages.some(msg => msg.text.includes('@' + nickname) && msg.nickname !== nickname)
          
          if (hasLavaCommand || hasMention) {
            onChatActivity?.()
          }
        }
        
        setLastMessageCount(data.messages.length)
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 1000)
    return () => clearInterval(interval)
  }, [isNicknameSet, lastMessageCount, nickname, onChatActivity])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNicknameSubmit = (e) => {
    e.preventDefault()
    if (tempNickname.trim()) {
      onNicknameChange(tempNickname.trim())
      setIsNicknameSet(true)
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
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:block hidden">
        <h2 className="font-semibold text-gray-900">
          Chat <span className="text-sm text-gray-500">({nickname})</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Use @lava [instruction] to update the document
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isDocUpdate = msg.nickname === 'DocumentUpdate'
          const isMention = msg.text.includes('@' + nickname) && msg.nickname !== nickname
          
          return (
            <div key={msg.id} className="group">
              {isDocUpdate ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                    <span>📄</span>
                    <span>Document updated</span>
                  </div>
                  {msg.preview && (
                    <div className="text-sm text-gray-700 italic line-clamp-2">
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
                    className={'text-base mt-1 ' + (msg.nickname === 'System' ? 'text-gray-500 italic' : isMention ? 'text-gray-900 bg-yellow-50 px-2 py-1 rounded' : 'text-gray-900')}
                  >
                    {msg.text}
                  </div>
                </>
              )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-base min-h-[44px]"
            style={{ fontSize: '16px' }}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-base font-medium min-h-[44px]"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
