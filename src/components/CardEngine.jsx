import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

// TiltCard — the entire "card engine" now. What got deleted and why:
// no shield clip-path, no rarity ribbon, no particles, no holographic sheen,
// no foil — all of that read as a trading-card/gaming aesthetic, which is
// exactly the direction this moved away from. What's left is the one piece
// worth keeping: a restrained, physical-feeling tilt on hover, the kind
// Linear/Stripe/Apple product pages use on a card or device mockup. Small
// rotation range, soft shadow, no glow.
export function TiltCard({ width = 'min(360px, 88vw)', aspectRatio, children, className = '', style = {} }) {
  const ref = useRef(null)
  const rawRX = useMotionValue(0)
  const rawRY = useMotionValue(0)
  const hovered = useMotionValue(0)

  const springCfg = { stiffness: 240, damping: 26, mass: 0.6 }
  const rx = useSpring(rawRX, springCfg)
  const ry = useSpring(rawRY, springCfg)
  const lift = useSpring(hovered, { stiffness: 260, damping: 26 })

  const shadowY = useTransform(lift, [0, 1], [8, 20])
  const shadowBlur = useTransform(lift, [0, 1], [24, 40])
  const shadowOpacity = useTransform(lift, [0, 1], [0.08, 0.14])
  const boxShadow = useTransform([shadowY, shadowBlur, shadowOpacity], ([y, blur, op]) =>
    `0 ${y}px ${blur}px rgba(20,14,8,${op})`)

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    rawRY.set((x - 0.5) * 6)   // restrained — a hint of depth, not a gimmick
    rawRX.set((0.5 - y) * 4)
    hovered.set(1)
  }
  const onLeave = () => { rawRX.set(0); rawRY.set(0); hovered.set(0) }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={className}
      style={{ width, aspectRatio, maxWidth: '100%', position: 'relative', perspective: 1200, cursor: 'default', ...style }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div style={{
        width: '100%', height: '100%', borderRadius: 20, position: 'relative',
        rotateX: rx, rotateY: ry, boxShadow,
        background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        {children}
      </motion.div>
    </motion.div>
  )
}
