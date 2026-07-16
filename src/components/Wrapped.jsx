// Wrapped.jsx — GitHub Wrapped. Premium shareable cards. No emojis. Icons only.
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import html2canvas from 'html2canvas'
import { calcIdentity } from '../lib/identity.js'
import { buildStory } from '../lib/narrative.js'
import { MagneticButton } from './MotionUI.jsx'
import { XIcon, DownloadIcon, CopyIcon, CheckIcon, ShareIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'

// ── Twitter / X Icon ──
export function TwitterIcon({ size = 16, color = ESPRESSO }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  )
}

const CREAM = '#faf8f5'
const ESPRESSO = '#3d2b1f'
const MOCHA = '#6f4e37'

const VIBES = [
  { bg: 'linear-gradient(165deg, #faf8f5 0%, #f5efe6 45%, #e8dfd1 100%)', accent: '#3d2b1f', glow: 'rgba(61,43,31,0.14)', text: '#3d2b1f', orb: 'rgba(61,43,31,0.06)' },
  { bg: 'linear-gradient(165deg, #f5efe6 0%, #ebe0d1 45%, #dccbb8 100%)', accent: '#6f4e37', glow: 'rgba(111,78,55,0.14)', text: '#4a3428', orb: 'rgba(111,78,55,0.08)' },
  { bg: 'linear-gradient(165deg, #fff8f0 0%, #f5e6d3 45%, #e8d5c4 100%)', accent: '#c17f59', glow: 'rgba(193,127,89,0.14)', text: '#5c3a21', orb: 'rgba(193,127,89,0.08)' },
  { bg: 'linear-gradient(165deg, #f4f7f2 0%, #e8ebe5 45%, #d9dfd3 100%)', accent: '#8a9a7b', glow: 'rgba(138,154,123,0.14)', text: '#2f3a28', orb: 'rgba(138,154,123,0.08)' },
  { bg: 'linear-gradient(165deg, #f0f3f5 0%, #e2e8ec 45%, #d1d9e0 100%)', accent: '#5c6b73', glow: 'rgba(92,107,115,0.14)', text: '#2c3a42', orb: 'rgba(92,107,115,0.08)' },
  { bg: 'linear-gradient(165deg, #faf3f5 0%, #f0e2e6 45%, #e5d1d8 100%)', accent: '#b5838d', glow: 'rgba(181,131,141,0.14)', text: '#4a2f35', orb: 'rgba(181,131,141,0.08)' },
  { bg: 'linear-gradient(165deg, #faf6f0 0%, #f0e8d8 45%, #e5d9c4 100%)', accent: '#d4a373', glow: 'rgba(212,163,115,0.14)', text: '#4a3a28', orb: 'rgba(212,163,115,0.08)' },
]

function vibeForUser(login) {
  if (!login) return VIBES[0]
  let h = 0
  for (let i = 0; i < login.length; i++) h = (h * 31 + login.charCodeAt(i)) % VIBES.length
  return VIBES[h]
}

const MEME_POOL = [
  "Messi has a World Cup. Ronaldo has… a really good gym routine.",
  "LeBron lost 6 Finals. You lost 0 commits today. Who's the real goat?",
  "The Knicks finally won something. You finally shipped that feature.",
  "Tiki-taka: 67 passes to score one goal. You: 67 commits to fix one bug.",
  "Haaland scores for fun. You push to main for fun. Same energy.",
  "Mbappe ran past defenders. You ran past 12 merge conflicts.",
  "Vinicius got a Ballon d'Or snub. You got a 'LGTM' from your PM. Worse.",
  "Arsenal bottled the league. You bottled that README update. It happens.",
  "Kane still has no trophies. You have no open issues. You're winning.",
  "The 67 meme lives on. Your commit history? Also a meme.",
  "Tiki-taka without the finish = your PR without tests.",
  "Ronaldo's free kick record is mid. Your code review speed? Elite.",
  "LeBron's 40k points. Your 40k lines of code. Both legends.",
  "Man City bought the league. You bought a Pro license. Same hustle.",
  "Fergie time = you pushing code at 11:59 PM before the sprint ends.",
  "Neymar's injury record > your bug count. Stay healthy, king.",
  "Bellingham's late winners = your late-night hotfixes. Clutch.",
  "Wrexham got promoted. Your repo got 10 stars. Both Hollywood endings.",
  "Saka missed the pen. You missed the semicolon. We all miss sometimes.",
  "Zidane headbutted Materazzi. You headbutted production. Legend.",
  "The 2014 World Cup final went to extra time. Your deploy went to rollback.",
  "Modric at 38 still running midfield. You at 3 AM still running tests.",
  "Guardiola overthinks UCL finals. You overthink variable names. Twins.",
  "Ohtani does both. You do frontend AND backend. Two-way player.",
  "Mahomes no-look pass. You no-look merge. Same confidence, worse outcome.",
  "Jordan won 6 rings. You closed 6 issues before lunch. GOAT behavior.",
  "Steph from the logo. You committing from the terminal. Range.",
  "Giannis came from nothing. Your repo came from a tutorial. Growth.",
  "Jokic triple-doubles for breakfast. You triple-commits before coffee.",
  "Luka's step-back 3 = your git rebase -i. Crafty. Risky. Beautiful.",
  "Tom Brady at 45. Your legacy code at 5 years. Both still winning.",
  "Usain Bolt ran 9.58s. Your CI ran 9.58 minutes. Close enough.",
  "Tyson bit an ear. You bit off more than you could chew in this sprint.",
  "Ali floated like a butterfly. Your code floats like a memory leak.",
  "Tiger's comeback = your comeback from that force push to main.",
  "Roger Federer's backhand = your one-liner fix. Pure elegance.",
  "Serena served aces. You served 500 errors. Different sport, same intensity.",
  "The 67 meme never dies. Neither does that one branch you forgot to delete.",
  "Tiki-taka: possession without purpose. Your meetings: same vibe.",
  "Pep's bald fraud allegations < your 'it works on my machine' allegations.",
  "Ronaldo's SIUUU = your push notification after a green build.",
  "Messi's 8th Ballon d'Or. Your 8th coffee of the day. Both deserved.",
  "The Knicks won a trophy in '73. Your last green build was… also historic.",
  "LeGM traded his teammates. You traded your tech stack. Both rebuilding.",
  "Kawhi's laugh > your commit messages. Work on both.",
  "Dame Time = you at 11:58 PM realizing the deadline is midnight.",
  "Harden's step-back = your step-back from microservices to monolith.",
  "Westbrook's triple-double obsession = your line-count obsession. Stats matter.",
  "KD's burner accounts = your alt GitHub accounts for starring your own repos.",
  "Kyrie's flat earth theory = your 'we don't need tests' theory. Both wrong.",
  "Simmons won't shoot. You won't write docs. Cowards, both of you.",
  "Embiid's injury history = your dependency update history. Fragile.",
  "The Process = your refactoring process. Trust it. Maybe.",
  "Linsanity lasted 2 weeks. Your productivity spike also lasted 2 weeks.",
  "Manning's Omaha = your console.log('here'). Audibles.",
  "Brees' accuracy = your linting config. Precise. Beautiful. Necessary.",
  "Beckham's one-handed catch = your one-handed keyboard shortcut. Flashy.",
  "Randy Moss ran deep. Your git history runs deep. Moss.",
  "Gronk spiked the ball. You spiked the server. Different energy.",
  "Bill Belichick's hoodie = your dark mode IDE. Uniform of champions.",
  "Sean McVay's age = your framework's age. Young. Overhyped. Maybe great.",
  "Andy Reid's playbook = your node_modules. Thick. Complex. Necessary evil.",
  "The Immaculate Reception = your git reflog. Miraculous recovery.",
  "Beast Mode = your coding mode after 4 Red Bulls. Skittles optional.",
]

function getMemesForUser(login, count) {
  const pool = [...MEME_POOL]
  let seed = 0
  if (login) for (let i = 0; i < login.length; i++) seed = (seed * 31 + login.charCodeAt(i)) % 9973
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (seed * 16807 + 1) % 2147483647
    const j = seed % (i + 1)
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

function AnimatedNumber({ value, duration = 1.1, format }) {
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const controls = animate(mv, value || 0, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setDisplay(v) })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  const n = Math.round(display)
  return <>{format ? format(n) : n.toLocaleString()}</>
}

async function captureCard(cardEl) {
  if (!cardEl) return null
  const canvas = await html2canvas(cardEl, { scale: 3, useCORS: true, allowTaint: true, backgroundColor: null, logging: false })
  return canvas.toDataURL('image/png')
}

