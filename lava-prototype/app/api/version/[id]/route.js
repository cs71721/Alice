import { NextResponse } from 'next/server'
import { getVersion } from '@/lib/kv'

export async function GET(request, { params }) {
  try {
    const versionNum = parseInt(params.id, 10)

    if (isNaN(versionNum)) {
      return NextResponse.json(
        { error: 'Invalid version number' },
        { status: 400 }
      )
    }

    const versionData = await getVersion(versionNum)

    if (!versionData) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(versionData)
  } catch (error) {
    console.error('Error fetching version:', error)
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
