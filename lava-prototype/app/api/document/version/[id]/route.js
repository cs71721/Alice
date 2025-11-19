import { NextResponse } from 'next/server'
import { getVersion } from '@/lib/kv'

export async function GET(request, { params }) {
  try {
    const version = parseInt(params.id, 10)

    if (isNaN(version)) {
      return NextResponse.json(
        { error: 'Invalid version number' },
        { status: 400 }
      )
    }

    const versionData = await getVersion(version)

    if (!versionData) {
      return NextResponse.json(
        { error: `Version ${version} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ version: versionData })
  } catch (error) {
    console.error('Error fetching version:', error)
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0