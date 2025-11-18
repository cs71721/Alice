'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

export default function Document({ onDocumentChange }) {
  const [document, setDocument] = useState(null)
  const [prevContent, setPrevContent] = useState('')
  const [isHighlighted, setIsHighlighted] = useState(false)

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
        }
      } catch (error) {
        console.error('Error fetching document:', error)
      }
    }

    fetchDocument()
    const interval = setInterval(fetchDocument, 1000)
    return () => clearInterval(interval)
  }, [prevContent, onDocumentChange])

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading document...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 px-4 md:px-6 py-3 md:block hidden">
        <h2 className="font-semibold text-gray-900">Document</h2>
        <p className="text-xs text-gray-500 mt-1">
          Last modified: {new Date(document.lastModified).toLocaleString()}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
      </div>
    </div>
  )
}
