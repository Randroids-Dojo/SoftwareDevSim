import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface FeedbackPayload {
  title: string
  body: string
  context?: {
    urlPath?: string
    userAgent?: string
    viewport?: string
    timestamp?: string
    screenshot?: string | null
  }
}

function isValidPayload(data: unknown): data is FeedbackPayload {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return typeof obj.title === 'string' && typeof obj.body === 'string'
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: 'Missing title or body' }, { status: 400 })
  }

  const token = process.env.GITHUB_FEEDBACK_TOKEN
  const repo = process.env.GITHUB_FEEDBACK_REPO

  if (!token || !repo) {
    // Log feedback to server console when GitHub is not configured
    console.log('[feedback]', JSON.stringify({ title: body.title, body: body.body }))
    return NextResponse.json({ ok: true, stored: 'log' })
  }

  const contextLines: string[] = []
  if (body.context) {
    const c = body.context
    if (c.urlPath) contextLines.push(`- **URL**: ${c.urlPath}`)
    if (c.viewport) contextLines.push(`- **Viewport**: ${c.viewport}`)
    if (c.timestamp) contextLines.push(`- **Time**: ${c.timestamp}`)
    if (c.userAgent) contextLines.push(`- **UA**: ${c.userAgent}`)
  }

  const issueBody = [
    body.body,
    '',
    contextLines.length > 0 ? `### Context\n${contextLines.join('\n')}` : '',
    body.context?.screenshot ? `### Screenshot\n![screenshot](${body.context.screenshot})` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: body.title,
      body: issueBody,
      labels: ['feedback'],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[feedback] GitHub API error:', res.status, text)
    return NextResponse.json({ error: 'GitHub API error' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, stored: 'github' })
}
