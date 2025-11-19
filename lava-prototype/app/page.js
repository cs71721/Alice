'use client'

import { useState } from 'react'
import Chat from '@/components/Chat'
import Document from '@/components/Document'

export default function Home() {
  const [nickname, setNickname] = useState('')
  const [activeTab, setActiveTab] = useState('chat')
  const [hasUnseenDocChanges, setHasUnseenDocChanges] = useState(false)
  const [hasUnseenChatActivity, setHasUnseenChatActivity] = useState(false)
  const [sectionReference, setSectionReference] = useState(null)

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

  const handleSectionReference = (reference) => {
    // Switch to chat tab and pass the reference
    setSectionReference(reference)
    switchToTab('chat')
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
    <main className="lava-app-main">
      <header className="bg-gray-900 text-white px-4 md:px-6 shadow-md" style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)", paddingBottom: "0.75rem" }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">Lava</h1>
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
            className={'flex-1 py-3 text-base transition-colors min-h-[44px] flex items-center justify-center gap-2 ' + (activeTab === 'chat' ? 'text-blue-600 font-bold border-b-3 border-blue-600 bg-blue-50 underline' : 'text-gray-600 font-medium')}
          >
            <span>Chat</span>
            {hasUnseenChatActivity && activeTab !== 'chat' && (
              <span className="w-2 h-2 bg-gray-500 rounded-full flex-shrink-0"></span>
            )}
          </button>
          <button
            onClick={() => switchToTab('document')}
            className={'flex-1 py-3 text-base transition-colors min-h-[44px] flex items-center justify-center gap-2 ' + (activeTab === 'document' ? 'text-blue-600 font-bold border-b-3 border-blue-600 bg-blue-50 underline' : 'text-gray-600 font-medium')}
          >
            <span>Document</span>
            {hasUnseenDocChanges && activeTab !== 'document' && (
              <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
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
            sectionReference={sectionReference}
            onSectionReferenceConsumed={() => setSectionReference(null)}
          />
        </div>

        <div className={(activeTab === 'document' ? 'flex' : 'hidden') + ' md:flex md:w-[60%] w-full flex-col'}>
          <Document
            onDocumentChange={handleDocumentChange}
            nickname={nickname}
            onSectionReference={handleSectionReference}
          />
        </div>
      </div>
    </main>
  )
}
