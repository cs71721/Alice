import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getDocument, initDocument, updateDocument, addMessage } from '@/lib/kv'
import * as Diff from 'diff'

export async function GET() {
  try {
    await initDocument()
    const document = await getDocument()
    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const { content, expectedVersion, nickname } = await request.json()

    if (content === undefined) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Use provided nickname or fallback to 'Unknown User'
    const editor = nickname || 'Unknown User'

    // Get current document for comparison
    const currentDoc = await getDocument()
    const oldContent = currentDoc.content

    // CAS: Check version match if provided
    if (expectedVersion !== undefined && currentDoc.version && currentDoc.version !== expectedVersion) {
      return NextResponse.json(
        {
          error: 'Version conflict',
          message: 'Document was modified by another user. Please refresh and try again.',
          currentVersion: currentDoc.version,
          expectedVersion,
          lastEditor: currentDoc.lastEditor,
          changeSummary: currentDoc.changeSummary
        },
        { status: 409 } // Conflict
      )
    }

    // Only proceed if content actually changed
    if (oldContent === content) {
      return NextResponse.json({ message: 'No changes detected' })
    }

    // Save previous version before updating
    await kv.set('document-previous', oldContent)

    // Generate edit summary
    const editSummary = generateEditSummary(oldContent, content)

    // Update the document with versioning metadata
    await updateDocument(content, `User:${editor}`, editSummary)

    // Log the manual edit to chat with version info
    const updatedDoc = await getDocument()
    await addMessage(editor, `📝 Manual edit (v${updatedDoc.version}): ${editSummary}`)

    return NextResponse.json({
      message: 'Document updated successfully',
      editSummary
    })
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

/**
 * Generate a human-readable summary of what changed
 */
function generateEditSummary(oldContent, newContent) {
  // Get line-by-line diff
  const lineDiff = Diff.diffLines(oldContent, newContent)

  // Track what was added and removed for analysis
  const removedLines = []
  const addedLines = []

  for (const part of lineDiff) {
    if (part.removed) {
      // Split and filter to get non-empty lines
      const lines = part.value.split('\n').filter(l => l.length > 0)
      removedLines.push(...lines)
    } else if (part.added) {
      const lines = part.value.split('\n').filter(l => l.length > 0)
      addedLines.push(...lines)
    }
  }

  // Check for title/header changes first (most specific)
  if (removedLines.length === 1 && addedLines.length === 1) {
    const oldLine = removedLines[0]
    const newLine = addedLines[0]

    // Both are headers of same level
    if (oldLine.match(/^#+\s/) && newLine.match(/^#+\s/)) {
      const oldLevel = oldLine.match(/^#+/)[0]
      const newLevel = newLine.match(/^#+/)[0]

      if (oldLevel === newLevel) {
        const newTitle = newLine.replace(/^#+\s*/, '').trim()
        const headerType = oldLevel.length === 1 ? 'title' :
                          oldLevel.length === 2 ? 'section' : 'subsection'
        return `Changed ${headerType} to "${newTitle}"`
      }
    }

    // Check for other single-line changes
    if (oldLine.startsWith('- ') && newLine.startsWith('- ')) {
      return `Modified list item`
    }
  }

  // Check for additions only
  if (removedLines.length === 0 && addedLines.length > 0) {
    // Check what was added
    for (const line of addedLines) {
      if (line.startsWith('# ')) {
        return `Added title: "${line.substring(2).trim()}"`
      } else if (line.startsWith('## ')) {
        return `Added section: "${line.substring(3).trim()}"`
      } else if (line.startsWith('### ')) {
        return `Added subsection: "${line.substring(4).trim()}"`
      }
    }

    if (addedLines.some(l => l.startsWith('- ') || l.startsWith('* '))) {
      return 'Added list items'
    }

    return `Added ${addedLines.length} line${addedLines.length === 1 ? '' : 's'}`
  }

  // Check for removals only
  if (addedLines.length === 0 && removedLines.length > 0) {
    for (const line of removedLines) {
      if (line.startsWith('# ')) {
        return `Removed title: "${line.substring(2).trim()}"`
      } else if (line.startsWith('## ')) {
        return `Removed section: "${line.substring(3).trim()}"`
      }
    }

    return `Removed ${removedLines.length} line${removedLines.length === 1 ? '' : 's'}`
  }

  // Mixed changes
  if (addedLines.length > 0 && removedLines.length > 0) {
    // Try to detect if it's a title change by position
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')

    for (let i = 0; i < Math.min(oldLines.length, newLines.length); i++) {
      if (oldLines[i] !== newLines[i]) {
        // Check if both are headers
        if (oldLines[i].match(/^#+\s/) && newLines[i].match(/^#+\s/)) {
          const newTitle = newLines[i].replace(/^#+\s*/, '').trim()
          return `Changed title to "${newTitle}"`
        }
        break
      }
    }

    return `Modified content (${addedLines.length} added, ${removedLines.length} removed)`
  }

  // Check character count changes as final fallback
  const oldLength = oldContent.length
  const newLength = newContent.length

  if (newLength > oldLength + 100) {
    return 'Added significant content'
  } else if (newLength < oldLength - 100) {
    return 'Removed significant content'
  }

  return 'Minor edits'
}

export const dynamic = 'force-dynamic'
export const revalidate = 0