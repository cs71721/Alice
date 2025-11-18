'use client'

import { useState } from 'react'
import Chat from '@/components/Chat'
import Document from '@/components/Document'

export default function Home() {
  const [nickname, setNickname] = useState('')

  return (
    <main className="h-screen flex flex-col">
      <header className="bg-gray-900 text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lava</h1>
            <p className="text-sm text-gray-300">Collaborative Document Editor</p>
          </div>
          {nickname && (
            <div className="text-sm">
              <span className="text-gray-400">Logged in as:</span>{' '}
              <span className="font-semibold">{nickname}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat section - 40% width */}
        <div className="w-[40%] border-r border-gray-200 bg-white flex flex-col">
          <Chat nickname={nickname} onNicknameChange={setNickname} />
        </div>

        {/* Document section - 60% width */}
        <div className="w-[60%] flex flex-col">
          <Document />
        </div>
      </div>
    </main>
  )
}
