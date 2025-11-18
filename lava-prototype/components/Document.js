'use client'

import { useState, useEffect } from 'react'

export default function Document({ onDocumentChange }) {
  const [document, setDocument] = useState(null)
  const [prevContent, setPrevContent] = useState('')
  const [highlightedLines, setHighlightedLines] = useState(new Set())

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch('/api/document')
        const data = await response.json()

        if (data.document) {
          if (data.document.content !== prevContent && prevContent !== '') {
            const oldLines = prevContent.split('\n')
            const newLines = data.document.content.split('\n')
            const changed = new Set()

            newLines.forEach((line, index) => {
              if (oldLines[index] !== line) {
                changed.add(index)
              }
            })

            setHighlightedLines(changed)
            setTimeout(() => setHighlightedLines(new Set()), 3000)
            
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

  const lines = document.content.split('\n')

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 px-4 md:px-6 py-3 md:block hidden">
        <h2 className="font-semibold text-gray-900">Document</h2>
        <p className="text-xs text-gray-500 mt-1">
          Last modified: {new Date(document.lastModified).toLocaleString()}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto prose prose-sm md:prose-base">
          {lines.map((line, index) => (
            <div
              key={index}
              className={'transition-colors duration-500 ' + (highlightedLines.has(index) ? 'bg-yellow-100 px-2 -mx-2 rounded' : '')}
              style={{ fontSize: '16px', lineHeight: '1.6' }}
            >
              {line === '' ? '\u00A0' : line}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
