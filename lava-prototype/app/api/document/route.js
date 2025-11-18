import { NextResponse } from 'next/server'
import { getDocument, initDocument } from '@/lib/kv'

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

export const dynamic = 'force-dynamic'
export const revalidate = 0
