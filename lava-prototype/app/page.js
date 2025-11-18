'use client'

import { useState } from 'react'
import Chat from '@/components/Chat'
import Document from '@/components/Document'

export default function Home() {
  const [nickname, setNickname] = useState('')
  const [activeTab, setActiveTab] = useState('chat')
  const [hasUnseenDocChanges, setHasUnseenDocChanges] = useState(false)
  const [hasUnseenChatActivity, setHasUnseenChatActivity] = useState(false)

  const handleDocumentChange = () => {
    if (activeTab === 'chat') {
      setHasUnseenDocChanges(true)
    }
  }

  const handleChatActivity = () => {
    if (activeTab === 'document') {
      setHasUnseenChatActivity(true)
    }
  }

  const switchToTab = (tab) => {
    setActiveTab(tab)
    if (tab === 'document') {
      setHasUnseenDocChanges(false)
    } else if (tab === 'chat') {
      setHasUnseenChatActivity(false)
    }
  }

  return (
    <main className="h-screen flex flex-col safe-area-container">
      <header className="bg-gray-900 text-white px-4 md:px-6 shadow-md" style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)", paddingBottom: "0.5rem" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Lava</h1>
            <p className="text-xs md:text-sm text-gray-300">Collaborative Document Editor</p>
          </div>
          {nickname && (
            <div className="text-xs md:text-sm">
              <span className="text-gray-400">Logged in as:</span>{' '}
              <span className="font-semibold">{nickname}</span>
            </div>
          )}
        </div>
      </header>

      {nickname && (
        <div className="md:hidden flex border-b border-gray-200 bg-white">
          <button
            onClick={() => switchToTab('chat')}
            className={'flex-1 relative py-3 text-base transition-colors min-h-[44px] ' + (activeTab === 'chat' ? 'text-blue-600 font-bold border-b-3 border-blue-600 bg-blue-50 underline' : 'text-gray-600 font-medium')}
          >
            Chat
            {hasUnseenChatActivity && activeTab !== 'chat' && (
              <span className="absolute top-2 right-1/4 w-2 h-2 bg-gray-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => switchToTab('document')}
            className={'flex-1 relative py-3 text-base transition-colors min-h-[44px] ' + (activeTab === 'document' ? 'text-blue-600 font-bold border-b-3 border-blue-600 bg-blue-50 underline' : 'text-gray-600 font-medium')}
          >
            Document
            {hasUnseenDocChanges && activeTab !== 'document' && (
              <span className="absolute top-2 right-1/4 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className={(activeTab === 'chat' ? 'flex' : 'hidden') + ' md:flex md:w-[40%] w-full border-r border-gray-200 bg-white flex-col'}>
          <Chat
            nickname={nickname}
            onNicknameChange={setNickname}
            onDocumentUpdate={handleDocumentChange}
            onChatActivity={handleChatActivity}
          />
        </div>

        <div className={(activeTab === 'document' ? 'flex' : 'hidden') + ' md:flex md:w-[60%] w-full flex-col'}>
          <Document onDocumentChange={handleDocumentChange} />
        </div>
      </div>
    </main>
  )
}
