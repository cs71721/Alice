'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAdaptivePolling } from '@/hooks/useAdaptivePolling'

export default function Document({ onDocumentChange, nickname, onSectionReference, viewingVersion, onBackToCurrent }) {
  const [doc, setDoc] = useState(null)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [selectedText, setSelectedText] = useState(null)
  const [selectionPosition, setSelectionPosition] = useState(null)
  const [referenceInput, setReferenceInput] = useState('')
  const prevContentRef = useRef('')
  const textareaRef = useRef(null)
  const downloadRef = useRef(null)
  const documentRef = useRef(null)
  const referenceInputRef = useRef(null)

  // Create fetchDocument function for adaptive polling
  const fetchDocument = useCallback(async () => {
    try {
      const response = await fetch('/api/document')
      const data = await response.json()

      if (data.document) {
        // Check if content changed using ref
        if (data.document.content !== prevContentRef.current && prevContentRef.current !== '') {
          setIsHighlighted(true)
          setTimeout(() => setIsHighlighted(false), 3000)

          onDocumentChange?.()
        }

        // Update the ref with new content
        prevContentRef.current = data.document.content
        setDoc(data.document)

        // Update edit content if not currently editing
        if (!isEditing) {
          setEditContent(data.document.content)
        }
      }
    } catch (error) {
      console.error('Error fetching document:', error)
    }
  }, [onDocumentChange, isEditing])

  // Use adaptive polling hook
  const {
    recordActivity,
    forceRefresh,
    pause,
    resume,
    currentInterval
  } = useAdaptivePolling(fetchDocument, {
    minInterval: 1000,      // 1 second when active
    maxInterval: 15000,     // 15 seconds when very idle
    idleThreshold: 60000,   // 1 minute before considered idle
    veryIdleThreshold: 180000, // 3 minutes before very idle
  })

  // Pause polling during editing, resume after save
  useEffect(() => {
    if (isEditing) {
      pause()
    } else {
      resume()
    }
  }, [isEditing, pause, resume])

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setShowDownloadMenu(false)
      }
    }

    if (showDownloadMenu) {
      window.document.addEventListener('mousedown', handleClickOutside)
      return () => {
        window.document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showDownloadMenu])

  // Generate ID from header text (slugify)
  const generateHeaderId = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50)
  }

  // Track activity when editing content changes
  useEffect(() => {
    if (isEditing) {
      recordActivity()
    }
  }, [editContent, isEditing, recordActivity])

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      if (isEditing) return // Don't handle selection in edit mode

      const selection = window.getSelection()
      const text = selection.toString().trim()

      if (text && documentRef.current?.contains(selection.anchorNode)) {
        // Record selection as activity
        recordActivity()
        // Find which section contains the selection
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        // Look for the nearest header above the selection
        let nearestHeader = null
        let currentNode = selection.anchorNode

        while (currentNode && currentNode !== documentRef.current) {
          if (currentNode.nodeType === Node.ELEMENT_NODE) {
            const element = currentNode
            // Check if it's a header or contains a header
            const header = element.querySelector?.('h1, h2, h3, h4, h5, h6') ||
                          (element.tagName?.match(/^H[1-6]$/) ? element : null)
            if (header && header.id) {
              nearestHeader = header
              break
            }
          }
          currentNode = currentNode.parentNode
        }

        setSelectedText(text)
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          sectionId: nearestHeader?.id || null,
          sectionText: nearestHeader?.textContent || null
        })
      } else {
        setSelectedText(null)
        setSelectionPosition(null)
      }
    }

    // Debounce selection handler
    let timeout
    const debouncedHandler = () => {
      clearTimeout(timeout)
      timeout = setTimeout(handleSelection, 200)
    }

    document.addEventListener('selectionchange', debouncedHandler)
    return () => {
      document.removeEventListener('selectionchange', debouncedHandler)
      clearTimeout(timeout)
    }
  }, [isEditing])

  // Smart truncation for long quotes (Option C)
  const createAbbreviatedReference = (text, sectionId) => {
    const maxLength = 100
    let abbreviated = text

    if (text.length > maxLength) {
      abbreviated = text.substring(0, maxLength).trim() + '...'
    }

    if (sectionId) {
      return `Referenced from #${sectionId}:\n"${abbreviated} [see more]"`
    } else {
      return `"${abbreviated} [see more]"`
    }
  }

  // Handle reference input submission
  const handleReferenceSubmit = (e) => {
    e.preventDefault()

    if (!selectedText || !selectionPosition) return

    const userComment = referenceInput.trim()

    // Create abbreviated reference
    const abbreviatedRef = createAbbreviatedReference(
      selectedText,
      selectionPosition.sectionId
    )

    // Full reference for metadata
    const fullReference = {
      text: selectedText,
      sectionId: selectionPosition.sectionId,
      abbreviated: abbreviatedRef,
      userComment: userComment
    }

    // Send reference with comment
    const messageToSend = userComment
      ? `${abbreviatedRef}\n\n${userComment}`
      : abbreviatedRef

    onSectionReference?.(messageToSend)

    // Clear state
    setReferenceInput('')
    setSelectedText(null)
    setSelectionPosition(null)
    window.getSelection().removeAllRanges()
  }

  const handleEditToggle = () => {
    if (!isEditing) {
      // Entering edit mode
      setEditContent(doc.content)
      setIsEditing(true)
      // Focus textarea after state update
      setTimeout(() => textareaRef.current?.focus(), 0)
    } else {
      // Exiting edit mode without saving
      setEditContent(doc.content)
      setIsEditing(false)
    }
  }

  const handleSave = async () => {
    if (editContent === doc.content) {
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
          expectedVersion: doc.version, // CAS: send expected version
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
            setDoc(data.document)
            prevContentRef.current = data.document.content
            setEditContent(data.document.content)
          }
        }
        // If user cancels, they stay in edit mode to manually merge
      } else if (response.ok) {
        // Successfully saved - let the polling update the document
        setIsEditing(false)
        // Force immediate refresh using adaptive polling
        forceRefresh()
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

  const handleRestore = async () => {
    if (!viewingVersion || !nickname) return

    const confirmed = confirm(`Restore to v${viewingVersion.version}?\n\nThis will create a new version with the content from v${viewingVersion.version}.`)
    if (!confirmed) return

    try {
      const response = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: viewingVersion.version,
          nickname
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Success message already added to chat by API
        // Go back to current to see the restored version
        onBackToCurrent?.()
      } else {
        const error = await response.json()
        alert(`Failed to restore: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error restoring version:', error)
      alert('Failed to restore version. Please try again.')
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
      const blob = new Blob([doc.content], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')

      link.href = url
      link.download = 'document.md'

      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)

      URL.revokeObjectURL(url)
      setShowDownloadMenu(false)
    } catch (error) {
      console.error('Download failed:', error)
      alert(`Error downloading file: ${error.message}`)
    }
  }

  const downloadHTML = () => {
    try {
      // Simple markdown to HTML conversion
      let htmlContent = doc.content
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
      const link = window.document.createElement('a')

      link.href = url
      link.download = 'document.html'

      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)

      URL.revokeObjectURL(url)
      setShowDownloadMenu(false)
    } catch (error) {
      console.error('HTML download failed:', error)
      alert(`Error downloading HTML file: ${error.message}`)
    }
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading document...</div>
      </div>
    )
  }

  // Determine what content to display
  const displayContent = viewingVersion ? viewingVersion.content : doc.content
  const displayVersion = viewingVersion ? viewingVersion.version : doc.version
  const isViewingOldVersion = !!viewingVersion

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Version viewing banner */}
      {isViewingOldVersion && (
        <div className="bg-blue-50 border-b-2 border-blue-200 px-4 md:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-semibold">📄 Viewing v{viewingVersion.version}</span>
            <span className="text-sm text-gray-600">
              by {viewingVersion.lastEditor} - {viewingVersion.changeSummary}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBackToCurrent}
              className="px-3 py-1 text-sm bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50"
            >
              Back to Current
            </button>
            <button
              onClick={handleRestore}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Restore this version
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 px-4 md:px-6 py-3 flex justify-between items-start">
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">
            Document {displayVersion && `v${displayVersion}`}
            {isViewingOldVersion && <span className="ml-2 text-sm text-gray-500">(read-only)</span>}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Last modified: {new Date(viewingVersion?.lastModified || doc.lastModified).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {isViewingOldVersion ? null : isEditing ? (
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
          <>
            <div
              ref={documentRef}
              className={'max-w-4xl mx-auto prose prose-sm md:prose-base transition-all duration-500 ' + (isHighlighted ? 'bg-yellow-100 p-4 rounded' : '')}
              style={{ fontSize: '16px', lineHeight: '1.6', cursor: 'text' }}
              onDoubleClick={() => !isViewingOldVersion && handleEditToggle()}
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
                  ),
                  h1: ({children}) => {
                    const id = generateHeaderId(String(children))
                    return <h1 id={id} className="group relative">
                      {children}
                      <span className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 text-gray-400">#</span>
                    </h1>
                  },
                  h2: ({children}) => {
                    const id = generateHeaderId(String(children))
                    return <h2 id={id} className="group relative">
                      {children}
                      <span className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 text-gray-400">#</span>
                    </h2>
                  },
                  h3: ({children}) => {
                    const id = generateHeaderId(String(children))
                    return <h3 id={id} className="group relative">
                      {children}
                      <span className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 text-gray-400 text-sm">#</span>
                    </h3>
                  },
                  h4: ({children}) => {
                    const id = generateHeaderId(String(children))
                    return <h4 id={id} className="group relative">
                      {children}
                      <span className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 text-gray-400 text-sm">#</span>
                    </h4>
                  },
                  h5: ({children}) => {
                    const id = generateHeaderId(String(children))
                    return <h5 id={id} className="group relative">
                      {children}
                      <span className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 text-gray-400 text-xs">#</span>
                    </h5>
                  },
                  h6: ({children}) => {
                    const id = generateHeaderId(String(children))
                    return <h6 id={id} className="group relative">
                      {children}
                      <span className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 text-gray-400 text-xs">#</span>
                    </h6>
                  }
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>

            {/* Floating inline input for references */}
            {selectedText && selectionPosition && (
              <form
                onSubmit={handleReferenceSubmit}
                className="fixed z-50 bg-white border-2 border-blue-600 rounded-lg shadow-xl p-3"
                style={{
                  left: `${Math.min(Math.max(selectionPosition.x - 150, 10), window.innerWidth - 310)}px`,
                  top: `${Math.max(selectionPosition.y + 10, 10)}px`,
                  width: '300px'
                }}
              >
                <input
                  ref={referenceInputRef}
                  type="text"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  placeholder="Ask @lava or discuss with team..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedText(null)
                      setSelectionPosition(null)
                      setReferenceInput('')
                      window.getSelection().removeAllRanges()
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}