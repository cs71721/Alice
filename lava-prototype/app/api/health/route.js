import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function GET() {
  const health = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {}
  }

  // Check OpenAI API Key
  health.checks.openai = {
    configured: !!process.env.OPENAI_API_KEY,
    keyPrefix: process.env.OPENAI_API_KEY ?
      process.env.OPENAI_API_KEY.substring(0, 7) + '...' :
      'NOT SET'
  }

  // Check Vercel KV
  health.checks.vercelKV = {
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    KV_URL: !!process.env.KV_URL
  }

  // Try to connect to KV
  try {
    await kv.get('health-check-test')
    health.checks.vercelKV.canConnect = true
  } catch (error) {
    health.checks.vercelKV.canConnect = false
    health.checks.vercelKV.error = error.message
  }

  // Overall status
  const allOk = health.checks.openai.configured &&
                health.checks.vercelKV.KV_REST_API_URL &&
                health.checks.vercelKV.KV_REST_API_TOKEN &&
                health.checks.vercelKV.canConnect

  health.status = allOk ? 'healthy' : 'unhealthy'

  return NextResponse.json(health, {
    status: allOk ? 200 : 503
  })
}

export const dynamic = 'force-dynamic'
