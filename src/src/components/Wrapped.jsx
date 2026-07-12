// Wrapped.jsx — GitHub Wrapped, restored (deleted 2 rounds ago, brought back
// per direction). Key difference from before: this is opt-in only — nothing
// mounts this automatically. It's reached via a button on the dashboard,
// same as the Profile Card. Spotify-Wrapped-style: one idea per screen,
// tap/click to advance, minimal fade+scale transitions, no auto-play race.
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer, PieChart, Pie } from 'recharts'
import { ProfileCard } from './ProfileCard.jsx'
import { calcIdentity } from '../lib/identity.js'
import { buildStory } from '../lib/narrative.js'
import { MagneticButton } from './MotionUI.jsx'
import { XIcon, DownloadIcon, CopyIcon, CheckIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'
import { LANG_COLORS, REPO_TYPE_COLORS } from '../lib/constants.js'

function Slide({ eyebrow, icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ maxWidth: 460, textAlign: 'center', padding: '0 24px' }}
    >
      {icon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.05 }}
          style={{ fontSize: 36, marginBottom: 10 }}
        >
          {icon}
        </motion.div>
      )}
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

// Real visuals, not just typography — each pulls from data already on the
// profile (reposByYear, repoTypes, languages), nothing invented for effect.
function YearsChart({ reposByYear, peakYear }) {
  if (!reposByYear?.length) return null
  return (
    <div style={{ width: 'min(320px, 78vw)', height: 100, margin: '22px auto 0' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={reposByYear} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {reposByYear.map((y, i) => <Cell key={i} fill={String(y.year) === String(peakYear) ? 'var(--br4, #f5c842)' : 'rgba(255,255,255,0.18)'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function FocusDonut({ repoTypes }) {
  if (!repoTypes?.length) return null
  const data = repoTypes.slice(0, 5)
  return (
    <div style={{ width: 150, height: 150, margin: '18px auto 0' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="type" innerRadius="60%" outerRadius="90%" paddingAngle={3} startAngle={90} endAngle={-270}>
            {data.map((d, i) => <Cell key={i} fill={REPO_TYPE_COLORS[d.type] || 'rgba(255,255,255,0.3)'} stroke="none" />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function LanguagesBar({ languages }) {
  if (!languages?.length) return null
  const top = languages.slice(0, 4)
  return (
    <div style={{ width: 'min(320px, 78vw)', margin: '22px auto 0' }}>
      {top.map((l, i) => (
        <div key={l.name} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
            <span>{l.name}</span><span>{l.pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${l.pct}%` }} transition={{ duration: 0.7, delay: i * 0.08 }} style={{ height: '100%', background: l.color || LANG_COLORS[l.name] || 'var(--br4, #f5c842)', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function BigNumber({ value, label }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    let raf, start
    const target = typeof value === 'number' ? value : 0
    const step = (t) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / 700)
      setShown(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{shown.toLocaleString()}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
    </div>
  )
}

// A real screenshot of the actual repo — GitHub's own public OpenGraph image
// endpoint, no API key, same one RepoShowcase already uses. This is what
// makes these slides "pictures from their GitHub" rather than more text.
function RepoHero({ owner, repoName }) {
  const [failed, setFailed] = useState(false)
  if (!repoName || failed) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
      style={{ width: 'min(360px, 82vw)', aspectRatio: '1200/630', borderRadius: 12, overflow: 'hidden', margin: '20px auto 0', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
    >
      <img src={`https://opengraph.githubassets.com/1/${owner}/${repoName}`} alt="" onError={() => setFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </motion.div>
  )
}

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
        <Slide eyebrow={BRAND.appName}>
          {data.user.avatar_url && (
            <motion.img src={data.user.avatar_url} alt="" crossOrigin="anonymous"
              initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', margin: '0 auto 18px', display: 'block' }}
            />
          )}
          <Headline>You are{'\n'}{identity.title}.</Headline><Sub>{identity.why}</Sub>
        </Slide>
      ) },
      { key: 'howYouBuild', render: () => (
        <Slide eyebrow="How you build" icon="🛠️"><Headline>{story.devTypeLine}</Headline><Sub>{story.consistency}</Sub></Slide>
      ) },
      { key: 'whatYouBuild', render: () => (
        <Slide eyebrow="What you build" icon="🚀"><Headline>{story.repos}</Headline><Sub>{story.reach}</Sub>
          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', marginTop: 20 }}>
            <BigNumber value={data.nonForkCount} label="projects" />
            <BigNumber value={data.totalStars} label="stars" />
          </div>
        </Slide>
      ) },
    ]
    if (story.peakYear) list.push({ key: 'peakYear', render: () => (
      <Slide eyebrow="Your strongest year" icon="📈"><Headline>{story.peakYear}</Headline><YearsChart reposByYear={data.reposByYear} peakYear={story.peakYear.match(/^\d{4}/)?.[0]} /></Slide>
    ) })
    if (story.focusArea) list.push({ key: 'focusArea', render: () => (
      <Slide eyebrow="Where the time went" icon="🧭"><Headline>{story.focusArea}</Headline><FocusDonut repoTypes={data.repoTypes} /></Slide>
    ) })
    list.push({ key: 'languages', render: () => (
      <Slide eyebrow="Languages" icon="💬"><Headline>{story.languages}</Headline><LanguagesBar languages={data.languages} /></Slide>
    ) })
    list.push({ key: 'community', render: () => (
      <Slide eyebrow="Community" icon="🤝"><Headline>{story.community}</Headline><Sub>{story.tenure}</Sub>
        <div style={{ display: 'flex', gap: 28, justifyContent: 'center', marginTop: 20 }}>
          <BigNumber value={data.user.followers} label="followers" />
          <BigNumber value={data.memberYears} label="years" />
        </div>
      </Slide>
    ) })
    if (story.spotlight) list.push({ key: 'spotlight', render: () => (
      <Slide eyebrow="Favorite project" icon="💛"><Headline>{story.spotlight.text}</Headline><RepoHero owner={data.user.login} repoName={story.spotlight.repoName} /></Slide>
    ) })
    if (story.biggestCodebase) list.push({ key: 'biggest', render: () => (
      <Slide eyebrow="Biggest codebase" icon="📦"><Headline>{story.biggestCodebase.text}</Headline><RepoHero owner={data.user.login} repoName={story.biggestCodebase.repoName} /></Slide>
    ) })
    if (story.mostUnderrated) list.push({ key: 'underrated', render: () => (
      <Slide eyebrow="Most underrated" icon="💎"><Headline>{story.mostUnderrated.text}</Headline><RepoHero owner={data.user.login} repoName={story.mostUnderrated.repoName} /></Slide>
    ) })
    if (story.longestMaintained) list.push({ key: 'longest', render: () => (
      <Slide eyebrow="Longest maintained" icon="🌱"><Headline>{story.longestMaintained.text}</Headline><RepoHero owner={data.user.login} repoName={story.longestMaintained.repoName} /></Slide>
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
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: '#0a0705', display: 'flex', flexDirection: 'column', cursor: 'pointer', overflow: 'hidden' }}
    >
      {/* ambient drifting glow — purely atmospheric, re-seeds gently per chapter */}
      <motion.div
        key={`glow-${idx}`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <motion.div
          animate={{ x: ['-10%', '8%', '-6%', '-10%'], y: ['-8%', '6%', '10%', '-8%'] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '10%', left: '10%', width: '55%', height: '55%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,200,66,0.09), transparent 70%)', filter: 'blur(50px)' }}
        />
        <motion.div
          animate={{ x: ['6%', '-8%', '4%', '6%'], y: ['6%', '-6%', '-10%', '6%'] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: '5%', right: '8%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,64,32,0.16), transparent 70%)', filter: 'blur(50px)' }}
        />
      </motion.div>

      <div style={{ display: 'flex', gap: 4, padding: '16px 16px 0', position: 'relative', zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
        {chapters.map((c, i) => (
          <div key={c.key} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
            {i <= idx && (
              <motion.div
                initial={{ width: i === idx ? '0%' : '100%' }} animate={{ width: '100%' }}
                transition={{ duration: i === idx ? 0.4 : 0 }}
                style={{ height: '100%', background: '#fff', boxShadow: i === idx ? '0 0 8px rgba(255,255,255,0.6)' : 'none' }}
              />
            )}
          </div>
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

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        <AnimatePresence mode="wait">
          <React.Fragment key={chapters[idx].key}>{chapters[idx].render()}</React.Fragment>
        </AnimatePresence>
      </div>
    </div>
  )
}
