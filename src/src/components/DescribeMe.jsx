// DescribeMe.jsx — "Describe Me": a warm, specific, real-data-grounded
// description, opposite tone of Roast. Simple reveal, reuses the same dark
// gradient + fade/scale language as Wrapped/LoadingExperience for
// consistency, not a whole new visual system.
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { templateAffirmation, generateAffirmation } from '../lib/affirmation.js'
import { MagneticButton } from './MotionUI.jsx'
import { XIcon, CopyIcon, CheckIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'

export function DescribeMe({ data, onClose }) {
  const [result, setResult] = useState(() => templateAffirmation(data))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    generateAffirmation(data).then(res => { if (!cancelled) setResult(res) })
    return () => { cancelled = true }
  }, [data.user.login])

  const copy = async () => {
    await navigator.clipboard.writeText(result.text).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'linear-gradient(160deg,#15100a 0%,#0a0705 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}
      >
        <motion.button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
          style={{ position: 'fixed', top: 18, right: 18, width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Close"
        >
          <XIcon size={16} color="#fff" />
        </motion.button>

        <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--br4)', marginBottom: 16 }}>
            {result.identity?.badge || result.identity?.title}
          </div>
          <div style={{ fontSize: 'clamp(19px,4.2vw,26px)', fontWeight: 800, color: '#fff', lineHeight: 1.45, letterSpacing: '-0.01em' }}>
            {result.text}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 26 }}>
            <MagneticButton onClick={copy} glow="rgba(255,255,255,0.2)" style={{ height: 40, padding: '0 16px', borderRadius: 9, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              {copied ? <><CheckIcon size={14} color="#4ade80" /> Copied</> : <><CopyIcon size={14} /> Copy</>}
            </MagneticButton>
            <MagneticButton onClick={(e) => { e.stopPropagation(); onClose() }} glow="rgba(255,255,255,0.35)" style={{ height: 40, padding: '0 18px', borderRadius: 9, background: '#fff', color: '#150a04', border: 'none', fontSize: 13, fontWeight: 800, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>
              Done
            </MagneticButton>
          </div>

          {!result.aiGenerated && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>
              Built from your real GitHub stats · {BRAND.appName}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
