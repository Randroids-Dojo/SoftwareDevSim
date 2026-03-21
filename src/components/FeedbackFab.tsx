'use client'

import { useEffect, useRef, useState } from 'react'

type View = 'closed' | 'menu' | 'feedback'
type SubmitState = 'idle' | 'sending' | 'success' | 'error'

function captureScreenshot(): string | null {
  try {
    const canvas = document.querySelector('canvas')
    if (!canvas || canvas.width === 0 || canvas.height === 0) return null

    const maxWidth = 320
    const scale = Math.min(1, maxWidth / canvas.width)
    const w = Math.round(canvas.width * scale)
    const h = Math.round(canvas.height * scale)

    const tmp = document.createElement('canvas')
    tmp.width = w
    tmp.height = h
    const ctx = tmp.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(canvas, 0, 0, w, h)
    return tmp.toDataURL('image/jpeg', 0.5)
  } catch {
    return null
  }
}

export default function FeedbackFab() {
  const [view, setView] = useState<View>('closed')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [message, setMessage] = useState('')
  const fabRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Close on Escape or click-outside
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && view !== 'closed') setView('closed')
    }
    function onClickOutside(e: MouseEvent) {
      const t = e.target as Node
      if (
        view !== 'closed' &&
        !fabRef.current?.contains(t) &&
        !menuRef.current?.contains(t) &&
        !panelRef.current?.contains(t)
      ) {
        setView('closed')
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClickOutside)
    }
  }, [view])

  function toggle() {
    setView((v) => (v === 'closed' ? 'menu' : 'closed'))
  }

  function openFeedback() {
    setView('feedback')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    const screenshot = captureScreenshot()

    setSubmitState('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Player Feedback',
          body: message.trim(),
          context: {
            urlPath: window.location.pathname,
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString(),
            screenshot,
          },
        }),
      })
      if (!res.ok) throw new Error(`status ${res.status}`)
      setSubmitState('success')
      setMessage('')
      setTimeout(() => {
        setView('closed')
        setTimeout(() => setSubmitState('idle'), 350)
      }, 2000)
    } catch {
      setSubmitState('error')
      setTimeout(() => setSubmitState('idle'), 3000)
    }
  }

  const isOpen = view !== 'closed'

  return (
    <>
      {/* FAB */}
      <button
        ref={fabRef}
        onClick={toggle}
        aria-label="Open menu"
        className={`sds-fab${isOpen ? ' open' : ''}`}
      >
        {/* Chat bubble icon */}
        <svg
          className="sds-fab-icon sds-fab-icon--default"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {/* Close icon */}
        <svg
          className="sds-fab-icon sds-fab-icon--close"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Menu */}
      <div ref={menuRef} className={`sds-fab-menu${view === 'menu' ? ' open' : ''}`}>
        <button className="sds-fab-menu-item" onClick={openFeedback}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Feedback
        </button>
      </div>

      {/* Feedback panel */}
      <div ref={panelRef} className={`sds-feedback-panel${view === 'feedback' ? ' open' : ''}`}>
        <div className="sds-feedback-header">
          <span>{'// send feedback'}</span>
        </div>

        {submitState !== 'success' ? (
          <form className="sds-feedback-form" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="sds-feedback-textarea"
              placeholder="What's on your mind?"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              type="submit"
              disabled={submitState === 'sending'}
              className={`sds-feedback-submit${submitState === 'sending' ? ' sending' : ''}${submitState === 'error' ? ' error' : ''}`}
            >
              <span className="label">
                {submitState === 'error' ? 'Failed \u2014 try again' : 'Send Feedback'}
              </span>
              <span className="sending">Sending\u2026</span>
              <svg
                className="arrow"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <span className="sds-feedback-hint">Posted as a GitHub issue</span>
          </form>
        ) : (
          <div className="sds-feedback-success">
            <div className="sds-feedback-success-icon">{'\u2713'}</div>
            <p>Thanks for the feedback!</p>
            <p className="sub">Your message has been submitted.</p>
          </div>
        )}
      </div>
    </>
  )
}
