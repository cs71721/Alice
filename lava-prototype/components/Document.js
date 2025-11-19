'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

export default function Document({ onDocumentChange, nickname }) {
  const [document, setDocument] = useState(null)
  const [prevContent, setPrevContent] = useState('')
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch('/api/document')
        const data = await response.json()

        if (data.document) {
          if (data.document.content !== prevContent && prevContent !== '') {
            setIsHighlighted(true)
            setTimeout(() => setIsHighlighted(false), 3000)

            onDocumentChange?.()
          }

          setPrevContent(data.document.content)
          setDocument(data.document)

          // Update edit content if not currently editing
          if (!isEditing) {
            setEditContent(data.document.content)
          }
        }
      } catch (error) {
        console.error('Error fetching document:', error)
      }
    }

    fetchDocument()
    const interval = setInterval(fetchDocument, 1000)
    return () => clearInterval(interval)
  }, [prevContent, onDocumentChange, isEditing])

  const handleEditToggle = () => {
    if (!isEditing) {
      // Entering edit mode
      setEditContent(document.content)
      setIsEditing(true)
      // Focus textarea after state update
      setTimeout(() => textareaRef.current?.focus(), 0)
    } else {
      // Exiting edit mode without saving
      setEditContent(document.content)
      setIsEditing(false)
    }
  }

  const handleSave = async () => {
    if (editContent === document.content) {
      // No changes, just exit edit mode
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/document', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
          expectedVersion: document.version, // CAS: send expected version
          nickname: nickname || 'Unknown User' // Send the actual user's nickname
        }),
      })

      if (response.status === 409) {
        // Version conflict
        const conflict = await response.json()
        const shouldRefresh = confirm(
          `Document was modified by ${conflict.lastEditor}.\n` +
          `Their change: "${conflict.changeSummary}"\n\n` +
          `Do you want to refresh and lose your changes?\n` +
          `(Click Cancel to keep editing and manually merge)`
        )

        if (shouldRefresh) {
          // Refresh and exit edit mode
          setIsEditing(false)
          const docResponse = await fetch('/api/document')
          const data = await docResponse.json()
          if (data.document) {
            setDocument(data.document)
            setPrevContent(data.document.content)
            setEditContent(data.document.content)
          }
        }
        // If user cancels, they stay in edit mode to manually merge
      } else if (response.ok) {
        // Successfully saved - let the polling update the document
        setIsEditing(false)
        // Force immediate refresh
        const docResponse = await fetch('/api/document')
        const data = await docResponse.json()
        if (data.document) {
          setDocument(data.document)
          setPrevContent(data.document.content)
        }
      } else {
        console.error('Failed to save document')
        alert('Failed to save changes. Please try again.')
      }
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Error saving changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    // Cmd+S or Ctrl+S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      handleEditToggle()
    }
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading document...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 px-4 md:px-6 py-3 flex justify-between items-start">
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">
            Document {document.version && `v${document.version}`}
          </h2>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleEditToggle}
                disabled={isSaving}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleEditToggle}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-4 font-mono text-sm resize-none border border-gray-200 rounded focus:outline-none focus:border-blue-500"
            placeholder="Enter your document content here..."
            spellCheck="false"
          />
        ) : (
          <div
            className={'max-w-4xl mx-auto prose prose-sm md:prose-base transition-all duration-500 ' + (isHighlighted ? 'bg-yellow-100 p-4 rounded' : '')}
            style={{ fontSize: '16px', lineHeight: '1.6' }}
          >
            <ReactMarkdown
              components={{
                a: ({node, ...props}) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  />
                )
              }}
            >
              {document.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}