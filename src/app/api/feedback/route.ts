import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Max length for string context fields to prevent abuse. */
const MAX_FIELD_LEN = 500
/** Max screenshot data-URL size (~200 KB base64). */
const MAX_SCREENSHOT_LEN = 300_000

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

/** Escape markdown special characters in user-provided strings. */
function escapeMarkdown(s: string): string {
  return s.replace(/[\\`*_{}[\]()#+\-.!|~>]/g, '\\$&')
}

/** Truncate and sanitize a context string. */
function sanitize(s: string): string {
  return escapeMarkdown(s.slice(0, MAX_FIELD_LEN))
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
    console.log('[feedback]', JSON.stringify({ title: body.title, body: body.body }))
    return NextResponse.json({ ok: true, stored: 'log' })
  }

  const contextLines: string[] = []
  if (body.context) {
    const c = body.context
    if (c.urlPath) contextLines.push(`- **URL**: ${sanitize(c.urlPath)}`)
    if (c.viewport) contextLines.push(`- **Viewport**: ${sanitize(c.viewport)}`)
    if (c.timestamp) contextLines.push(`- **Time**: ${sanitize(c.timestamp)}`)
    if (c.userAgent) contextLines.push(`- **UA**: ${sanitize(c.userAgent)}`)
  }

  // Only allow data: URLs for screenshots, and enforce a size limit
  const screenshot = body.context?.screenshot
  const validScreenshot =
    typeof screenshot === 'string' &&
    screenshot.startsWith('data:image/') &&
    screenshot.length <= MAX_SCREENSHOT_LEN
      ? screenshot
      : null

  const issueBody = [
    body.body,
    '',
    contextLines.length > 0 ? `### Context\n${contextLines.join('\n')}` : '',
    validScreenshot ? `### Screenshot\n![screenshot](${validScreenshot})` : '',
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
