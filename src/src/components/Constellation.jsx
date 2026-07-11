// Constellation.jsx — v2. Same underlying idea (every repo is a star,
// positioned/sized/colored by real data — see lib/constellation.js) but
// actually looks like a night sky now: an ambient starfield behind the
// data-stars, soft nebula glow, sparkle-cross flares on the brighter stars,
// and a gentle parallax tilt on mouse move. The data-driven stars are still
// the only ones that are clickable/hoverable/labeled — the background field
// is pure atmosphere, never confused with real data.
import React, { useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import html2canvas from 'html2canvas'
import { buildConstellation } from '../lib/constellation.js'
import { hashString } from '../lib/utils.js'
import { MagneticButton } from './MotionUI.jsx'
import { XIcon, DownloadIcon, CheckIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'

// Pure-decoration ambient starfield — seeded so it's stable across renders,
// but explicitly NOT derived from repo data (no false precision implied).
function Starfield({ seed, count = 90 }) {
  let s = seed
  const rand = () => { s = (s * 16807) % 2147483647; return (s % 1000) / 1000 }
  const stars = Array.from({ length: count }).map((_, i) => ({
    x: rand() * 100, y: rand() * 100, size: 0.4 + rand() * 1, delay: rand() * 4, dur: 2 + rand() * 3,
  }))
  return (
    <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
      {stars.map((s, i) => (
        <motion.circle key={i} cx={s.x} cy={s.y} r={s.size} fill="#fff"
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.15, 0.6, 0.15] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  )
}

function Sparkle({ x, y, size, color }) {
  const arm = size * 1.8
  return (
    <g opacity={0.85}>
      <line x1={x - arm} y1={y} x2={x + arm} y2={y} stroke={color} strokeWidth={0.12} />
      <line x1={x} y1={y - arm} x2={x} y2={y + arm} stroke={color} strokeWidth={0.12} />
    </g>
  )
}

export function Constellation({ data, onClose }) {
  const { stars, connections, bgColors } = React.useMemo(() => buildConstellation(data), [data])
  const [hovered, setHovered] = useState(null)
  const [saved, setSaved] = useState(false)
  const cardRef = useRef(null)
  const wrapRef = useRef(null)

  const mx = useMotionValue(0), my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 120, damping: 20 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 120, damping: 20 })

  const onMove = (e) => {
    const r = wrapRef.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => { mx.set(0); my.set(0) }

  const download = async () => {
    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#050302' })
    const a = document.createElement('a')
    a.download = `gitstatus-constellation-${data.user.login}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
    setSaved(true); setTimeout(() => setSaved(false), 2200)
  }

  const seed = hashString(data.user.login)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1400, background: '#050302', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'pointer', overflow: 'hidden' }}
      >
        {/* nebula glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '20%', left: '15%', width: '55%', height: '55%', borderRadius: '50%', background: `radial-gradient(circle, ${bgColors[0]}2a, transparent 70%)`, filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '45%', height: '45%', borderRadius: '50%', background: `radial-gradient(circle, ${bgColors[1] || bgColors[0]}22, transparent 70%)`, filter: 'blur(40px)' }} />
        </div>
        <Starfield seed={seed} />

        <motion.button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
          style={{ position: 'fixed', top: 18, right: 18, width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          aria-label="Close"
        >
          <XIcon size={16} color="#fff" />
        </motion.button>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 8, position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>{BRAND.appName.toUpperCase()}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 4 }}>@{data.user.login}'s Code Constellation</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            {stars.length} repos, mapped by language and reach — no two constellations are the same
          </div>
        </motion.div>

        <div
          ref={wrapRef} onMouseMove={onMove} onMouseLeave={onLeave} onClick={(e) => e.stopPropagation()}
          style={{ width: 'min(560px, 92vw)', aspectRatio: '1', position: 'relative', zIndex: 2, perspective: 800 }}
        >
          <motion.div ref={cardRef} style={{ width: '100%', height: '100%', position: 'relative', rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                {connections.map((c, i) => (
                  <linearGradient key={i} id={`gsline${i}`} x1={c.from.x} y1={c.from.y} x2={c.to.x} y2={c.to.y} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={c.from.color} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={c.to.color} stopOpacity="0.05" />
                  </linearGradient>
                ))}
              </defs>
              {connections.map((c, i) => (
                <motion.line key={i} x1={c.from.x} y1={c.from.y} x2={c.to.x} y2={c.to.y}
                  stroke={`url(#gsline${i})`} strokeWidth={0.2}
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 1 + i * 0.02, duration: 0.8 }}
                />
              ))}
              {stars.map((s) => (
                <motion.g key={s.id}
                  initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: s.delay, duration: 0.5, type: 'spring', stiffness: 200 }}
                  onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={s.x} cy={s.y} r={s.r * 0.55} fill={s.color} opacity={0.18} style={{ filter: `blur(1.5px)` }} />
                  <motion.circle cx={s.x} cy={s.y} r={s.r * 0.3} fill={s.color}
                    animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, repeatDelay: Math.random() * 2 }}
                    style={{ filter: `drop-shadow(0 0 ${s.r * 0.6}px ${s.color})` }}
                  />
                  {s.r > 5 && <Sparkle x={s.x} y={s.y} size={s.r * 0.3} color={s.color} />}
                </motion.g>
              ))}
            </svg>

            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%) translateZ(20px)', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', pointerEvents: 'none', whiteSpace: 'nowrap' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{hovered.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{hovered.lang || 'unknown'} · {hovered.stars} ★</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} style={{ marginTop: 14, position: 'relative', zIndex: 2 }}>
          <MagneticButton onClick={(e) => { e.stopPropagation(); download() }} glow="rgba(255,255,255,0.2)"
            style={{ height: 40, padding: '0 18px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
            {saved ? <><CheckIcon size={14} color="#4ade80" /> Saved</> : <><DownloadIcon size={14} /> Save Constellation</>}
          </MagneticButton>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
