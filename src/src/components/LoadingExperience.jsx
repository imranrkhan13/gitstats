// LoadingExperience.jsx — the "beautiful loading experience" between search
// and dashboard. Same visual language as Wrapped.jsx (dark gradient,
// fade/scale text) since that's the "wrapped kinda animation" being asked
// for — but this is NOT a card and shows no profile data. It's purely a
// loading state; it unmounts the moment the fetch resolves and the
// Dashboard takes over.
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GithubIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'

const STEPS = [
  'Fetching profile…',
  'Counting repositories…',
  'Adding up stars…',
  'Calculating streak…',
  'Almost there…',
]

export function LoadingExperience({ username }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep(s => Math.min(STEPS.length - 1, s + 1)), 850)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'linear-gradient(160deg,#15100a 0%,#0a0705 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--br, #3d2010)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 26 }}
      >
        <GithubIcon size={28} color="#fff" />
      </motion.div>

      {username && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.02em' }}>
          @{username}
        </div>
      )}

      <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}
          >
            {STEPS[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ width: 160, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.12)', marginTop: 22, overflow: 'hidden' }}>
        <motion.div
          animate={{ x: ['-100%', '220%'] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '40%', height: '100%', background: 'var(--br4, #f5c842)', borderRadius: 2 }}
        />
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 28, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {BRAND.appName}
      </div>
    </div>
  )
}
