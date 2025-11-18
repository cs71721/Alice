'use client'

import { useState, useEffect, useRef } from 'react'

export default function Chat({ nickname, onNicknameChange }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isNicknameSet, setIsNicknameSet] = useState(false)
  const [tempNickname, setTempNickname] = useState('')
  const messagesEndRef = useRef(null)

  // Poll for messages every second
  useEffect(() => {
    if (!isNicknameSet) return

    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages')
        const data = await response.json()
        setMessages(data.messages)
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    // Initial fetch
    fetchMessages()

    // Poll every second
    const interval = setInterval(fetchMessages, 1000)

    return () => clearInterval(interval)
  }, [isNicknameSet])

  // Auto-scroll to bottom
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
      await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, text: inputText }),
      })
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Join Chat
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h2 className="font-semibold text-gray-900">
          Chat <span className="text-sm text-gray-500">({nickname})</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Use @lava [instruction] to update the document
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="group">
            <div className="flex items-baseline gap-2">
              <span
                className={`font-semibold text-sm ${
                  msg.nickname === 'System'
                    ? 'text-gray-500'
                    : msg.nickname === nickname
                    ? 'text-blue-600'
                    : 'text-gray-700'
                }`}
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
              className={`text-sm mt-1 ${
                msg.nickname === 'System' ? 'text-gray-500 italic' : 'text-gray-900'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
