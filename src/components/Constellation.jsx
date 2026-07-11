// Constellation.jsx — the "wow" moment. Every repo becomes a star in a
// unique map that only exists because of *this* person's actual GitHub
// activity — nobody else gets the same one, and it's not random: it's the
// same every time you open it, because it's built from real repo names,
// real stars, real languages (see lib/constellation.js). Stars twinkle in
// one at a time; hovering one shows which repo it is.
import React, { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { buildConstellation } from '../lib/constellation.js'
import { MagneticButton } from './MotionUI.jsx'
import { XIcon, DownloadIcon, CheckIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'

export function Constellation({ data, onClose }) {
  const { stars, connections, bgColors } = React.useMemo(() => buildConstellation(data), [data])
  const [hovered, setHovered] = useState(null)
  const [saved, setSaved] = useState(false)
  const cardRef = useRef(null)

  const download = async () => {
    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#0a0705' })
    const a = document.createElement('a')
    a.download = `gitstatus-constellation-${data.user.login}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
    setSaved(true); setTimeout(() => setSaved(false), 2200)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1400, background: `radial-gradient(circle at 50% 40%, ${bgColors[0]}22, #05030200 60%), #05030200`, backgroundColor: '#050302', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'pointer' }}
      >
        <motion.button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
          style={{ position: 'fixed', top: 18, right: 18, width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          aria-label="Close"
        >
          <XIcon size={16} color="#fff" />
        </motion.button>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)' }}>{BRAND.appName.toUpperCase()}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 4 }}>@{data.user.login}'s Code Constellation</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
            {stars.length} repos, mapped by language and reach — no two constellations are the same
          </div>
        </motion.div>

        <div ref={cardRef} onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 92vw)', aspectRatio: '1', position: 'relative', background: '#050302' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {connections.map((c, i) => (
              <motion.line key={i} x1={c.from.x} y1={c.from.y} x2={c.to.x} y2={c.to.y}
                stroke={c.from.color} strokeWidth={0.15}
                initial={{ opacity: 0 }} animate={{ opacity: 0.22 }} transition={{ delay: 1 + i * 0.02, duration: 0.6 }}
              />
            ))}
            {stars.map((s) => (
              <motion.circle
                key={s.id} cx={s.x} cy={s.y} r={s.r * 0.32}
                fill={s.color}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.75, 1], scale: 1 }}
                transition={{ delay: s.delay, duration: 0.6, opacity: { delay: s.delay, duration: 2.4, repeat: Infinity, repeatType: 'reverse', repeatDelay: Math.random() * 2 } }}
                style={{ cursor: 'pointer', filter: `drop-shadow(0 0 ${s.r * 0.5}px ${s.color})` }}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>

          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', pointerEvents: 'none', whiteSpace: 'nowrap' }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{hovered.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{hovered.lang || 'unknown'} · {hovered.stars} ★</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} style={{ marginTop: 10 }}>
          <MagneticButton onClick={(e) => { e.stopPropagation(); download() }} glow="rgba(255,255,255,0.2)"
            style={{ height: 40, padding: '0 18px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
            {saved ? <><CheckIcon size={14} color="#4ade80" /> Saved</> : <><DownloadIcon size={14} /> Save Constellation</>}
          </MagneticButton>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
