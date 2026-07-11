import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fetchGitHub, sanitizeUsername } from '../lib/github.js'
import { Spinner } from './Atoms.jsx'
import { LoadingExperience } from './LoadingExperience.jsx'
import { GithubIcon, FireIcon, StarIcon, ChartIcon, ShareIcon, AwardIcon, CodeIcon, TrendIcon, CompareIcon, ActivityIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'
import { MagneticButton, Spotlight } from './MotionUI.jsx'

const FEATURES = [
  [FireIcon, '#f97316', 'Streak Tracker', 'See daily contribution streaks'],
  [CodeIcon, '#3b82f6', 'Language Stats', 'Breakdown of every language used'],
  [StarIcon, '#d97706', 'Top Repos', 'Sorted by stars, forks, or activity'],
  [CompareIcon, '#8b5cf6', 'Deep Compare', '10-metric head-to-head analysis'],
  [ShareIcon, '#6b4020', 'Share Cards', 'Beautiful shareable profile cards'],
  [AwardIcon, '#22c55e', 'Dev Score', 'Deterministic 100-point score'],
  [ChartIcon, '#0ea5e9', 'Commit Charts', 'Monthly trends visualized'],
  [ActivityIcon, '#ef4444', 'Activity Feed', 'Live public GitHub events'],
]

const headline = "Your GitHub profile, beautifully analyzed."

// Word-by-word reveal — each word rises and fades in on its own spring, staggered.
function RevealText({ text, style, delay = 0 }) {
  const words = text.split(' ')
  return (
    <span style={{ display: 'inline' }}>
      {words.map((w, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.28em' }}>
          <motion.span
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: delay + i * 0.045 }}
            style={{ display: 'inline-block', ...style }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

// Slow drifting aurora blobs — mesh-gradient feel without a heavy asset.
function AuroraBackground() {
  const blobs = [
    { color: 'rgba(245,200,66,0.14)', size: 520, x: '10%', y: '10%', dur: 22 },
    { color: 'rgba(107,64,32,0.12)', size: 460, x: '75%', y: '55%', dur: 26 },
    { color: 'rgba(160,96,48,0.1)', size: 380, x: '45%', y: '80%', dur: 30 },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {blobs.map((b, i) => (
        <motion.div key={i}
          initial={{ left: b.x, top: b.y }}
          animate={{
            left: [b.x, `calc(${b.x} + 6%)`, `calc(${b.x} - 4%)`, b.x],
            top: [b.y, `calc(${b.y} - 5%)`, `calc(${b.y} + 6%)`, b.y],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', width: b.size, height: b.size, borderRadius: '50%', background: `radial-gradient(circle,${b.color} 0%,transparent 70%)`, filter: 'blur(30px)' }}
        />
      ))}
      {/* faint animated grid, Arc/Linear-style */}
      <motion.div
        initial={{ opacity: 0.4 }} animate={{ opacity: [0.25, 0.45, 0.25] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(61,32,16,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(61,32,16,0.035) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(circle at 50% 30%, black 0%, transparent 65%)',
        }}
      />
    </div>
  )
}

export function Landing({ onLoad, initialError = '' }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [submittedUser, setSubmittedUser] = useState('')
  const [error, setError] = useState(initialError)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef()
  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = async (uname) => {
    const u = (uname || username).trim()
    if (!u) return
    setSubmittedUser(sanitizeUsername(u))
    setLoading(true); setError('')
    try { onLoad(await fetchGitHub(u)) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const examples = ['torvalds', 'gaearon', 'sindresorhus', 'yyx990803', 'tj']

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      {loading && <LoadingExperience username={submittedUser} />}
      <AuroraBackground />
      <Spotlight color="rgba(245,200,66,0.1)" size={520} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 600, textAlign: 'center' }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 30 }}
        >
          <motion.div
            animate={{ rotate: [0, -4, 4, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 48, height: 48, background: 'var(--br)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(61,32,16,0.22)' }}
          >
            <GithubIcon size={26} color="#fff" />
          </motion.div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--br)', letterSpacing: '-0.03em', lineHeight: 1 }}>{BRAND.appName}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, letterSpacing: '0.03em' }}>{BRAND.tagline}</div>
          </div>
        </motion.div>

        <h1 style={{ fontSize: 'clamp(28px,6vw,48px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 14 }}>
          <RevealText text="Your GitHub profile," delay={0.15} />
          <br />
          <RevealText text="beautifully analyzed." style={{ color: 'var(--br2)' }} delay={0.5} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.5 }}
          style={{ fontSize: 16, color: 'var(--text3)', lineHeight: 1.65, maxWidth: 420, margin: '0 auto 34px' }}
        >
          Stats, streaks, languages, repos — all in one shareable card. Compare developers, share your wins.
        </motion.p>

        {/* Search input */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.0, type: 'spring', stiffness: 200, damping: 20 }}
          style={{
            background: 'var(--surface)', borderRadius: 'var(--r2)', padding: '5px 5px 5px 16px', display: 'flex', gap: 8, maxWidth: 460, margin: '0 auto 12px',
            border: `1.5px solid ${focused ? 'var(--br3)' : 'var(--border)'}`,
            boxShadow: focused ? '0 8px 32px rgba(61,32,16,0.16), 0 0 0 3px rgba(160,96,48,0.12)' : '0 4px 24px rgba(61,32,16,0.08)',
            transition: 'box-shadow 0.3s, border-color 0.3s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}><GithubIcon size={16} color="var(--text3)" /></div>
          <input ref={inputRef} value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder="Enter any GitHub username…"
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: 'var(--text)', outline: 'none', fontFamily: 'Inter,sans-serif', padding: '7px 0' }} />
          <MagneticButton onClick={() => submit()} disabled={loading} glow="rgba(107,64,32,0.35)"
            style={{ height: 44, padding: '0 22px', background: 'var(--br)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(61,32,16,0.2)' }}>
            {loading ? <Spinner size={16} color="#fff" /> : null}
            {loading ? 'Analyzing…' : 'Analyze →'}
          </MagneticButton>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ color: 'var(--red)', fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
            ⚠ {error}
          </motion.div>
        )}

        {/* Example buttons */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}
        >
          <span style={{ fontSize: 12, color: 'var(--text4)', alignSelf: 'center' }}>Try:</span>
          {examples.map((u, i) => (
            <motion.button key={u} onClick={() => submit(u)}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 + i * 0.05 }}
              whileHover={{ y: -2, backgroundColor: 'var(--bg3)', borderColor: 'var(--border2)', color: 'var(--text)' }}
              whileTap={{ scale: 0.95 }}
              style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 13px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 500 }}>
              @{u}
            </motion.button>
          ))}
        </motion.div>

        {/* Feature grid — floats gently, lifts on hover */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
          {FEATURES.map(([Icon, color, title, desc], i) => (
            <motion.div key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: (i % 4) * 0.06, type: 'spring', stiffness: 220, damping: 22 }}
              whileHover={{ y: -4, boxShadow: '0 12px 28px -8px rgba(61,32,16,0.18)', borderColor: 'var(--border2)' }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 14px', textAlign: 'left', cursor: 'default' }}
            >
              <motion.div
                animate={{ y: [0, -3, 0] }} transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                style={{ width: 28, height: 28, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}
              >
                <Icon size={15} color={color} />
              </motion.div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.45 }}>{desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Footer branding */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} style={{ fontSize: 12, color: 'var(--text4)' }}>
          Built by{' '}
          <a href={BRAND.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--br3)', fontWeight: 700, textDecoration: 'none' }}>{BRAND.madeBy}</a>
          {' · '}
          <a href={BRAND.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--br2)', fontWeight: 600, textDecoration: 'none' }}>{BRAND.website}</a>
        </motion.div>
      </div>
    </div>
  )
}
