// ═══════════════════════════════════════════════════════
// VoicePanel.jsx — Floating voice interaction UI
// ═══════════════════════════════════════════════════════
// Features:
//   • Floating modal (toggle from Navbar)
//   • Live waveform visualizer (canvas, 32 bars)
//   • Connection lifecycle display
//   • Live transcript (interim + final)
//   • Streamed AI response with typing effect
//   • Reconnect on error
//   • Conversation history log
// ═══════════════════════════════════════════════════════
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useVoice, VOICE_STATE } from '../hooks/useVoice'

const P = {
  b900: '#111111', b800: '#3a2417', b700: '#5a3a24', b600: '#6b4226',
  b500: '#8a5a3b', b400: '#a3714f', b300: '#c19a7c', b200: '#dcc3ae',
  b150: '#e7d6c6', b100: '#f0e4d7', b50: '#faf8f6',
  white: '#ffffff', g50: '#faf8f6', g100: '#f5f2ee',
  g200: '#ece7e2', g300: '#ddd5cc', g400: '#a8a29e', g500: '#666666',
  green: '#16a34a', red: '#b4482f', amber: '#8a5a3b',
}

const STATE_META = {
  [VOICE_STATE.IDLE]: { label: 'Ready', color: P.g300, dot: P.g300 },
  [VOICE_STATE.REQUESTING]: { label: 'Requesting…', color: P.amber, dot: P.amber },
  [VOICE_STATE.LISTENING]: { label: 'Listening', color: P.green, dot: P.green },
  [VOICE_STATE.SPEAKING]: { label: 'Speaking…', color: P.b400, dot: P.b400 },
  [VOICE_STATE.PROCESSING]: { label: 'Thinking…', color: P.b600, dot: P.b500 },
  [VOICE_STATE.RESPONDING]: { label: 'Responding', color: P.b800, dot: P.b700 },
  [VOICE_STATE.ERROR]: { label: 'Error', color: P.red, dot: P.red },
  [VOICE_STATE.UNSUPPORTED]: { label: 'Not supported', color: P.red, dot: P.red },
}

function Waveform({ volume, voiceState }) {
  const canvasRef = useRef()
  const barsRef = useRef(new Array(32).fill(0))
  const frameRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const n = barsRef.current.length
    const barW = W / n - 1.5

    const isActive = [
      VOICE_STATE.LISTENING,
      VOICE_STATE.SPEAKING,
      VOICE_STATE.PROCESSING,
      VOICE_STATE.RESPONDING,
    ].includes(voiceState)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      barsRef.current = barsRef.current.map((prev, i) => {
        if (!isActive) return Math.max(0, prev * 0.88)
        const dist = Math.abs(i - n / 2) / (n / 2)
        const noise = (Math.random() - 0.5) * 20
        const target = isActive
          ? (volume * (1 - dist * 0.5) * 0.55) + noise + 4
          : 2
        const clamped = Math.max(3, Math.min(H / 2 - 2, target))
        return prev * 0.6 + clamped * 0.4
      })

      barsRef.current.forEach((h, i) => {
        const x = i * (barW + 1.5)
        const cy = H / 2
        const intensity = h / (H / 2)
        const alpha = 0.35 + intensity * 0.65

        ctx.fillStyle = voiceState === VOICE_STATE.SPEAKING
          ? `rgba(138,90,59,${alpha})`
          : voiceState === VOICE_STATE.RESPONDING
            ? `rgba(107,66,38,${alpha})`
            : voiceState === VOICE_STATE.LISTENING
              ? `rgba(22,163,74,${alpha})`
              : `rgba(168,162,158,${alpha})`

        ctx.fillRect(x, cy - h, barW, h * 2)
      })

      frameRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(frameRef.current)
  }, [volume, voiceState])

  return (
    <canvas ref={canvasRef} width={200} height={48} style={{ display: 'block', borderRadius: 8 }} />
  )
}