async function nativeShare({ title, text, url }) {
  if (navigator.share && navigator.canShare) {
    try { await navigator.share({ title, text, url }); return true } catch { return false }
  }
  return false
}

function tweetUrl(text, url) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

function scoreTier(score) {
  if (score == null) return null
  if (score >= 90) return 'Top 1%'
  if (score >= 75) return 'Top 10%'
  if (score >= 55) return 'Top 25%'
  if (score >= 30) return 'Top 50%'
  return 'Just Getting Started'
}

function getAward(data) {
  const es = data.eventStats || {}
  const weekendPct = es.weekendPct
  const hour = es.mostActiveHour
  const day = es.mostActiveDay
  if (data.longestStreak >= 100) return { icon: 'activity', title: 'The Unstoppable', roast: `${data.longestStreak} days without missing a commit. Do you sleep?` }
  if (hour === 'Late Night') return { icon: 'eye', title: 'Night Owl', roast: `The moon has seen more of your code than your coworkers.` }
  if (weekendPct != null && weekendPct >= 45) return { icon: 'zap', title: 'Weekend Warrior', roast: `${weekendPct}% weekend activity. "Rest" is just a folder you haven't opened.` }
  if (es.developerStyle === 'Collaborator') return { icon: 'eye', title: 'The Reviewer', roast: `More PR reviews than pushes. You've read more of other people's code than your own.` }
  if ((data.user?.followers || 0) > (data.user?.following || 1) * 3 && (data.user?.followers || 0) > 20) return { icon: 'trending', title: 'Quietly Popular', roast: `More followers than following. Main character energy.` }
  if (data.longestStreak >= 30) return { icon: 'flame', title: 'Certified Grinder', roast: `${data.longestStreak} straight days. Mildly concerning — but impressive.` }
  if ((data.archivedCount || 0) > (data.activeRepoCount || 1)) return { icon: 'layers', title: 'Graveyard Keeper', roast: `More archived repos than active ones. Museum of good intentions.` }
  if (data.languages?.length >= 8) return { icon: 'users', title: 'The Polyglot', roast: `${data.languages.length} languages. Commitment issues, but for code.` }
  if (day) return { icon: 'calendar', title: `${day} Committer`, roast: `${day}s are your power day. Everyone else is doing this on Monday.` }
  return { icon: 'wrench', title: 'The Builder', roast: `Steady, consistent, shipping quietly. The backbone nobody thanks enough.` }
}

// ── Inline Icons (stroke, no fill) ──
function Ico({ size = 22, color = ESPRESSO, stroke = 2, children }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
}
const I = {
  user: <Ico><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Ico>,
  wrench: <Ico><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></Ico>,
  package: <Ico><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></Ico>,
  flame: <Ico><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.5 0-2.5 1.5-2.5 3 0 1.5.5 2.5 1.5 3.5 1 1 2.5 1.5 4 1.5 2 0 3.5-1 4.5-2.5 1-1.5 1.5-3.5 1.5-5.5 0-2.5-1-4-2.5-5.5-1.5-1.5-3.5-2-5.5-2-2 0-4 .5-5.5 2C4 5 3 7 3 9.5c0 2.5 1 4.5 2.5 6 1.5 1.5 3.5 2.5 5.5 2.5 2 0 4-1 5.5-2.5 1.5-1.5 2.5-3.5 2.5-5.5" /></Ico>,
  rocket: <Ico><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></Ico>,
  target: <Ico><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></Ico>,
  code: <Ico><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></Ico>,
  scale: <Ico><path d="M12 3v18" /><path d="M3 6l9-3 9 3" /><path d="M4 10a6 6 0 0 0 4 5.5" /><path d="M20 10a6 6 0 0 1-4 5.5" /><path d="M4 14h16" /></Ico>,
  gitMerge: <Ico><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 21V9a9 9 0 0 0 9 9" /></Ico>,
  bug: <Ico><path d="M8 6l-4 4" /><path d="M16 6l4 4" /><path d="M12 12h.01" /><path d="M12 16v4" /><path d="M9 20l-2-2" /><path d="M15 20l2-2" /><path d="M8 10l-4-4" /><path d="M16 10l4-4" /><path d="M12 2v8" /></Ico>,
  eye: <Ico><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></Ico>,
  zap: <Ico><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Ico>,
  folder: <Ico><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></Ico>,
  users: <Ico><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Ico>,
  clock: <Ico><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Ico>,
  calendar: <Ico><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></Ico>,
  barChart: <Ico><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></Ico>,
  star: <Ico><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Ico>,
  layers: <Ico><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></Ico>,
  gem: <Ico><path d="M6 3h12l4 6-10 13L2 9z" /><path d="M11 3v20" /><path d="M2 9h20" /></Ico>,
  tree: <Ico><path d="M10 20v-8h4v8" /><path d="M12 12L7 7" /><path d="M12 12l5-5" /><path d="M12 2v10" /></Ico>,
  tag: <Ico><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z" /><circle cx="7" cy="7" r="2" /></Ico>,
  sparkles: <Ico><path d="M12 3L9 9l-6 3 6 3 3 6 3-6 6-3-6-3-3-6z" /><path d="M5 3L4 4" /><path d="M19 3l1 1" /><path d="M3 19l1 1" /><path d="M21 19l-1 1" /></Ico>,
  trending: <Ico><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></Ico>,
  activity: <Ico><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Ico>,
  moon: <Ico><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Ico>,
  sun: <Ico><circle cx="12" cy="12" r="5" /><path d="M12 1v2" /><path d="M12 21v2" /><path d="M4.22 4.22l1.42 1.42" /><path d="M18.36 18.36l1.42 1.42" /><path d="M1 12h2" /><path d="M21 12h2" /><path d="M4.22 19.78l1.42-1.42" /><path d="M18.36 5.64l1.42-1.42" /></Ico>,
}

function AwardIcon({ name, color, size = 28 }) {
  const icon = I[name] || I.activity
  return React.cloneElement(icon, { size, color })
}

// ── Visual Components ──

function Orb({ color, style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(44px)', opacity: 0.45, pointerEvents: 'none', ...style, background: color }} />
}

function GlassSurface({ children, style, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ borderRadius: 16, padding: '14px 12px', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(12px) saturate(140%)', WebkitBackdropFilter: 'blur(12px) saturate(140%)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)', ...style }}>
      {children}
    </motion.div>
  )
}

function MiniGauge({ value, max = 100, color, size = 44, label }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const c = 2 * Math.PI * (size / 2 - 4)
  const off = c - (pct / 100) * c
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={3} />
        <motion.circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={size > 40 ? 11 : 9} fontWeight={700} fill={ESPRESSO}>{Math.round(pct)}</text>
      </svg>
      {label && <span style={{ fontSize: 9, fontWeight: 600, color: MOCHA, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>}
    </div>
  )
}

function SparkLine({ data, color, width = 120, height = 30 }) {
  if (!data?.length) return null
  const mx = Math.max(...data, 1)
  const mn = Math.min(...data, 0)
  const r = mx - mn || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - mn) / r) * height}`).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={pts} opacity={0.7} />
      <circle cx={width} cy={height - ((data[data.length - 1] - mn) / r) * height} r={3} fill={color} />
    </svg>
  )
}

function HeatStrip({ data, color }) {
  if (!data?.length) return null
  const mx = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', gap: 2, height: 24, alignItems: 'flex-end' }}>
      {data.map((v, i) => (
        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${Math.max(2, (v / mx) * 24)}px` }}
          transition={{ delay: i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: 4, borderRadius: 2, background: color, opacity: 0.35 + (v / mx) * 0.65 }} />
      ))}
    </div>
  )
}

