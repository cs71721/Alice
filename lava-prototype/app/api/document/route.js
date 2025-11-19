import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getDocument, initDocument, updateDocument, addMessage } from '@/lib/kv'

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
    const { content, expectedVersion } = await request.json()

    if (content === undefined) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

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
    await updateDocument(content, 'Manual Edit', editSummary)

    // Log the manual edit to chat with version info
    const updatedDoc = await getDocument()
    await addMessage('System', `📝 Manual edit (v${updatedDoc.version}): ${editSummary}`)

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
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')

  const oldLength = oldContent.length
  const newLength = newContent.length

  // Basic change detection
  if (newLength > oldLength + 100) {
    return 'Added significant content'
  } else if (newLength < oldLength - 100) {
    return 'Removed significant content'
  } else if (oldLines.length !== newLines.length) {
    const diff = newLines.length - oldLines.length
    if (diff > 0) {
      return `Added ${diff} line${diff === 1 ? '' : 's'}`
    } else {
      return `Removed ${Math.abs(diff)} line${Math.abs(diff) === 1 ? '' : 's'}`
    }
  } else {
    // Find first changed line
    for (let i = 0; i < oldLines.length; i++) {
      if (oldLines[i] !== newLines[i]) {
        const lineNum = i + 1
        if (newLines[i].trim() === '') {
          return `Cleared content at line ${lineNum}`
        } else if (oldLines[i].trim() === '') {
          return `Added content at line ${lineNum}`
        } else {
          return `Modified content around line ${lineNum}`
        }
      }
    }
    return 'Minor formatting changes'
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0