function ConvEntry({ entry }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
        <div style={{
          background: P.b800, color: P.b100,
          borderRadius: '10px 2px 10px 10px',
          padding: '7px 12px', maxWidth: '85%',
          fontSize: 12, lineHeight: 1.5, fontWeight: 400,
        }}>{entry.user}</div>
      </div>
      {entry.ai && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{
            background: P.white, border: `1px solid ${P.g200}`,
            borderRadius: '2px 10px 10px 10px',
            padding: '7px 12px', maxWidth: '85%',
            fontSize: 12, lineHeight: 1.6, color: P.b900,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>{entry.ai}</div>
        </div>
      )}
    </div>
  )
}

export default function VoicePanel({ candidate, githubData, repoIndex, chatMode, selectedFilePath, isOpen, onClose, onSendToChat }) {
  const [history, setHistory] = useState([])
  const [error, setError] = useState(null)
  const [pendingUser, setPending] = useState(null)
  const scrollRef = useRef()

  const handleTranscript = useCallback((text) => {
    setError(null)
    setPending(text)
  }, [])

  const handleResponse = useCallback((text) => {
    if (!text) return
    setHistory(h => {
      const last = h[h.length - 1]
      if (last && !last.ai) {
        return [...h.slice(0, -1), { ...last, ai: text }]
      }
      return h
    })
    setPending(null)
  }, [])

  const handleError = useCallback((msg) => {
    setError(msg)
    setPending(null)
  }, [])

  const {
    voiceState, transcript, response,
    volume, isSupported, start, stop,
  } = useVoice({
    candidate,
    githubData,
    repoIndex,
    chatMode,
    selectedFilePath,
    onTranscript: (text) => {
      handleTranscript(text)
      setHistory(h => [...h, { user: text, ai: null }])
    },
    onResponse: handleResponse,
    onError: handleError,
  })

  const isActive = [
    VOICE_STATE.LISTENING,
    VOICE_STATE.SPEAKING,
    VOICE_STATE.PROCESSING,
    VOICE_STATE.RESPONDING,
  ].includes(voiceState)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history, response])

  useEffect(() => {
    if (!isOpen) stop({ discard: true })
  }, [isOpen, stop])

  const toggle = () => {
    if (isActive) stop()
    else start()
  }

  const sendLastToChat = () => {
    const last = history[history.length - 1]
    if (last?.ai && onSendToChat) {
      onSendToChat(last.user)
    }
  }

  const meta = STATE_META[voiceState] || STATE_META[VOICE_STATE.IDLE]

  if (!isOpen) return null

  return (
    <div className="voice-panel" style={{
      position: 'fixed', bottom: 24, right: 24,
      width: 340, zIndex: 200,
      fontFamily: 'var(--font)',
    }}>
      <div style={{
        background: P.white,
        border: `1px solid ${P.g200}`,
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          background: P.b800, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
              border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.95)', lineHeight: 1.2 }}>
                Voice Assistant
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: meta.dot, display: 'inline-block',
                  boxShadow: isActive ? `0 0 6px ${meta.dot}` : 'none',
                  transition: 'all 0.3s',
                }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  {meta.label}
                </span>
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none',
            borderRadius: '50%', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 14,
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >✕</button>
        </div>

        {/* Waveform + Status */}
        <div style={{
          background: `linear-gradient(135deg, ${P.b900} 0%, ${P.b800} 100%)`,
          padding: '16px 20px 14px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <Waveform volume={volume} voiceState={voiceState} />

          <div style={{ fontSize: 11, fontWeight: 500, color: meta.color, letterSpacing: '0.03em', transition: 'color 0.3s' }}>
            {voiceState === VOICE_STATE.IDLE && 'Press the mic to start'}
            {voiceState === VOICE_STATE.REQUESTING && 'Requesting microphone access…'}
            {voiceState === VOICE_STATE.LISTENING && 'Listening — speak now'}
            {voiceState === VOICE_STATE.SPEAKING && 'Got it, keep going…'}
            {voiceState === VOICE_STATE.PROCESSING && 'Processing your question…'}
            {voiceState === VOICE_STATE.RESPONDING && 'AI is responding…'}
            {voiceState === VOICE_STATE.ERROR && (error || 'Something went wrong')}
            {voiceState === VOICE_STATE.UNSUPPORTED && 'Browser not supported'}
          </div>

          {(transcript || voiceState === VOICE_STATE.SPEAKING) && (
            <div style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '7px 12px', width: '100%',
              fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5,
              fontStyle: transcript ? 'normal' : 'italic',
              minHeight: 28,
            }}>
              {transcript || 'Listening…'}
            </div>
          )}
        </div>

        {/* Conversation history */}
        {(history.length > 0 || response) && (
          <div ref={scrollRef} style={{
            maxHeight: 200, overflowY: 'auto',
            padding: '12px 14px 0',
            borderTop: `1px solid ${P.g200}`,
          }}>
            {history.map((entry, i) => (
              <ConvEntry key={i} entry={entry} />
            ))}
            {voiceState === VOICE_STATE.RESPONDING && response && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  background: P.b50, border: `1px solid ${P.b100}`,
                  borderRadius: '2px 10px 10px 10px',
                  padding: '7px 12px', maxWidth: '85%',
                  fontSize: 12, lineHeight: 1.6, color: P.b900,
                }}>
                  {response}
                  <span style={{
                    display: 'inline-block', width: 2, height: 12,
                    background: P.b400, marginLeft: 2,
                    animation: 'pulse 0.8s infinite',
                    verticalAlign: 'middle',
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div style={{ padding: '12px 14px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggle}
            disabled={!isSupported || voiceState === VOICE_STATE.REQUESTING}
            style={{
              flex: 1, height: 42, borderRadius: 10, border: 'none',
              background: isActive
                ? `linear-gradient(135deg, ${P.red} 0%, #b91c1c 100%)`
                : `linear-gradient(135deg, ${P.b800} 0%, ${P.b600} 100%)`,
              color: P.white,
              fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600,
              cursor: isSupported ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'all 0.2s',
              boxShadow: isActive ? '0 4px 12px rgba(220,38,38,0.35)' : '0 4px 12px rgba(61,31,0,0.25)',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => { if (isSupported && !isActive) e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {isActive
                ? <><rect x="6" y="6" width="12" height="12" rx="2" /></>
                : <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>
              }
            </svg>
            {isActive ? 'Stop' : 'Start Voice'}
          </button>

          {history.length > 0 && (
            <button
              onClick={sendLastToChat}
              title="Send last question to text chat"
              style={{
                width: 42, height: 42, borderRadius: 10, border: `1px solid ${P.g200}`,
                background: P.white, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = P.b50; e.currentTarget.style.borderColor = P.b200 }}
              onMouseLeave={e => { e.currentTarget.style.background = P.white; e.currentTarget.style.borderColor = P.g200 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.b600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          )}

          {history.length > 0 && (
            <button
              onClick={() => { setHistory([]); setError(null) }}
              title="Clear conversation"
              style={{
                width: 42, height: 42, borderRadius: 10, border: `1px solid ${P.g200}`,
                background: P.white, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5' }}
              onMouseLeave={e => { e.currentTarget.style.background = P.white; e.currentTarget.style.borderColor = P.g200 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={P.g400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>

        {!isSupported && (
          <div style={{
            margin: '0 14px 12px',
            padding: '8px 10px', borderRadius: 8,
            background: '#fef2f2', border: '1px solid #fecaca',
            fontSize: 11, color: P.red, lineHeight: 1.5,
          }}>
            Your browser doesn't support the Web Speech API. Try Chrome or Edge.
          </div>
        )}

        {error && voiceState !== VOICE_STATE.ERROR && (
          <div style={{
            margin: '0 14px 12px',
            padding: '8px 10px', borderRadius: 8,
            background: '#fef2f2', border: '1px solid #fecaca',
            fontSize: 11, color: P.red, lineHeight: 1.5,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: P.red, cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
        )}

        <div style={{ padding: '0 14px 12px', fontSize: 9, color: P.g400, letterSpacing: '0.04em', textAlign: 'center' }}>
          BROWSER SPEECH OR DEEPGRAM/WHISPER FALLBACK · MULTI-PROVIDER AI
        </div>
      </div>
    </div>
  )
}