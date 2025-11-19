import { NextResponse } from 'next/server'
import { restoreVersion, addMessage } from '@/lib/kv'

export async function POST(request) {
  try {
    const { version, restoredBy } = await request.json()

    if (!version) {
      return NextResponse.json(
        { error: 'Version number is required' },
        { status: 400 }
      )
    }

    const versionNum = parseInt(version, 10)
    if (isNaN(versionNum)) {
      return NextResponse.json(
        { error: 'Invalid version number' },
        { status: 400 }
      )
    }

    // Restore the version
    const restoredDoc = await restoreVersion(versionNum, restoredBy || 'System')

    // Log the restoration in chat
    await addMessage(
      'System',
      `✓ Document restored to version ${versionNum} (${restoredDoc.changeSummary})`
    )

    return NextResponse.json({
      success: true,
      document: restoredDoc,
      message: `Restored to version ${versionNum}`
    })
  } catch (error) {
    console.error('Error restoring version:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to restore version' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'