import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'

// ─── ICONS ───────────────────────────────────────────────────────────────
const Icon = ({ size = 14, color = 'currentColor', stroke = 2, children, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
    {children}
  </svg>
)

const FlameIcon = (p) => <Icon {...p} fill="#ef4444" color="#ef4444" size={12}><path d="M12 2c-.5 0-.9.2-1.2.6C9.1 5.2 6.5 8 6.5 12c0 3 2.5 5.5 5.5 5.5s5.5-2.5 5.5-5.5c0-4-2.6-6.8-4.3-9.4-.3-.4-.7-.6-1.2-.6z" /><path d="M12 15c-1.4 0-2.5-1.1-2.5-2.5 0-1.5 2.5-4 2.5-4s2.5 2.5 2.5 4c0 1.4-1.1 2.5-2.5 2.5z" fill="#faf7f2" stroke="none" /></Icon>
const ShieldIcon = (p) => <Icon {...p} color="#22c55e" size={12}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></Icon>
const SkullIcon = (p) => <Icon {...p} color="#ef4444" size={12}><path d="M9 10h.01M15 10h.01" /><path d="M12 2a8 8 0 0 0-8 8v2a4 4 0 0 0 3 3.87v3.13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3.13A4 4 0 0 0 20 12v-2a8 8 0 0 0-8-8z" /><path d="M10 16h4M12 14v4" /></Icon>
const TargetIcon = (p) => <Icon {...p} color="#f59e0b" size={12}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="currentColor" /></Icon>
const UserIcon = (p) => <Icon {...p} color="#78716c" size={12}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>
const DownloadIcon = (p) => <Icon {...p} size={13}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Icon>
const CopyIcon = (p) => <Icon {...p} size={13}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Icon>
const CheckIcon = (p) => <Icon {...p} stroke={2.5} size={13}><polyline points="20 6 9 17 4 12" /></Icon>
const ShareIcon = (p) => <Icon {...p} size={13}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></Icon>
const CloseIcon = (p) => <Icon {...p} stroke={2.5} size={18}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
const LinkedInIcon = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
const XIcon = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>

// ─── UTILS ───────────────────────────────────────────────────────────────
function useTypewriter(text, speed = 16) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    setShown('')
    if (!text) return
    let i = 0
    const id = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(id) }, speed)
    return () => clearInterval(id)
  }, [text])
  return shown
}

const scoreColor = (s) => { if (s >= 80) return '#22c55e'; if (s >= 50) return '#f59e0b'; return '#ef4444' }
const scoreLabel = (s) => { if (s >= 90) return 'LEGENDARY'; if (s >= 80) return 'ELITE'; if (s >= 65) return 'SOLID'; if (s >= 50) return 'MID'; if (s >= 30) return 'COOKED'; return 'BURNT' }

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t) }, [onClose])
  const bg = { error: '#ef4444', success: '#22c55e', info: '#44403c' }[type]
  return (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
      style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: bg, color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
      {message}
    </motion.div>
  )
}

function AnimatedScore({ value, duration = 700 }) {
  const [display, setDisplay] = useState(0)
  const color = scoreColor(value)
  useEffect(() => {
    const start = performance.now()
    const tick = (now) => { const p = Math.min((now - start) / duration, 1); const eased = 1 - Math.pow(1 - p, 3); setDisplay(Math.round(value * eased)); if (p < 1) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  }, [value, duration])
  return <span style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color, fontVariantNumeric: 'tabular-nums' }}>{display}</span>
}

function Field({ label, icon, children, accent }) {
  return (
    <div style={{ padding: '10px 12px' }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ display: 'inline-flex', color: accent }}>{icon}</span>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#292524', lineHeight: 1.4, fontWeight: 500 }}>{children}</div>
    </div>
  )
}

