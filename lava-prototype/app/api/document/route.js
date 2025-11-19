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

  // Analyze what changed
  const changes = []
  let addedLines = 0
  let removedLines = 0
  let modifiedSections = []

  for (const part of lineDiff) {
    if (part.added) {
      const lines = part.value.split('\n').filter(l => l.trim())
      addedLines += lines.length

      // Detect what was added
      for (const line of lines) {
        if (line.startsWith('# ')) {
          changes.push(`Added title: "${line.substring(2).trim()}"`)
        } else if (line.startsWith('## ')) {
          changes.push(`Added section: "${line.substring(3).trim()}"`)
        } else if (line.startsWith('### ')) {
          changes.push(`Added subsection: "${line.substring(4).trim()}"`)
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          if (!changes.some(c => c.includes('list item'))) {
            changes.push('Added list items')
          }
        }
      }
    } else if (part.removed) {
      const lines = part.value.split('\n').filter(l => l.trim())
      removedLines += lines.length

      // Detect what was removed
      for (const line of lines) {
        if (line.startsWith('# ')) {
          const newTitle = findReplacementTitle(newContent, line)
          if (newTitle) {
            changes.push(`Changed title to "${newTitle}"`)
          } else {
            changes.push(`Removed title: "${line.substring(2).trim()}"`)
          }
        } else if (line.startsWith('## ')) {
          changes.push(`Removed section: "${line.substring(3).trim()}"`)
        }
      }
    }
  }

  // Generate summary based on detected changes
  if (changes.length > 0) {
    // Return the most significant change
    return changes[0]
  }

  // Check for simple text changes
  const wordDiff = Diff.diffWords(oldContent, newContent)
  let changedWords = []

  for (const part of wordDiff) {
    if (part.added && part.value.trim() && part.value.trim().split(/\s+/).length <= 5) {
      changedWords.push(part.value.trim())
    }
  }

  if (changedWords.length === 1 && changedWords[0].length < 50) {
    // Check if it's a title/header change
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')

    for (let i = 0; i < Math.min(oldLines.length, newLines.length); i++) {
      if (oldLines[i] !== newLines[i]) {
        if (oldLines[i].startsWith('#') && newLines[i].startsWith('#')) {
          const oldTitle = oldLines[i].replace(/^#+\s*/, '').trim()
          const newTitle = newLines[i].replace(/^#+\s*/, '').trim()
          return `Changed title to "${newTitle}"`
        }
      }
    }
  }

  // Fallback to line-based summary
  if (addedLines > 0 && removedLines === 0) {
    return `Added ${addedLines} line${addedLines === 1 ? '' : 's'}`
  } else if (removedLines > 0 && addedLines === 0) {
    return `Removed ${removedLines} line${removedLines === 1 ? '' : 's'}`
  } else if (addedLines > 0 && removedLines > 0) {
    return `Modified content (${addedLines} added, ${removedLines} removed)`
  }

  // Check character count changes
  const oldLength = oldContent.length
  const newLength = newContent.length

  if (newLength > oldLength + 100) {
    return 'Added significant content'
  } else if (newLength < oldLength - 100) {
    return 'Removed significant content'
  }

  return 'Minor edits'
}

/**
 * Helper function to find if a removed title was replaced with a new one
 */
function findReplacementTitle(newContent, oldTitle) {
  const newLines = newContent.split('\n')
  const oldLevel = oldTitle.match(/^#+/)[0].length

  for (const line of newLines) {
    if (line.startsWith('#'.repeat(oldLevel) + ' ')) {
      const newTitle = line.substring(oldLevel + 1).trim()
      if (newTitle !== oldTitle.substring(oldLevel + 1).trim()) {
        return newTitle
      }
    }
  }
  return null
}

export const dynamic = 'force-dynamic'
export const revalidate = 0