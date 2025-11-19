import { NextResponse } from 'next/server'
import { getVersions } from '@/lib/kv'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const versions = await getVersions(limit)

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Error fetching versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0