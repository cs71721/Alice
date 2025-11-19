import { NextResponse } from 'next/server'
import { restoreVersion, addMessage } from '@/lib/kv'

export async function POST(request) {
  try {
    const { version, nickname } = await request.json()

    if (!version || !nickname) {
      return NextResponse.json(
        { error: 'Version and nickname are required' },
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

    // Restore the version directly (browser already confirmed)
    const restoredDoc = await restoreVersion(versionNum, nickname)

    // Add success message to chat
    await addMessage('Lava', `✓ Restored to v${versionNum}. This created v${restoredDoc.version}.`)

    return NextResponse.json({
      success: true,
      newVersion: restoredDoc.version
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
