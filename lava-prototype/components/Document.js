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
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const textareaRef = useRef(null)
  const downloadRef = useRef(null)

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

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setShowDownloadMenu(false)
      }
    }

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showDownloadMenu])

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

  const applyFormatting = (prefix, suffix = '') => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editContent.substring(start, end)

    let newText
    let newCursorPos

    if (start === end) {
      // No selection - insert placeholder text
      const placeholder = suffix ? 'text' : ''
      newText = editContent.substring(0, start) +
                prefix + placeholder + suffix +
                editContent.substring(end)
      newCursorPos = start + prefix.length
    } else {
      // Has selection - wrap it
      newText = editContent.substring(0, start) +
                prefix + selectedText + suffix +
                editContent.substring(end)
      newCursorPos = start + prefix.length + selectedText.length + suffix.length
    }

    setEditContent(newText)

    // Restore cursor position after React re-render
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
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

    // Formatting shortcuts (only in edit mode)
    if (isEditing && (e.metaKey || e.ctrlKey)) {
      // Bold: Cmd/Ctrl + B
      if (e.key === 'b') {
        e.preventDefault()
        applyFormatting('**', '**')
      }
      // Italic: Cmd/Ctrl + I
      if (e.key === 'i') {
        e.preventDefault()
        applyFormatting('*', '*')
      }
      // Code: Cmd/Ctrl + E
      if (e.key === 'e') {
        e.preventDefault()
        applyFormatting('`', '`')
      }
      // Link: Cmd/Ctrl + K
      if (e.key === 'k') {
        e.preventDefault()
        const url = prompt('Enter URL:')
        if (url) {
          const textarea = textareaRef.current
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const selectedText = editContent.substring(start, end) || 'link text'
          const linkText = `[${selectedText}](${url})`
          const newText = editContent.substring(0, start) + linkText + editContent.substring(end)
          setEditContent(newText)
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + linkText.length, start + linkText.length)
          }, 0)
        }
      }

      // Headers: Cmd/Ctrl + 1-6
      if (e.key >= '1' && e.key <= '6') {
        e.preventDefault()
        const level = parseInt(e.key)
        const prefix = '#'.repeat(level) + ' '
        applyFormatting(prefix)
      }

      // List: Cmd/Ctrl + L
      if (e.key === 'l') {
        e.preventDefault()
        applyFormatting('- ')
      }

      // Quote: Cmd/Ctrl + Q
      if (e.key === 'q' && e.shiftKey) {
        e.preventDefault()
        applyFormatting('> ')
      }
    }
  }

  // Download functions
  const downloadMarkdown = () => {
    try {
      const blob = new Blob([document.content], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'document.md'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setShowDownloadMenu(false)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file. Please try again.')
    }
  }

  const downloadHTML = () => {
    try {
      // Simple markdown to HTML conversion
      let htmlContent = document.content
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Code blocks
        .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Lists
        .replace(/^\* (.+)/gim, '<li>$1</li>')
        .replace(/^- (.+)/gim, '<li>$1</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        // Blockquotes
        .replace(/^> (.+)/gim, '<blockquote>$1</blockquote>')

      // Wrap in paragraph tags
      htmlContent = '<p>' + htmlContent + '</p>'

      // Clean up multiple closing/opening p tags
      htmlContent = htmlContent.replace(/<\/p><p>/g, '</p>\n<p>')

      // Wrap lists in ul tags
      htmlContent = htmlContent.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Document</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    pre {
      background: #f5f5f5;
      padding: 1em;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      background: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin-left: 0;
      padding-left: 1em;
      color: #666;
    }
    a {
      color: #2563eb;
      text-decoration: underline;
    }
    a:hover {
      color: #1d4ed8;
    }
    ul, ol {
      padding-left: 2em;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5em;
      text-align: left;
    }
    th {
      background: #f5f5f5;
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'document.html'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setShowDownloadMenu(false)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file. Please try again.')
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
          <p className="text-xs text-gray-500 mt-1">
            Last modified: {new Date(document.lastModified).toLocaleString()}
          </p>
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
            <>
              <button
                onClick={handleEditToggle}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Edit
              </button>
              <div className="relative" ref={downloadRef}>
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-1"
                >
                  Download
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDownloadMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={downloadMarkdown}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download as Markdown (.md)
                    </button>
                    <button
                      onClick={downloadHTML}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download as HTML (.html)
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <div className="text-xs text-gray-500 mb-2 flex flex-wrap gap-2">
              <span className="font-medium">Shortcuts:</span>
              <span>⌘B Bold</span>
              <span>⌘I Italic</span>
              <span>⌘E Code</span>
              <span>⌘K Link</span>
              <span>⌘1-6 Headers</span>
              <span>⌘L List</span>
              <span>⌘⇧Q Quote</span>
              <span>⌘S Save</span>
              <span>Esc Cancel</span>
            </div>
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 w-full p-4 font-mono text-sm resize-none border border-gray-200 rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter your document content here..."
              spellCheck="false"
            />
          </div>
        ) : (
          <div
            className={'max-w-4xl mx-auto prose prose-sm md:prose-base transition-all duration-500 ' + (isHighlighted ? 'bg-yellow-100 p-4 rounded' : '')}
            style={{ fontSize: '16px', lineHeight: '1.6', cursor: 'text' }}
            onDoubleClick={() => handleEditToggle()}
            title="Double-click to edit"
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