function ShareModal({ isOpen, onClose, onLinkedIn, onX, onCopyImage, copied }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.92, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{ background: '#faf7f2', borderRadius: 16, padding: 20, maxWidth: 320, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', border: '1px solid #e7e5e4' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1c1917', display: 'flex', alignItems: 'center', gap: 6 }}><FlameIcon size={14} /> Share</h3>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 2, display: 'flex' }}><CloseIcon size={18} /></button>
            </div>
            <p style={{ fontSize: 12, color: '#78716c', marginBottom: 14, lineHeight: 1.4 }}>Card image copied. Paste it after opening the platform.</p>
            <button onClick={onCopyImage} style={{ width: '100%', height: 38, borderRadius: 10, background: copied ? '#22c55e' : '#faf7f2', color: copied ? '#fff' : '#44403c', border: `1.5px solid ${copied ? '#22c55e' : '#d6d3d1'}`, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', marginBottom: 10 }}>
              {copied ? <><CheckIcon size={12} color="#fff" /> Copied</> : <><CopyIcon size={12} /> Copy Image</>}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onLinkedIn} style={{ flex: 1, height: 36, borderRadius: 10, background: '#0077b5', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}><LinkedInIcon size={14} /> LinkedIn</button>
              <button onClick={onX} style={{ flex: 1, height: 36, borderRadius: 10, background: '#1c1917', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}><XIcon size={14} /> Post on X</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export function RoastCard({ roast, login }) {
  const cardRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [showShare, setShowShare] = useState(false)
  const [toast, setToast] = useState(null)
  const typed = useTypewriter(roast.roast, 16)
  const typingDone = typed.length === roast.roast.length

  const shareUrl = `https://gitstatus.techiesaie.com/?user=${login}`
  const sc = scoreColor(roast.score)
  const sl = scoreLabel(roast.score)

  const showToast = (message, type = 'info') => setToast({ message, type })

  const getCanvas = useCallback(async () => {
    const el = cardRef.current
    return html2canvas(el, {
      scale: 3,
      backgroundColor: '#faf7f2',
      useCORS: true,
      logging: false,
      removeContainer: true,
      width: el.offsetWidth,
      height: el.offsetHeight,
      onclone: (doc, cloned) => {
        cloned.style.borderRadius = '14px'
        cloned.style.border = '1.5px solid #d6d3d1'
        cloned.style.overflow = 'hidden'
        const link = doc.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
        doc.head.appendChild(link)
      },
    })
  }, [])

  const download = async () => {
    setStatus('rendering')
    try {
      const canvas = await getCanvas()
      const link = document.createElement('a')
      link.download = `gitstatus-roast-${login}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setStatus('done-download')
      showToast('Downloaded!', 'success')
    } catch {
      setStatus('error')
      showToast('Failed', 'error')
    }
    setTimeout(() => setStatus('idle'), 2000)
  }

  const copyImage = async () => {
    setStatus('rendering')
    try {
      const canvas = await getCanvas()
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          setStatus('done-copy')
          showToast('Copied!', 'success')
          setTimeout(() => setStatus('idle'), 2000)
          return
        }
      }
      const link = document.createElement('a')
      link.download = `gitstatus-roast-${login}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setStatus('idle')
      showToast('Downloaded instead', 'error')
    } catch {
      setStatus('error')
      showToast('Failed', 'error')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  const copyText = async () => {
    const text = `🔥 ${roast.title}\n\n${roast.roast}\n\nScore: ${roast.score}/100\n${shareUrl}`
    try {
      await navigator.clipboard.writeText(text)
      setStatus('done-text')
      showToast('Copied!', 'success')
    } catch {
      setStatus('error')
      showToast('Failed', 'error')
    }
    setTimeout(() => setStatus('idle'), 2000)
  }

  const shareLinkedIn = async () => {
    await copyImage()
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=500')
  }

  const shareX = async () => {
    await copyImage()
    const text = encodeURIComponent(`Just got roasted! 🔥 Score: ${roast.score}/100\n\n${shareUrl}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=600,height=400')
  }

  const btn = (base) => ({
    height: 34,
    padding: '0 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.12s ease',
    whiteSpace: 'nowrap',
    ...base,
  })

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}>
      {/* ═══ CARD ═══ */}
      <div ref={cardRef} style={{ background: '#faf7f2', borderRadius: 14, border: '1.5px solid #d6d3d1', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.05)' }}>
        <div style={{ height: 3, background: sc }} />

        <div style={{ padding: '16px 16px 12px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: sc, textTransform: 'uppercase' }}>GitStatus Roast</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#a8a29e' }}>@{login}</span>
          </div>

          {/* Title */}
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1c1917', letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 10px' }}>
            {roast.title}
          </h2>

          {/* Roast */}
          <div style={{ fontSize: 13, color: '#57534e', lineHeight: 1.5, marginBottom: 14, minHeight: 40 }}>
            {typed}
            {!typingDone && <span style={{ display: 'inline-block', width: 2, height: '1em', background: sc, marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />}
          </div>

          {/* ═══ SCORE UI — TINY, CLEAN ═══ */}
          <div style={{ marginTop: 2, paddingTop: 12, borderTop: '1px solid #e7e5e4' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <AnimatedScore value={roast.score} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#a8a29e' }}>/ 100</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: sc, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.04em', marginLeft: 4 }}>{sl}</span>
            </div>
            <div style={{ height: 4, background: '#e7e5e4', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${roast.score}%` }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }} style={{ height: '100%', borderRadius: 2, background: sc }} />
            </div>
          </div>
        </div>

        {/* Grid */}
        {typingDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1.5px solid #d6d3d1' }}>
            <div style={{ borderRight: '1.5px solid #d6d3d1', borderBottom: '1.5px solid #d6d3d1' }}>
              <Field label="Strength" icon={<ShieldIcon />} accent="#22c55e">{roast.strength}</Field>
            </div>
            <div style={{ borderBottom: '1.5px solid #d6d3d1' }}>
              <Field label="Weakness" icon={<SkullIcon />} accent="#ef4444">{roast.weakness}</Field>
            </div>
            <div style={{ borderRight: '1.5px solid #d6d3d1' }}>
              <Field label="Fun Facts" icon={<TargetIcon />} accent="#f59e0b">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {roast.funFacts.map((f, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#57534e', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <span style={{ color: '#f59e0b', flexShrink: 0, fontSize: 14, lineHeight: 1 }}>•</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </Field>
            </div>
            <div>
              <Field label="Dev Persona" icon={<UserIcon />} accent="#78716c">
                <span style={{ fontStyle: 'italic', fontSize: 11, color: '#44403c' }}>"{roast.ifDeveloper}"</span>
              </Field>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        {typingDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={{ padding: '8px 16px', borderTop: '1.5px solid #d6d3d1', display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, color: '#c8aa88', fontWeight: 600 }}>gitstatus.techiesaie.com</span>
          </motion.div>
        )}
      </div>

      {/* Buttons */}
      {typingDone && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.25 }} style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={download} disabled={status === 'rendering'} style={btn({ background: '#1c1917', color: '#fff', opacity: status === 'rendering' ? 0.5 : 1 })}>
            {status === 'done-download' ? <><CheckIcon size={12} color="#fff" /> Saved</> : status === 'rendering' ? '⏳' : <><DownloadIcon size={12} /> Download</>}
          </button>
          <button onClick={copyImage} disabled={status === 'rendering'} style={btn({ background: '#faf7f2', color: status === 'done-copy' ? '#22c55e' : '#44403c', border: `1.5px solid ${status === 'done-copy' ? '#22c55e' : '#d6d3d1'}` })}>
            {status === 'done-copy' ? <><CheckIcon size={12} color="#22c55e" /> Copied</> : <><CopyIcon size={12} /> Copy Image</>}
          </button>
          <button onClick={copyText} style={btn({ background: '#faf7f2', color: status === 'done-text' ? '#22c55e' : '#44403c', border: `1.5px solid ${status === 'done-text' ? '#22c55e' : '#d6d3d1'}` })}>
            {status === 'done-text' ? <><CheckIcon size={12} color="#22c55e" /> Copied</> : <><CopyIcon size={12} /> Copy Text</>}
          </button>
          <button onClick={() => setShowShare(true)} style={btn({ background: sc, color: '#fff' })}>
            <ShareIcon size={12} /> Share
          </button>
        </motion.div>
      )}

      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} onLinkedIn={shareLinkedIn} onX={shareX} onCopyImage={copyImage} copied={status === 'done-copy'} />
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </motion.div>
  )
}