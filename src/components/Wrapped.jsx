// Wrapped.jsx — GitHub Wrapped, restored (deleted 2 rounds ago, brought back
// per direction). Key difference from before: this is opt-in only — nothing
// mounts this automatically. It's reached via a button on the dashboard,
// same as the Profile Card. Spotify-Wrapped-style: one idea per screen,
// tap/click to advance, minimal fade+scale transitions, no auto-play race.
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { ProfileCard } from './ProfileCard.jsx'
import { calcIdentity } from '../lib/identity.js'
import { buildStory } from '../lib/narrative.js'
import { MagneticButton } from './MotionUI.jsx'
import { XIcon, DownloadIcon, CopyIcon, CheckIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'

function Slide({ eyebrow, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ maxWidth: 460, textAlign: 'center', padding: '0 24px' }}
    >
      {eyebrow && <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--br4)', marginBottom: 14 }}>{eyebrow.toUpperCase()}</div>}
      {children}
    </motion.div>
  )
}

const Headline = ({ children }) => (
  <div style={{ fontSize: 'clamp(24px,5vw,36px)', fontWeight: 800, color: '#fff', lineHeight: 1.25, letterSpacing: '-0.01em', whiteSpace: 'pre-line' }}>{children}</div>
)
const Sub = ({ children }) => (
  <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginTop: 14, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{children}</div>
)

function EndSlide({ data, cardRef, done, onDownload, onCopyLink, onFinish }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--br4)', marginBottom: 18 }}>{BRAND.appName.toUpperCase()} WRAPPED</div>
      <ProfileCard data={data} cardRef={cardRef} width="min(300px, 78vw)" />
      <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
        <MagneticButton onClick={onDownload} glow="rgba(255,255,255,0.2)" style={{ height: 40, padding: '0 16px', borderRadius: 9, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          {done === 'png' ? <><CheckIcon size={14} color="#4ade80" /> Saved</> : <><DownloadIcon size={14} /> Save Image</>}
        </MagneticButton>
        <MagneticButton onClick={onCopyLink} glow="rgba(255,255,255,0.2)" style={{ height: 40, padding: '0 16px', borderRadius: 9, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          {done === 'link' ? <><CheckIcon size={14} color="#4ade80" /> Link copied</> : <><CopyIcon size={14} /> Copy Link</>}
        </MagneticButton>
        <MagneticButton onClick={onFinish} glow="rgba(255,255,255,0.35)" style={{ height: 40, padding: '0 18px', borderRadius: 9, background: '#fff', color: '#150a04', border: 'none', fontSize: 13, fontWeight: 800, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>
          Done →
        </MagneticButton>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 16, maxWidth: 320 }}>
        Sharing the link opens this same story for anyone who opens it — not just a static image.
      </div>
    </motion.div>
  )
}

export function Wrapped({ data, onClose }) {
  const identity = useMemo(() => calcIdentity(data), [data])
  const story = useMemo(() => buildStory(data), [data])
  const cardRef = useRef(null)
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(null)

  const flash = (key) => { setDone(key); setTimeout(() => setDone(null), 2200) }

  const downloadPng = async () => {
    const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null })
    const a = document.createElement('a')
    a.download = `gitstatus-${data.user.login}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
    flash('png')
  }

  const copyLink = async () => {
    const url = `${BRAND.websiteUrl}/?user=${data.user.login}`
    await navigator.clipboard.writeText(url).catch(() => {})
    flash('link')
  }

  const chapters = useMemo(() => {
    const list = [
      { key: 'identity', render: () => (
        <Slide eyebrow={BRAND.appName}><Headline>You are{'\n'}{identity.title}.</Headline><Sub>{identity.why}</Sub></Slide>
      ) },
      { key: 'howYouBuild', render: () => (
        <Slide eyebrow="How you build"><Headline>{story.devTypeLine}</Headline><Sub>{story.consistency}</Sub></Slide>
      ) },
      { key: 'whatYouBuild', render: () => (
        <Slide eyebrow="What you build"><Headline>{story.repos}</Headline><Sub>{story.reach}</Sub></Slide>
      ) },
    ]
    if (story.peakYear) list.push({ key: 'peakYear', render: () => (
      <Slide eyebrow="Your strongest year"><Headline>{story.peakYear}</Headline></Slide>
    ) })
    if (story.focusArea) list.push({ key: 'focusArea', render: () => (
      <Slide eyebrow="Where the time went"><Headline>{story.focusArea}</Headline></Slide>
    ) })
    list.push({ key: 'languages', render: () => (
      <Slide eyebrow="Languages"><Headline>{story.languages}</Headline></Slide>
    ) })
    list.push({ key: 'community', render: () => (
      <Slide eyebrow="Community"><Headline>{story.community}</Headline><Sub>{story.tenure}</Sub></Slide>
    ) })
    if (story.spotlight) list.push({ key: 'spotlight', render: () => (
      <Slide eyebrow="Favorite project"><Headline>{story.spotlight}</Headline></Slide>
    ) })
    if (story.biggestCodebase) list.push({ key: 'biggest', render: () => (
      <Slide eyebrow="Biggest codebase"><Headline>{story.biggestCodebase}</Headline></Slide>
    ) })
    if (story.mostUnderrated) list.push({ key: 'underrated', render: () => (
      <Slide eyebrow="Most underrated"><Headline>{story.mostUnderrated}</Headline></Slide>
    ) })
    if (story.longestMaintained) list.push({ key: 'longest', render: () => (
      <Slide eyebrow="Longest maintained"><Headline>{story.longestMaintained}</Headline></Slide>
    ) })
    list.push({ key: 'end', render: () => (
      <EndSlide data={data} cardRef={cardRef} done={done} onDownload={downloadPng} onCopyLink={copyLink} onFinish={onClose} />
    ) })
    return list
  }, [identity, story, done])

  const last = chapters.length - 1
  const go = (dir) => setIdx((i) => Math.max(0, Math.min(last, i + dir)))

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div
      onClick={(e) => {
        const x = e.clientX / window.innerWidth
        if (x < 0.28) go(-1); else go(1)
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'linear-gradient(160deg,#15100a 0%,#0a0705 100%)', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', gap: 4, padding: '16px 16px 0' }} onClick={(e) => e.stopPropagation()}>
        {chapters.map((c, i) => (
          <div key={c.key} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= idx ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.18)' }} />
        ))}
      </div>

      <motion.button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
        style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
        aria-label="Close"
      >
        <XIcon size={15} color="#fff" />
      </motion.button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <React.Fragment key={chapters[idx].key}>{chapters[idx].render()}</React.Fragment>
        </AnimatePresence>
      </div>
    </div>
  )
}
