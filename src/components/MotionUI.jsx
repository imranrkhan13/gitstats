import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion'

// ── MagneticButton ───────────────────────────────────────────────────────────
// Lifts on hover, compresses on click, glows, and drifts a couple px toward
// the cursor (the "magnetic" feel Linear/Arc buttons have). Spring physics
// throughout — no linear easing anywhere in this file.
export function MagneticButton({ children, onClick, disabled, style = {}, glow = 'rgba(245,200,66,0.35)', magnetic = true, as = 'button', ...rest }) {
  const ref = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 300, damping: 20, mass: 0.4 })
  const sy = useSpring(my, { stiffness: 300, damping: 20, mass: 0.4 })

  const handleMove = (e) => {
    if (!magnetic || disabled) return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.18)
    my.set((e.clientY - (r.top + r.height / 2)) * 0.18)
  }
  const handleLeave = () => { mx.set(0); my.set(0) }

  const Comp = motion[as] || motion.button

  return (
    <Comp
      ref={ref}
      onClick={disabled ? undefined : onClick}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      disabled={disabled}
      style={{ x: sx, y: sy, ...style }}
      initial={false}
      // Hover/tap drive scale + shadow only — never a transform axis (x/y) that the
      // magnetic drift springs above already own. Mixing an externally-bound
      // MotionValue and a whileHover/whileTap target on the *same* key is what
      // was silently breaking these buttons (framer-motion drops the animation
      // rather than fighting itself over ownership of the property).
      whileHover={disabled ? {} : { scale: 1.04, boxShadow: `0 10px 28px -6px ${glow}` }}
      whileTap={disabled ? {} : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      {...rest}
    >
      {children}
    </Comp>
  )
}

// ── CountUp ───────────────────────────────────────────────────────────────
// Animates a number from 0 (or `from`) to `value` using Framer's imperative
// `animate()` driving a motion value — smoother than a setInterval hand-roll,
// and it can be cancelled/retargeted safely if value changes mid-flight.
export function CountUp({ value, from = 0, duration = 1.1, delay = 0, format = (n) => Math.round(n), style }) {
  const mv = useMotionValue(from)
  const [display, setDisplay] = useState(format(from))
  React.useEffect(() => {
    const controls = animate(mv, value, {
      duration, delay, ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(format(v)),
    })
    return controls.stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <span style={style}>{display}</span>
}

// ── Spotlight ─────────────────────────────────────────────────────────────
// A radial highlight that tracks the cursor within its container — used on
// hero backgrounds and empty-state panels for the "mouse-reactive lighting"
// Apple/Linear-style pages lean on.
export function Spotlight({ color = 'rgba(245,200,66,0.16)', size = 480 }) {
  const ref = useRef(null)
  const mx = useMotionValue(-1000)
  const my = useMotionValue(-1000)
  const bg = useTransform([mx, my], ([x, y]) => `radial-gradient(${size}px circle at ${x}px ${y}px, ${color}, transparent 70%)`)

  const handleMove = (e) => {
    const r = ref.current?.parentElement?.getBoundingClientRect()
    if (!r) return
    mx.set(e.clientX - r.left)
    my.set(e.clientY - r.top)
  }

  React.useEffect(() => {
    const parent = ref.current?.parentElement
    if (!parent) return
    parent.addEventListener('pointermove', handleMove)
    return () => parent.removeEventListener('pointermove', handleMove)
  }, [])

  return <motion.div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: bg }} />
}

// ── Ripple ────────────────────────────────────────────────────────────────
// Click ripple for flat icon buttons that don't warrant the full magnetic treatment.
export function useRipple() {
  const [ripples, setRipples] = useState([])
  const trigger = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const id = Date.now()
    setRipples(prev => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 650)
  }
  const RippleLayer = () => (
    <>
      {ripples.map(r => (
        <motion.span key={r.id}
          initial={{ opacity: 0.45, scale: 0 }} animate={{ opacity: 0, scale: 3.2 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          style={{ position: 'absolute', left: r.x, top: r.y, width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: '50%', background: 'currentColor', pointerEvents: 'none' }}
        />
      ))}
    </>
  )
  return [trigger, RippleLayer]
}