function MiniBars({ items, color, height = 36 }) {
  if (!items?.length) return null
  const mx = Math.max(...items.map(i => i.max || i.value), 1)
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height }}>
      {items.map((item, i) => (
        <div key={item.label} style={{ flex: 1, textAlign: 'center' }}>
          <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(3, (item.value / mx) * (height - 14))}px` }}
            transition={{ delay: 0.08 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', borderRadius: 4, background: color, opacity: 0.75 }} />
          <div style={{ fontSize: 8, color: MOCHA, marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}

function Badge({ children, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: color ? `${color}18` : 'rgba(0,0,0,0.04)', color: color || ESPRESSO, border: `1px solid ${color ? `${color}30` : 'rgba(0,0,0,0.06)'}`, letterSpacing: '0.02em' }}>
      {children}
    </span>
  )
}

function StatPill({ label, value, sub, delay = 0, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ textAlign: 'center', padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 1px 4px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5)', minWidth: 72, flex: '1 1 auto' }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: color || ESPRESSO, letterSpacing: '-0.01em' }}>{typeof value === 'number' ? <AnimatedNumber value={value} /> : value}</div>
      <div style={{ fontSize: 9, color: MOCHA, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: MOCHA, marginTop: 2, opacity: 0.7, fontWeight: 500 }}>{sub}</div>}
    </motion.div>
  )
}

function StatBar({ label, value, delay, color }) {
  return (
    <div style={{ marginBottom: 10, textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MOCHA, marginBottom: 4, fontWeight: 600 }}>
        <span>{label}</span>
        <span style={{ color: ESPRESSO, fontWeight: 800 }}><AnimatedNumber value={value} format={(n) => `${n}%`} /></span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ delay, duration: 0.9, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', borderRadius: 3, background: color }} />
      </div>
    </div>
  )
}

function AnimatedTag({ children, delay, color }) {
  return (
    <motion.span initial={{ opacity: 0, scale: 0.85, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'inline-block', padding: '6px 12px', margin: 3, borderRadius: 999, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.7)', color: ESPRESSO, fontSize: 11.5, fontWeight: 600, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
      {children}
    </motion.span>
  )
}

function MiniWeekChart({ dayActivity, color }) {
  if (!dayActivity?.length) return null
  const mx = Math.max(...dayActivity.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 30 }}>
      {dayActivity.map(d => (
        <div key={d.name} style={{ width: 7, height: `${Math.max(4, (d.count / mx) * 30)}px`, borderRadius: 2, background: color, opacity: 0.35 + (d.count / mx) * 0.65 }} />
      ))}
    </div>
  )
}

// ── CardShell: the pure visual card (no buttons) ──
function CardShell({ vibeIdx, eyebrow, tilt = 0, children, meme }) {
  const vibe = VIBES[vibeIdx % VIBES.length]
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.93, rotate: tilt - 2 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: tilt }}
      exit={{ opacity: 0, y: -16, scale: 0.94, rotate: tilt + 2 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'relative', width: 360, height: 640, borderRadius: 28, overflow: 'hidden',
        background: vibe.bg, boxShadow: `0 24px 64px -16px ${vibe.glow}, 0 1px 3px rgba(0,0,0,0.08)`,
        display: 'flex', flexDirection: 'column', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', flexShrink: 0,
      }}
    >
      <Orb color={vibe.orb} style={{ width: 220, height: 220, top: -60, right: -60, opacity: 0.6 }} />
      <Orb color={vibe.orb} style={{ width: 180, height: 180, bottom: -40, left: -40, opacity: 0.4 }} />
      <div style={{ height: 4, width: '100%', background: vibe.accent, opacity: 0.8 }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '22px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {eyebrow && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            style={{ alignSelf: 'flex-start', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: vibe.accent, background: 'rgba(255,255,255,0.5)', borderRadius: 999, padding: '5px 12px', textTransform: 'uppercase', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.6)', marginBottom: 14 }}>
            {eyebrow}
          </motion.div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, overflow: 'hidden' }}>
          {children}
        </div>
        {meme && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', borderLeft: `3px solid ${vibe.accent}`, fontSize: 11.5, color: vibe.text, lineHeight: 1.5, fontStyle: 'italic', fontWeight: 500 }}>
            {meme}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

const CardIcon = ({ children, color }) => <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 10 }}>{children}</div>
const CardHeadline = ({ color, children }) => <div style={{ fontSize: 24, fontWeight: 800, color: color || ESPRESSO, lineHeight: 1.15, letterSpacing: '-0.02em', whiteSpace: 'pre-line' }}>{children}</div>
const CardSub = ({ color, children }) => <div style={{ fontSize: 13, color: color || MOCHA, lineHeight: 1.5, whiteSpace: 'pre-line', fontWeight: 500 }}>{children}</div>

// ── WrappedCard: the finale summary card ──
function WrappedCard({ data, cardRef }) {
  const vibe = vibeForUser(data.user?.login)
  const topLang = data.languages?.[0]
  const year = new Date().getFullYear()
  const award = useMemo(() => getAward(data), [data])
  const tier = scoreTier(data.score)
  return (
    <div ref={cardRef} style={{ position: 'relative', width: 360, height: 640, borderRadius: 28, overflow: 'hidden', background: vibe.bg, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', boxShadow: `0 24px 64px -16px ${vibe.glow}, 0 1px 3px rgba(0,0,0,0.08)`, display: 'flex', flexDirection: 'column' }}>
      <Orb color={vibe.orb} style={{ width: 260, height: 260, top: -80, right: -80, opacity: 0.5 }} />
      <Orb color={vibe.orb} style={{ width: 200, height: 200, bottom: -60, left: -60, opacity: 0.35 }} />
      <div style={{ height: 4, width: '100%', background: vibe.accent, opacity: 0.8 }} />
      <div style={{ position: 'absolute', top: 18, right: -36, transform: 'rotate(38deg)', background: vibe.accent, color: '#fff', fontWeight: 800, fontSize: 10, padding: '5px 40px', letterSpacing: '0.06em', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>{tier || `${BRAND.appName} PICK`}</div>
      <div style={{ position: 'relative', zIndex: 1, padding: '24px 22px 22px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: MOCHA, textTransform: 'uppercase' }}>{BRAND.appName?.toUpperCase()} WRAPPED · {year}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          {data.user?.avatar_url && <img src={data.user.avatar_url} crossOrigin="anonymous" style={{ width: 40, height: 40, borderRadius: '50%', border: `2.5px solid ${vibe.accent}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />}
          <div style={{ color: ESPRESSO, fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em' }}>@{data.user?.login}</div>
        </div>
        <GlassSurface style={{ marginTop: 16, transform: 'rotate(-0.5deg)', padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.7)' }}>
              <AwardIcon name={award.icon} color={vibe.accent} size={18} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: ESPRESSO, lineHeight: 1.12, letterSpacing: '-0.02em' }}>{award.title}</div>
          </div>
          <div style={{ fontSize: 13, color: MOCHA, lineHeight: 1.5, fontWeight: 500 }}>{award.roast}</div>
        </GlassSurface>
        <div style={{ marginTop: 14, position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <GlassSurface style={{ flex: 1.15, transform: 'rotate(0.5deg)', padding: '14px 12px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: vibe.accent, letterSpacing: '-0.02em' }}>{(data.totalCommits || data.commitsThisYear || 0).toLocaleString()}</div>
              <div style={{ fontSize: 10, color: MOCHA, marginTop: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>commits tracked</div>
            </GlassSurface>
            <GlassSurface style={{ flex: 1, transform: 'rotate(-0.5deg)', padding: '14px 12px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: ESPRESSO }}>{data.longestStreak || 0}d</div>
              <div style={{ fontSize: 10, color: MOCHA, marginTop: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>best streak</div>
            </GlassSurface>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GlassSurface style={{ flex: 1, padding: '12px 12px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: ESPRESSO }}>{(data.totalStars || 0).toLocaleString()}</div>
              <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>stars earned</div>
            </GlassSurface>
            <GlassSurface style={{ flex: 1, padding: '12px 12px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: ESPRESSO }}>{(data.user?.followers || 0).toLocaleString()}</div>
              <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>followers</div>
            </GlassSurface>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            {data.eventStats?.dayActivity && (
              <GlassSurface style={{ flex: 1, padding: '12px 12px' }}>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>weekly rhythm</div>
                <MiniWeekChart dayActivity={data.eventStats.dayActivity} color={vibe.accent} />
              </GlassSurface>
            )}
            {topLang && (
              <GlassSurface style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: topLang.color || vibe.accent, display: 'inline-block', boxShadow: `0 0 0 2px ${(topLang.color || vibe.accent)}30` }} />
                  <span style={{ fontSize: 13, color: ESPRESSO, fontWeight: 700 }}>{topLang.name}</span>
                </div>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{topLang.pct}% of your code</div>
              </GlassSurface>
            )}
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, letterSpacing: '0.04em' }}>{(BRAND.websiteUrl || '').replace(/^https?:\/\//, '')}</div>
          <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, letterSpacing: '0.04em' }}>#{BRAND.appName}Wrapped</div>
        </div>
      </div>
    </div>
  )
}

// ── EndSlide with buttons OUTSIDE the card ──
function EndSlide({ data, cardRef, done, onDownload, onCopyLink, onFinish, onTweet, onNativeShare }) {
  useEffect(() => { const t = setTimeout(() => { }, 1400); return () => clearTimeout(t) }, [])
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <motion.div initial={{ opacity: 0, scale: 0.9, rotate: -1 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} whileHover={{ scale: 1.01 }}>
        <WrappedCard data={data} cardRef={cardRef} />
      </motion.div>
      <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <MagneticButton onClick={onDownload} style={{ height: 40, padding: '0 18px', borderRadius: 10, background: ESPRESSO, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 4px 12px rgba(61,43,31,0.15)' }}>
          {done === 'png' ? <><CheckIcon size={13} color="#fff" /> Saved</> : <><DownloadIcon size={13} /> Save Image</>}
        </MagneticButton>
        <MagneticButton onClick={onCopyLink} style={{ height: 40, padding: '0 18px', borderRadius: 10, background: 'transparent', color: ESPRESSO, border: `1px solid rgba(61,43,31,0.12)`, fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          {done === 'link' ? <><CheckIcon size={13} color={ESPRESSO} /> Link copied</> : <><CopyIcon size={13} /> Copy Link</>}
        </MagneticButton>
        {onTweet && <MagneticButton onClick={onTweet} style={{ height: 40, padding: '0 16px', borderRadius: 10, background: 'transparent', color: ESPRESSO, border: `1px solid rgba(61,43,31,0.12)`, fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><TwitterIcon size={13} /> X / Twitter</MagneticButton>}
        {onNativeShare && <MagneticButton onClick={onNativeShare} style={{ height: 40, padding: '0 16px', borderRadius: 10, background: vibeForUser(data.user?.login).accent, color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}><ShareIcon size={13} /> Share</MagneticButton>}
        <MagneticButton onClick={onFinish} style={{ height: 40, padding: '0 20px', borderRadius: 10, background: vibeForUser(data.user?.login).accent, color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, fontFamily: 'Inter,sans-serif', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>Done →</MagneticButton>
      </div>
      <div style={{ fontSize: 11, color: MOCHA, marginTop: 14, maxWidth: 320, textAlign: 'center', fontWeight: 500 }}>Sharing the link opens this same story for anyone who opens it.</div>
    </motion.div>
  )
}

export function Wrapped({ data, onClose }) {
  const identity = useMemo(() => calcIdentity(data), [data])
  const story = useMemo(() => buildStory(data), [data])
  const finaleRef = useRef(null)
  const cardRefs = useRef({})
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState(null)
  const [copied, setCopied] = useState({})

  const memes = useMemo(() => getMemesForUser(data.user?.login, 30), [data.user?.login])
  let mi = 0
  const nextMeme = () => memes[mi++]

  const flash = (k) => { setDone(k); setTimeout(() => setDone(null), 2200) }
  const flashCard = (ck, t) => { setCopied(p => ({ ...p, [ck]: t })); setTimeout(() => setCopied(p => { const n = { ...p }; delete n[ck]; return n }), 2200) }

  const copyCardImage = useCallback(async (k) => {
    const el = cardRefs.current[k]
    if (!el) return
    const du = await captureCard(el)
    if (!du) return
    const a = document.createElement('a')
    a.download = `gitstatus-${data.user.login}-${k}.png`
    a.href = du; a.click()
    flashCard(k, 'img')
  }, [data.user?.login])

  const shareCardLink = useCallback(async (k) => {
    const url = `${BRAND.websiteUrl}/?user=${data.user.login}&wrapped=${k}`
    await navigator.clipboard.writeText(url).catch(() => { })
    flashCard(k, 'link')
  }, [data.user?.login])

  const tweetCard = useCallback((k) => {
    const url = `${BRAND.websiteUrl}/?user=${data.user.login}&wrapped=${k}`
    window.open(tweetUrl(`My GitStatus Wrapped ${k} card is wild 🔥`, url), '_blank', 'width=600,height=400')
  }, [data.user?.login])

  const nativeShareCard = useCallback(async (k) => {
    const url = `${BRAND.websiteUrl}/?user=${data.user.login}&wrapped=${k}`
    const shared = await nativeShare({ title: 'GitStatus Wrapped', text: `Check out my ${k} card!`, url })
    if (!shared) await shareCardLink(k)
  }, [data.user?.login, shareCardLink])

  const downloadFinale = async () => {
    const du = await captureCard(finaleRef.current)
    if (!du) return
    const a = document.createElement('a')
    a.download = `gitstatus-${data.user.login}-wrapped.png`
    a.href = du; a.click()
    flash('png')
  }

  const copyFinaleLink = async () => {
    const url = `${BRAND.websiteUrl}/?user=${data.user.login}`
    await navigator.clipboard.writeText(url).catch(() => { })
    flash('link')
  }

  const tweetFinale = useCallback(() => {
    const url = `${BRAND.websiteUrl}/?user=${data.user.login}`
    window.open(tweetUrl(`Just generated my GitStatus Wrapped ${new Date().getFullYear()} 🏆`, url), '_blank', 'width=600,height=400')
  }, [data.user?.login])

  const nativeShareFinale = useCallback(async () => {
    const url = `${BRAND.websiteUrl}/?user=${data.user.login}`
    const shared = await nativeShare({ title: 'My GitStatus Wrapped', text: `Check out my ${new Date().getFullYear()} GitHub Wrapped!`, url })
    if (!shared) await copyFinaleLink()
  }, [data.user?.login])

  const chapters = useMemo(() => {
    let v = 0
    const tilts = [-1.5, 1, -0.5, 1.5, -1, 0.5]
    const nt = () => tilts[v % tilts.length]

    const mc = (k, p) => {
      const vibe = VIBES[v % VIBES.length]
      return {
        key: k,
        render: () => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div ref={el => { cardRefs.current[k] = el }}>
              <CardShell vibeIdx={v} tilt={nt()} meme={nextMeme()} {...p} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => copyCardImage(k)} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid rgba(61,43,31,0.1)`, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: ESPRESSO, fontSize: 11, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                {copied[k] === 'img' ? <><CheckIcon size={12} color={vibe.accent} /> Saved</> : <><DownloadIcon size={12} /> Image</>}
              </button>
              <button onClick={() => shareCardLink(k)} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: vibe.accent, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, boxShadow: `0 4px 10px ${vibe.glow}` }}>
                {copied[k] === 'link' ? <><CheckIcon size={12} color='#fff' /> Copied</> : <><ShareIcon size={12} /> Link</>}
              </button>
              <button onClick={() => tweetCard(k)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid rgba(61,43,31,0.1)`, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: ESPRESSO, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }} title="Share on X"><TwitterIcon size={13} /></button>
              <button onClick={() => nativeShareCard(k)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid rgba(61,43,31,0.1)`, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: ESPRESSO, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }} title="Native Share"><ShareIcon size={13} /></button>
            </div>
          </div>
        )
      }
    }

    const list = []

    // 1. IDENTITY
    list.push(mc('identity', {
      children: (
        <>
          <div>
            <CardIcon color={VIBES[v % VIBES.length].accent}>{I.user}</CardIcon>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Badge color={VIBES[v % VIBES.length].accent}>{data.score >= 75 ? 'Legendary' : data.score >= 55 ? 'Epic' : data.score >= 30 ? 'Rare' : 'Common'}</Badge>
            </div>
            <CardHeadline>You are{''}{identity.title}.</CardHeadline>
            <CardSub style={{ marginTop: 6 }}>{identity.why}</CardSub>
          </div>
          <MiniBars color={VIBES[v % VIBES.length].accent} items={[
            { label: 'Score', value: data.score || 0, max: 100 },
            { label: 'Tenure', value: data.user?.created_at ? Math.floor((Date.now() - new Date(data.user.created_at)) / 31536000000) : 0, max: 10 },
            { label: 'Repos', value: data.totalRepos || data.user?.public_repos || 0, max: Math.max(data.totalRepos || 0, 50) },
          ]} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatPill label="Global Rank" value={data.score || 0} sub={`Top ${scoreTier(data.score) || '?'}`} color={VIBES[v % VIBES.length].accent} />
            <StatPill label="Tenure" value={`${data.user?.created_at ? Math.floor((Date.now() - new Date(data.user.created_at)) / 31536000000) : 0}yr`} sub="on GitHub" />
            <StatPill label="Repos" value={data.totalRepos || data.user?.public_repos || 0} sub="total" />
          </div>
        </>
      )
    }))
    v++

    // 2. HOW YOU BUILD
    list.push(mc('howYouBuild', {
      children: (
        <>
          <div>
            <CardIcon color={VIBES[v % VIBES.length].accent}>{I.wrench}</CardIcon>
            <CardHeadline>{story.devTypeLine}</CardHeadline>
            <CardSub style={{ marginTop: 6 }}>{story.consistency}</CardSub>
          </div>
          {data.commitSizeDistribution && (
            <GlassSurface delay={0.15}>
              <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Commit Size Distribution</div>
              <MiniBars color={VIBES[v % VIBES.length].accent} items={[
                { label: 'Small', value: data.commitSizeDistribution.small || 0, max: 1 },
                { label: 'Med', value: data.commitSizeDistribution.medium || 0, max: 1 },
                { label: 'Large', value: data.commitSizeDistribution.large || 0, max: 1 },
              ]} />
            </GlassSurface>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatPill label="Style" value={data.eventStats?.developerStyle || 'Solo'} sub="archetype" color={VIBES[v % VIBES.length].accent} />
            <StatPill label="Avg Commit" value={data.avgCommitSize || 0} sub="lines" />
            <StatPill label="Churn" value={`${data.codeChurnRatio || 0}%`} sub="add/del" />
          </div>
        </>
      )
    }))
    v++

    // 3. WHAT YOU BUILD
    list.push(mc('whatYouBuild', {
      children: (
        <>
          <div>
            <CardIcon color={VIBES[v % VIBES.length].accent}>{I.package}</CardIcon>
            <CardHeadline>{story.repos}</CardHeadline>
            <CardSub style={{ marginTop: 6 }}>{story.reach}</CardSub>
          </div>
          {data.topRepoGrowth && (
            <GlassSurface delay={0.15}>
              <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fastest Growing Repo</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: ESPRESSO, letterSpacing: '-0.01em' }}>{data.topRepoGrowth.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <SparkLine data={data.topRepoGrowth.history} color={VIBES[v % VIBES.length].accent} width={100} height={20} />
                <Badge color={VIBES[v % VIBES.length].accent}>+{data.topRepoGrowth.growth}%</Badge>
              </div>
            </GlassSurface>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatPill label="Public" value={data.publicRepos || data.user?.public_repos || 0} sub="repos" color={VIBES[v % VIBES.length].accent} />
            <StatPill label="Private" value={data.privateRepos || 0} sub="repos" />
            <StatPill label="Star Velocity" value={`${data.starVelocity || 0}/mo`} sub="avg" />
          </div>
        </>
      )
    }))
    v++

    // 4. STREAK
    if (data.streak > 0 || data.longestStreak > 0) {
      const cv = v
      list.push(mc('streak', {
        children: (
          <>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <CardIcon color={VIBES[cv % VIBES.length].accent}>{I.flame}</CardIcon>
                <MiniGauge value={data.streakConsistency || 70} color={VIBES[cv % VIBES.length].accent} size={40} label="Consistency" />
              </div>
              <CardHeadline><AnimatedNumber value={data.longestStreak} /> day{data.longestStreak === 1 ? '' : 's'}</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>Your longest run of back-to-back active days{data.streak > 0 ? `
Currently on a ${data.streak}-day streak` : ''}</CardSub>
            </div>
            {data.streakHeatmap && (
              <div>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last 30 Days</div>
                <HeatStrip data={data.streakHeatmap} color={VIBES[cv % VIBES.length].accent} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Best" value={data.longestStreak || 0} sub="days" color={VIBES[cv % VIBES.length].accent} />
              <StatPill label="Current" value={data.streak || 0} sub="days" />
              <StatPill label="Total Active" value={data.totalActiveDays || 0} sub="days" />
            </div>
          </>
        )
      }))
      v++
    }

    // 5. PEAK YEAR
    if (story.peakYear) {
      const cv = v
      list.push(mc('peakYear', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[cv % VIBES.length].accent}>{I.rocket}</CardIcon>
              <CardHeadline>{story.peakYear}</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{data.peakYearCommits ? `${data.peakYearCommits.toLocaleString()} commits that year` : 'Your most productive period ever'}</CardSub>
            </div>
            {data.yearlyHistory && (
              <GlassSurface delay={0.15}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 50, padding: '4px' }}>
                  {data.yearlyHistory.map((y, i) => (
                    <div key={y.year} style={{ flex: 1, textAlign: 'center' }}>
                      <motion.div initial={{ height: 0 }} animate={{ height: `${(y.commits / Math.max(...data.yearlyHistory.map(h => h.commits), 1)) * 40}px` }}
                        transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ width: '100%', borderRadius: 3, background: VIBES[cv % VIBES.length].accent, opacity: 0.8, minHeight: 2 }} />
                      <div style={{ fontSize: 8, color: MOCHA, marginTop: 3, fontWeight: 700 }}>{y.year}</div>
                    </div>
                  ))}
                </div>
              </GlassSurface>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="YoY Growth" value={`${data.yoyGrowth || 0}%`} sub="vs prior" color={VIBES[cv % VIBES.length].accent} />
              <StatPill label="Peak Month" value={data.peakMonth || 'N/A'} sub="most commits" />
              <StatPill label="Acceleration" value={data.commitAcceleration || 0} sub="commits/mo²" />
            </div>
          </>
        )
      }))
      v++
    }

    // 6. FOCUS AREA
    if (story.focusArea) {
      list.push(mc('focusArea', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.target}</CardIcon>
              <CardHeadline>{story.focusArea}</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{data.focusAreaPct ? `${data.focusAreaPct}% of your commits this year` : 'Your primary domain of expertise'}</CardSub>
            </div>
            {data.focusAreas && (
              <GlassSurface delay={0.15}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.focusAreas.slice(0, 4).map((area, i) => (
                    <div key={area.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: ESPRESSO, minWidth: 80, letterSpacing: '-0.01em' }}>{area.name}</div>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${area.pct}%` }} transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', borderRadius: 3, background: VIBES[v % VIBES.length].accent, opacity: 0.8 }} />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: MOCHA, minWidth: 32, textAlign: 'right' }}>{area.pct}%</div>
                    </div>
                  ))}
                </div>
              </GlassSurface>
            )}
          </>
        )
      }))
      v++
    }

    // 7. LANGUAGES
    list.push(mc('languages', {
      children: (
        <>
          <div>
            <CardIcon color={VIBES[v % VIBES.length].accent}>{I.code}</CardIcon>
            <CardHeadline>{story.languages}</CardHeadline>
            <CardSub style={{ marginTop: 6 }}>{data.languages?.length ? `${data.languages.length} languages in your stack` : 'Your coding vocabulary'}</CardSub>
          </div>
          {data.languages?.length > 0 && (
            <GlassSurface delay={0.15}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.languages.slice(0, 5).map((lang, i) => (
                  <div key={lang.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: lang.color || VIBES[v % VIBES.length].accent, display: 'inline-block', boxShadow: `0 0 0 2px ${(lang.color || VIBES[v % VIBES.length].accent)}25` }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: ESPRESSO, minWidth: 60, letterSpacing: '-0.01em' }}>{lang.name}</span>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${lang.pct}%` }} transition={{ delay: 0.15 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', borderRadius: 3, background: lang.color || VIBES[v % VIBES.length].accent, opacity: 0.8 }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: MOCHA, minWidth: 32, textAlign: 'right' }}>{lang.pct}%</span>
                  </div>
                ))}
              </div>
            </GlassSurface>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatPill label="Polyglot" value={data.languages?.length || 0} sub="languages" color={VIBES[v % VIBES.length].accent} />
            <StatPill label="Dominant" value={data.languages?.[0]?.name || 'N/A'} sub={data.languages?.[0] ? `${data.languages[0].pct}%` : ''} />
            <StatPill label="New" value={data.newLanguagesThisYear || 0} sub="this year" />
          </div>
        </>
      )
    }))
    v++

    // 8. BALANCE (radar)
    if (data.radarData?.length) {
      const cv = v
      list.push(mc('balance', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[cv % VIBES.length].accent}>{I.scale}</CardIcon>
              <CardHeadline>What you lean on</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{data.specialistScore != null ? `Specialist score: ${data.specialistScore}/100` : 'Your engineering archetype breakdown'}</CardSub>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {data.radarData.map((r, i) => (
                <MiniGauge key={r.subject} value={r.A} max={100} color={VIBES[(cv + i) % VIBES.length].accent} size={36} label={r.subject} />
              ))}
            </div>
            <GlassSurface delay={0.15}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.radarData.map((r, i) => (
                  <StatBar key={r.subject} label={r.subject} value={r.A} delay={0.15 + i * 0.08} color={VIBES[(cv + i) % VIBES.length].accent} />
                ))}
              </div>
            </GlassSurface>
          </>
        )
      }))
      v++
    }

    // 9. PULL REQUESTS
    if (data.totalPRs != null || data.mergedPRs != null) {
      const cv = v
      list.push(mc('prs', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[cv % VIBES.length].accent}>{I.gitMerge}</CardIcon>
              <CardHeadline>{(data.mergedPRs || 0).toLocaleString()} merged</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>out of {(data.totalPRs || 0).toLocaleString()} total PRs{data.prMergeRate ? `
${data.prMergeRate}% merge rate` : ''}</CardSub>
            </div>
            {data.prMergeRate != null && (
              <GlassSurface delay={0.15}>
                <StatBar label="Merged" value={data.prMergeRate} delay={0.2} color={VIBES[cv % VIBES.length].accent} />
                <StatBar label="Closed / Open" value={100 - data.prMergeRate} delay={0.3} color={VIBES[(cv + 1) % VIBES.length].accent} />
              </GlassSurface>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Merged" value={data.mergedPRs || 0} sub="total" color={VIBES[cv % VIBES.length].accent} />
              <StatPill label="Open" value={data.openPRs || 0} sub="active" />
              <StatPill label="Closed" value={data.closedPRs || 0} sub="rejected" />
              <StatPill label="Draft" value={data.draftPRs || 0} sub="WIP" />
            </div>
            {data.avgMergeTime != null && (
              <GlassSurface delay={0.25}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Merge Time</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: ESPRESSO, marginTop: 2, letterSpacing: '-0.02em' }}>{data.avgMergeTime}h</div>
                  </div>
                  <div style={{ fontSize: 10, color: MOCHA, fontWeight: 500 }}>from open to merged</div>
                </div>
              </GlassSurface>
            )}
          </>
        )
      }))
      v++
    }

    // 10. ISSUES
    if (data.totalIssues != null || data.closedIssues != null) {
      const cv = v
      list.push(mc('issues', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[cv % VIBES.length].accent}>{I.bug}</CardIcon>
              <CardHeadline>{(data.closedIssues || 0).toLocaleString()} closed</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{(data.totalIssues || 0).toLocaleString()} total issues{data.issueCloseRate ? `
${data.issueCloseRate}% close rate` : ''}</CardSub>
            </div>
            {data.issueCloseRate != null && (
              <GlassSurface delay={0.15}>
                <StatBar label="Closed" value={data.issueCloseRate} delay={0.2} color={VIBES[cv % VIBES.length].accent} />
                <StatBar label="Open" value={100 - data.issueCloseRate} delay={0.3} color={VIBES[(cv + 1) % VIBES.length].accent} />
              </GlassSurface>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Bugs" value={data.bugIssues || 0} sub="reported" color={VIBES[cv % VIBES.length].accent} />
              <StatPill label="Features" value={data.featureIssues || 0} sub="requested" />
              <StatPill label="Avg Close" value={`${data.avgIssueCloseTime || 0}h`} sub="resolution" />
            </div>
            {data.issueResolutionTrend && (
              <div>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resolution Trend</div>
                <SparkLine data={data.issueResolutionTrend} color={VIBES[cv % VIBES.length].accent} width={140} height={24} />
              </div>
            )}
          </>
        )
      }))
      v++
    }

    // 11. CODE REVIEWS
    if (data.reviewsGiven != null || data.reviewComments != null) {
      const cv = v
      list.push(mc('reviews', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[cv % VIBES.length].accent}>{I.eye}</CardIcon>
              <CardHeadline>{(data.reviewsGiven || 0).toLocaleString()} reviews</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{(data.reviewComments || 0).toLocaleString()} review comments
                {(data.avgReviewTime || 0).toLocaleString()}h avg review time</CardSub>
            </div>
            {data.reviewApprovalRate != null && (
              <GlassSurface delay={0.15}>
                <StatBar label="Approved" value={data.reviewApprovalRate} delay={0.2} color={VIBES[cv % VIBES.length].accent} />
                <StatBar label="Changes Requested" value={100 - data.reviewApprovalRate} delay={0.3} color={VIBES[(cv + 1) % VIBES.length].accent} />
              </GlassSurface>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Reviews" value={data.reviewsGiven || 0} sub="given" color={VIBES[cv % VIBES.length].accent} />
              <StatPill label="Comments" value={data.reviewComments || 0} sub="total" />
              <StatPill label="Thorough" value={`${data.commentsPerReview || 0}`} sub="per review" />
            </div>
            {data.reviewVelocityTrend && (
              <div>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Review Velocity</div>
                <SparkLine data={data.reviewVelocityTrend} color={VIBES[cv % VIBES.length].accent} width={140} height={24} />
              </div>
            )}
          </>
        )
      }))
      v++
    }

    // 12. VELOCITY
    if (data.commitsPerDay != null || data.commitsPerWeek != null) {
      list.push(mc('velocity', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.zap}</CardIcon>
              <CardHeadline>{(data.commitsPerWeek || 0).toLocaleString()} / week</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{(data.commitsPerDay || 0).toLocaleString()} commits per day on average
                {(data.linesAdded || 0).toLocaleString()} lines added, {(data.linesDeleted || 0).toLocaleString()} deleted</CardSub>
            </div>
            {data.commitVelocityTrend && (
              <div>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Commit Velocity Trend</div>
                <SparkLine data={data.commitVelocityTrend} color={VIBES[v % VIBES.length].accent} width={140} height={24} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Daily" value={data.commitsPerDay || 0} sub="avg" color={VIBES[v % VIBES.length].accent} />
              <StatPill label="Weekly" value={data.commitsPerWeek || 0} sub="avg" />
              <StatPill label="Bursts" value={data.burstSessions || 0} sub="3+ commits/hr" />
              <StatPill label="Impact" value={`${data.impactScore || 0}`} sub="lines/commit" />
            </div>
          </>
        )
      }))
      v++
    }

    // 13. REPOSITORIES
    if (data.totalRepos != null || data.publicRepos != null) {
      const cv = v
      list.push(mc('repos', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[cv % VIBES.length].accent}>{I.folder}</CardIcon>
              <CardHeadline>{(data.publicRepos || 0).toLocaleString()} public</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{(data.totalRepos || 0).toLocaleString()} total repos
                {(data.forkedRepos || 0).toLocaleString()} forks, {(data.originalRepos || 0).toLocaleString()} original</CardSub>
            </div>
            {data.repoPrivacyRatio != null && (
              <GlassSurface delay={0.15}>
                <StatBar label="Public" value={data.repoPrivacyRatio} delay={0.2} color={VIBES[cv % VIBES.length].accent} />
                <StatBar label="Private" value={100 - data.repoPrivacyRatio} delay={0.3} color={VIBES[(cv + 1) % VIBES.length].accent} />
              </GlassSurface>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Public" value={data.publicRepos || 0} sub="repos" color={VIBES[cv % VIBES.length].accent} />
              <StatPill label="Private" value={data.privateRepos || 0} sub="repos" />
              <StatPill label="Forks" value={data.forkedRepos || 0} sub="cloned" />
              <StatPill label="Original" value={data.originalRepos || 0} sub="built" />
            </div>
            {data.repoGrowthTrend && (
              <div>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Repo Growth</div>
                <SparkLine data={data.repoGrowthTrend} color={VIBES[cv % VIBES.length].accent} width={140} height={24} />
              </div>
            )}
          </>
        )
      }))
      v++
    }

    // 14. SQUAD
    if (data.collaborators != null || data.contributors != null) {
      list.push(mc('collab', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.users}</CardIcon>
              <CardHeadline>{(data.collaborators || 0).toLocaleString()} collaborators</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{(data.contributors || 0).toLocaleString()} unique contributors across your repos
                {(data.organizations || 0).toLocaleString()} orgs</CardSub>
            </div>
            {data.topCollaborators && (
              <GlassSurface delay={0.15}>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Top Collaborators</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.topCollaborators.slice(0, 3).map((c) => (
                    <div key={c.login} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.5)' }}>
                      {c.avatar && <img src={c.avatar} crossOrigin="anonymous" style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.06)' }} />}
                      <span style={{ fontSize: 12, fontWeight: 800, color: ESPRESSO, letterSpacing: '-0.01em' }}>@{c.login}</span>
                      <span style={{ fontSize: 10, color: MOCHA, marginLeft: 'auto', fontWeight: 700 }}>{c.commits} commits</span>
                    </div>
                  ))}
                </div>
              </GlassSurface>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Collabs" value={data.collaborators || 0} sub="people" color={VIBES[v % VIBES.length].accent} />
              <StatPill label="Contributors" value={data.contributors || 0} sub="unique" />
              <StatPill label="Orgs" value={data.organizations || 0} sub="member" />
              <StatPill label="Solo Ratio" value={`${data.soloRatio || 0}%`} sub="solo work" />
            </div>
          </>
        )
      }))
      v++
    }

    // 15. PRIME TIME
    if (data.mostActiveHour || data.mostActiveDay) {
      list.push(mc('time', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.clock}</CardIcon>
              <CardHeadline>{data.mostActiveHour || 'All Hours'}</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{data.mostActiveDay ? `${data.mostActiveDay} is your power day` : 'Every day is a power day'}
                {(data.nightCommits || 0).toLocaleString()} late-night commits</CardSub>
            </div>
            {data.hourlyDistribution && (
              <div>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>24h Activity</div>
                <HeatStrip data={data.hourlyDistribution} color={VIBES[v % VIBES.length].accent} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Power Hour" value={data.mostActiveHour || 'N/A'} sub="peak" color={VIBES[v % VIBES.length].accent} />
              <StatPill label="Power Day" value={data.mostActiveDay || 'N/A'} sub="peak" />
              <StatPill label="Night Owl" value={data.nightCommits || 0} sub="after 10pm" />
              <StatPill label="Early Bird" value={data.morningCommits || 0} sub="before 8am" />
            </div>
          </>
        )
      }))
      v++
    }

    // 16. RHYTHM
    if (data.eventStats?.mostActiveDay || data.eventStats?.weekendPct != null) {
      const cv = v
      list.push(mc('rhythm', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[cv % VIBES.length].accent}>{I.calendar}</CardIcon>
              <CardHeadline>
                {data.eventStats.mostActiveDay ? `${data.eventStats.mostActiveDay}s` : 'Every day'}
                {data.eventStats.mostActiveHour ? `, ${data.eventStats.mostActiveHour.toLowerCase()}` : ''}
              </CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{data.eventStats.weekendPct != null ? `${100 - data.eventStats.weekendPct}% weekday · ${data.eventStats.weekendPct}% weekend` : 'is when you tend to ship'}</CardSub>
            </div>
            {data.eventStats.weekendPct != null && (
              <GlassSurface delay={0.15}>
                <StatBar label="Weekday" value={100 - data.eventStats.weekendPct} delay={0.2} color={VIBES[(cv + 1) % VIBES.length].accent} />
                <StatBar label="Weekend" value={data.eventStats.weekendPct} delay={0.3} color={VIBES[(cv + 2) % VIBES.length].accent} />
              </GlassSurface>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Weekday" value={`${100 - (data.eventStats.weekendPct || 0)}%`} sub="productivity" color={VIBES[cv % VIBES.length].accent} />
              <StatPill label="Weekend" value={`${data.eventStats.weekendPct || 0}%`} sub="hustle" />
              <StatPill label="Consistency" value={`${data.rhythmScore || 0}%`} sub="regularity" />
            </div>
            {data.eventStats?.dayActivity && (
              <div>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weekly Pattern</div>
                <MiniWeekChart dayActivity={data.eventStats.dayActivity} color={VIBES[cv % VIBES.length].accent} />
              </div>
            )}
          </>
        )
      }))
      v++
    }

    // 17. COMMUNITY
    list.push(mc('community', {
      children: (
        <>
          <div>
            <CardIcon color={VIBES[v % VIBES.length].accent}>{I.users}</CardIcon>
            <CardHeadline>{story.community}</CardHeadline>
            <CardSub style={{ marginTop: 6 }}>{story.tenure}</CardSub>
          </div>
          {data.followerTrend ? (
            <div>
              <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Follower Growth</div>
              <SparkLine data={data.followerTrend} color={VIBES[v % VIBES.length].accent} width={140} height={24} />
            </div>
          ) : (
            <MiniBars color={VIBES[v % VIBES.length].accent} items={[
              { label: 'Followers', value: data.user?.followers || 0, max: Math.max(data.user?.followers || 0, 10) },
              { label: 'Following', value: data.user?.following || 0, max: Math.max(data.user?.following || 0, 10) },
              { label: 'Stars', value: data.totalStars || 0, max: Math.max(data.totalStars || 0, 10) },
            ]} />
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatPill label="Followers" value={data.user?.followers || 0} sub="total" color={VIBES[v % VIBES.length].accent} />
            <StatPill label="Following" value={data.user?.following || 0} sub="people" />
            <StatPill label="Growth" value={`${data.followerGrowth || 0}%`} sub="this year" />
            <StatPill label="Stars" value={data.totalStars || 0} sub="earned" />
          </div>
        </>
      )
    }))
    v++

    // 18. BY THE NUMBERS
    list.push(mc('numbers', {
      children: (
        <>
          <div>
            <CardIcon color={VIBES[v % VIBES.length].accent}>{I.barChart}</CardIcon>
            <CardHeadline>The raw data</CardHeadline>
          </div>
          <GlassSurface delay={0.1}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'Stars', value: data.totalStars },
                { label: 'Forks', value: data.totalForks },
                { label: 'Followers', value: data.user?.followers || 0 },
                { label: 'Following', value: data.user?.following || 0 },
                { label: 'PRs', value: data.totalPRs },
                { label: 'Issues', value: data.totalIssues },
                { label: 'Reviews', value: data.reviewsGiven },
                { label: 'Commits', value: data.totalCommits },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} style={{ textAlign: 'center', minWidth: 56 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: ESPRESSO, letterSpacing: '-0.02em' }}><AnimatedNumber value={s.value} /></div>
                  <div style={{ fontSize: 9, color: MOCHA, marginTop: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          </GlassSurface>
          {data.impactPerCommit != null && (
            <GlassSurface delay={0.3}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Impact Per Commit</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: ESPRESSO, marginTop: 2, letterSpacing: '-0.02em' }}>{data.impactPerCommit}</div>
                </div>
                <MiniGauge value={data.impactScore || 50} color={VIBES[v % VIBES.length].accent} size={36} label="Impact" />
              </div>
            </GlassSurface>
          )}
        </>
      )
    }))
    v++

    // 19. SPOTLIGHT
    if (story.spotlight) {
      list.push(mc('spotlight', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.star}</CardIcon>
              <CardHeadline>{story.spotlight}</CardHeadline>
            </div>
            {data.spotlightRepo && (
              <>
                <CardSub>{data.spotlightRepo.description || 'Your most starred creation'}</CardSub>
                <MiniBars color={VIBES[v % VIBES.length].accent} items={[
                  { label: 'Stars', value: data.spotlightRepo.stars || 0, max: Math.max(data.spotlightRepo.stars || 0, 10) },
                  { label: 'Forks', value: data.spotlightRepo.forks || 0, max: Math.max(data.spotlightRepo.forks || 0, 10) },
                  { label: 'Age', value: data.spotlightRepo.age || 0, max: Math.max(data.spotlightRepo.age || 0, 12) },
                ]} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <StatPill label="Stars" value={data.spotlightRepo.stars || 0} sub="earned" color={VIBES[v % VIBES.length].accent} />
                  <StatPill label="Forks" value={data.spotlightRepo.forks || 0} sub="clones" />
                  <StatPill label="Language" value={data.spotlightRepo.language || 'N/A'} sub="primary" />
                  <StatPill label="Age" value={`${data.spotlightRepo.age || 0}mo`} sub="old" />
                </div>
              </>
            )}
          </>
        )
      }))
      v++
    }

    // 20. BIGGEST CODEBASE
    if (story.biggestCodebase) {
      list.push(mc('biggest', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.layers}</CardIcon>
              <CardHeadline>{story.biggestCodebase}</CardHeadline>
            </div>
            {data.biggestRepo && (
              <>
                <CardSub>{(data.biggestRepo.lines || 0).toLocaleString()} lines of code
                  {(data.biggestRepo.commits || 0).toLocaleString()} commits</CardSub>
                <MiniBars color={VIBES[v % VIBES.length].accent} items={[
                  { label: 'Lines', value: data.biggestRepo.lines || 0, max: Math.max(data.biggestRepo.lines || 0, 1000) },
                  { label: 'Commits', value: data.biggestRepo.commits || 0, max: Math.max(data.biggestRepo.commits || 0, 100) },
                  { label: 'Files', value: data.biggestRepo.files || 0, max: Math.max(data.biggestRepo.files || 0, 50) },
                ]} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <StatPill label="Lines" value={data.biggestRepo.lines || 0} sub="total" color={VIBES[v % VIBES.length].accent} />
                  <StatPill label="Commits" value={data.biggestRepo.commits || 0} sub="history" />
                  <StatPill label="Files" value={data.biggestRepo.files || 0} sub="tracked" />
                  <StatPill label="Contribs" value={data.biggestRepo.contributors || 0} sub="people" />
                </div>
              </>
            )}
          </>
        )
      }))
      v++
    }

    // 21. MOST UNDERRATED
    if (story.mostUnderrated) {
      list.push(mc('underrated', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.gem}</CardIcon>
              <CardHeadline>{story.mostUnderrated}</CardHeadline>
            </div>
            {data.underratedRepo && (
              <>
                <CardSub>High quality, low visibility. Hidden gem.</CardSub>
                <MiniBars color={VIBES[v % VIBES.length].accent} items={[
                  { label: 'Stars', value: data.underratedRepo.stars || 0, max: Math.max(data.underratedRepo.stars || 0, 10) },
                  { label: 'Quality', value: data.underratedRepo.qualityScore || 0, max: 100 },
                  { label: 'Potential', value: data.underratedRepo.potential || 0, max: 100 },
                ]} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <StatPill label="Stars" value={data.underratedRepo.stars || 0} sub="deserves more" color={VIBES[v % VIBES.length].accent} />
                  <StatPill label="Quality" value={`${data.underratedRepo.qualityScore || 0}%`} sub="score" />
                  <StatPill label="Potential" value={`${data.underratedRepo.potential || 0}%`} sub="viral" />
                </div>
              </>
            )}
          </>
        )
      }))
      v++
    }

    // 22. LONGEST MAINTAINED
    if (story.longestMaintained) {
      list.push(mc('longest', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.tree}</CardIcon>
              <CardHeadline>{story.longestMaintained}</CardHeadline>
            </div>
            {data.longestRepo && (
              <>
                <CardSub>Active for {data.longestRepo.months || 0} months. True dedication.</CardSub>
                <MiniBars color={VIBES[v % VIBES.length].accent} items={[
                  { label: 'Age', value: data.longestRepo.months || 0, max: Math.max(data.longestRepo.months || 0, 12) },
                  { label: 'Commits', value: data.longestRepo.commits || 0, max: Math.max(data.longestRepo.commits || 0, 100) },
                  { label: 'Consistency', value: data.longestRepo.consistency || 0, max: 100 },
                ]} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <StatPill label="Age" value={`${data.longestRepo.months || 0}mo`} sub="active" color={VIBES[v % VIBES.length].accent} />
                  <StatPill label="Commits" value={data.longestRepo.commits || 0} sub="total" />
                  <StatPill label="Consistency" value={`${data.longestRepo.consistency || 0}%`} sub="uptime" />
                </div>
              </>
            )}
          </>
        )
      }))
      v++
    }

    // 23. TOPICS
    if (data.topTopics?.length) {
      list.push(mc('topics', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.tag}</CardIcon>
              <CardHeadline>Your recurring themes</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{data.topTopics.length} topics define your work</CardSub>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {data.topTopics.slice(0, 10).map((t, i) => <AnimatedTag key={t.name || t} delay={0.1 + i * 0.06}>{t.name || t}</AnimatedTag>)}
            </div>
            {data.topicTrends && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {data.topicTrends.slice(0, 5).map((t) => <Badge key={t.name} color={VIBES[v % VIBES.length].accent}>{t.name} {t.trend === 'up' ? '↑' : t.trend === 'down' ? '↓' : '→'}</Badge>)}
              </div>
            )}
          </>
        )
      }))
      v++
    }

    // 24. CODE QUALITY
    if (data.commitMessageQuality != null || data.emojiUsage != null) {
      list.push(mc('quality', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.sparkles}</CardIcon>
              <CardHeadline>Your commit style</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{data.commitMessageQuality ? `Quality score: ${data.commitMessageQuality}%` : 'How you write your history'}</CardSub>
            </div>
            {data.commitTypes && (
              <GlassSurface delay={0.15}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(data.commitTypes).slice(0, 4).map(([type, pct], i) => (
                    <StatBar key={type} label={type} value={pct} delay={0.2 + i * 0.1} color={VIBES[(v + i) % VIBES.length].accent} />
                  ))}
                </div>
              </GlassSurface>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Quality" value={`${data.commitMessageQuality || 0}%`} sub="score" color={VIBES[v % VIBES.length].accent} />
              <StatPill label="Emojis" value={`${data.emojiUsage || 0}%`} sub="commits" />
              <StatPill label="Docs" value={`${data.docsRatio || 0}%`} sub="README commits" />
              <StatPill label="Tests" value={`${data.testMentions || 0}%`} sub="mentions" />
            </div>
          </>
        )
      }))
      v++
    }

    // 25. IMPACT
    if (data.impactScore != null || data.viralMoments != null) {
      list.push(mc('impact', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.trending}</CardIcon>
              <CardHeadline>Your ripple effect</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{data.viralMoments || 0} viral moments this year</CardSub>
            </div>
            {data.impactTrend && (
              <div>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Impact Over Time</div>
                <SparkLine data={data.impactTrend} color={VIBES[v % VIBES.length].accent} width={140} height={24} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Impact" value={data.impactScore || 0} sub="score" color={VIBES[v % VIBES.length].accent} />
              <StatPill label="Viral" value={data.viralMoments || 0} sub="moments" />
              <StatPill label="Reach" value={data.totalReach || 0} sub="people" />
              <StatPill label="Stars/Repo" value={data.starsPerRepo || 0} sub="avg" />
            </div>
          </>
        )
      }))
      v++
    }

    // 26. CONSISTENCY
    if (data.consistencyScore != null || data.contributionGraph) {
      list.push(mc('consistency', {
        children: (
          <>
            <div>
              <CardIcon color={VIBES[v % VIBES.length].accent}>{I.activity}</CardIcon>
              <CardHeadline>Reliability score: {data.consistencyScore || 0}%</CardHeadline>
              <CardSub style={{ marginTop: 6 }}>{data.missedDays || 0} missed days out of {data.totalDays || 365}</CardSub>
            </div>
            {data.contributionGraph && (
              <div>
                <div style={{ fontSize: 10, color: MOCHA, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last 90 Days</div>
                <HeatStrip data={data.contributionGraph} color={VIBES[v % VIBES.length].accent} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill label="Score" value={`${data.consistencyScore || 0}%`} sub="consistency" color={VIBES[v % VIBES.length].accent} />
              <StatPill label="Streaks" value={data.totalStreaks || 0} sub="total" />
              <StatPill label="Variance" value={`${data.commitVariance || 0}%`} sub="volatility" />
              <StatPill label="Reliability" value={data.reliabilityScore || 0} sub="index" />
            </div>
          </>
        )
      }))
      v++
    }

    // ── FINALE ──
    list.push({
      key: 'end',
      render: () => (
        <EndSlide data={data} cardRef={finaleRef} done={done}
          onDownload={downloadFinale} onCopyLink={copyFinaleLink}
          onFinish={onClose} onTweet={tweetFinale} onNativeShare={nativeShareFinale} />
      ),
    })
    return list
  }, [identity, story, done, data, memes, copied, copyCardImage, shareCardLink, tweetCard, nativeShareCard])

  const last = chapters.length - 1
  const go = (dir) => setIdx(i => Math.max(0, Math.min(last, i + dir)))

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
    <div onClick={(e) => { const x = e.clientX / window.innerWidth; if (x < 0.28) go(-1); else go(1) }}
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: CREAM, display: 'flex', flexDirection: 'column', cursor: 'pointer', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4, backgroundImage: 'radial-gradient(circle, rgba(61,43,31,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', gap: 4, padding: '16px 16px 0', position: 'relative', zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
        {chapters.map((c, i) => (
          <div key={c.key} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(61,43,31,0.1)', overflow: 'hidden' }}>
            <motion.div initial={false} animate={{ width: i <= idx ? '100%' : '0%' }} transition={{ duration: i === idx ? 0.4 : 0.25, ease: 'easeOut' }} style={{ height: '100%', background: ESPRESSO }} />
          </div>
        ))}
      </div>
      <motion.button onClick={(e) => { e.stopPropagation(); onClose() }} whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.9 }}
        style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 9, background: 'rgba(61,43,31,0.04)', border: '1px solid rgba(61,43,31,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }} aria-label="Close">
        <XIcon size={15} color={ESPRESSO} />
      </motion.button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, padding: '20px 0' }}>
        <AnimatePresence mode="wait">
          <React.Fragment key={chapters[idx].key}>{chapters[idx].render()}</React.Fragment>
        </AnimatePresence>
      </div>
    </div>
  )
}
