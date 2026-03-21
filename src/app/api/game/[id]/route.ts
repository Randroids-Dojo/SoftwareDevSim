import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getKv } from '../../../../lib/kv'
import {
  GAME_STATE_VERSION,
  GameStateSchema,
  PersistedGameStateSchema,
} from '../../../../lib/schemas'

function gameKey(id: string): string {
  return `game:${id}`
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getKv().get(gameKey(id))

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const result = PersistedGameStateSchema.safeParse(data)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Stored data is invalid or version mismatch' },
      { status: 422 },
    )
  }

  return NextResponse.json(result.data)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let body: unknown
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    body = await request.json()
  } else {
    const text = await request.text()
    try {
      body = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
  }

  const result = GameStateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  const persisted = {
    version: GAME_STATE_VERSION,
    state: result.data,
    savedAt: Date.now(),
  }

  await getKv().set(gameKey(id), persisted)

  return NextResponse.json({ ok: true })
}
