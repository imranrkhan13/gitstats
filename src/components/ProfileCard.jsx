// ProfileCard.jsx — redesigned "Developer Card": bold hero number, real
// stats grid, language distribution bar, condensed activity heatmap, radar,
// badges, and an AI-upgradeable bio. Built for social (portrait aspect,
// large type) rather than a dashboard widget shrunk into a square.
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import { TiltCard } from './CardEngine.jsx'
import { calcIdentity } from '../lib/identity.js'
import { getBadges } from '../lib/badges.js'
import { templateBio, generateBio } from '../lib/aiCopy.js'
import { fmt, buildMiniHeatmap } from '../lib/utils.js'
import { CountUp } from './MotionUI.jsx'
import { BRAND } from '../lib/brand.js'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }
const rise = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } }

function StatCell({ value, label }) {
  return (
    <motion.div variants={rise} style={{ textAlign: 'left' }}>
      <div style={{ fontSize: '1.5em', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        <CountUp value={typeof value === 'number' ? value : 0} format={n => typeof value === 'number' ? fmt(Math.round(n)) : value} duration={0.7} />
      </div>
      <div style={{ fontSize: '0.5em', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
    </motion.div>
  )
}

function LanguageBar({ languages }) {
  if (!languages?.length) return null
  const top = languages.slice(0, 4)
  return (
    <motion.div variants={rise}>
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
        {top.map(l => (
          <motion.div key={l.name} initial={{ width: 0 }} animate={{ width: `${l.pct}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: l.color || 'var(--br3)' }} title={`${l.name} ${l.pct}%`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3% 4%' }}>
        {top.map(l => (
          <span key={l.name} style={{ fontSize: '0.52em', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.color || 'var(--br3)' }} />{l.name} {l.pct}%
          </span>
        ))}
      </div>
    </motion.div>
  )
}

function MiniHeatmap({ activeDays }) {
  const cells = buildMiniHeatmap(activeDays, 70)
  return (
    <motion.div variants={rise} style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 2 }}>
      {cells.map((v, i) => (
        <div key={i} style={{ aspectRatio: '1', borderRadius: 2, background: v ? 'var(--br3)' : 'var(--bg2)' }} />
      ))}
    </motion.div>
  )
}

export function ProfileCard({ data, width = 'min(360px, 88vw)', cardRef }) {
  const { user, nonForkCount, totalStars, totalForks, streak, longestStreak, languages, memberYears, activeDays, radarData } = data
  const identity = calcIdentity(data)
  const badges = getBadges(data)
  const initials = (user.name || user.login).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const [bio, setBio] = useState({ text: templateBio(data), aiGenerated: false })
  useEffect(() => {
    let cancelled = false
    generateBio(data).then(res => { if (!cancelled) setBio(res) })
    return () => { cancelled = true }
  }, [data.user.login])

  return (
    <div style={{ width, maxWidth: '100%', margin: '0 auto' }}>
      <div ref={cardRef}>
        <TiltCard width={width} aspectRatio="380/560">
          <motion.div
            variants={stagger} initial="hidden" animate="show"
            style={{
              height: '100%', width: '100%', display: 'flex', flexDirection: 'column', padding: '7% 8%',
              boxSizing: 'border-box', fontFamily: 'Inter,sans-serif', fontSize: 'min(3.2vw, 14px)',
              background: 'linear-gradient(160deg, var(--surface) 0%, var(--bg) 100%)',
            }}
          >
            {/* Top: avatar, name, badge */}
            <motion.div variants={rise} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '5%' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--text2)' }}>
                {user.avatar_url ? <img src={user.avatar_url} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '1.05em', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || user.login}</div>
                <div style={{ fontSize: '0.62em', color: 'var(--text3)' }}>@{user.login}</div>
              </div>
            </motion.div>
            <motion.div variants={rise} style={{ display: 'inline-block', fontSize: '0.58em', fontWeight: 800, color: 'var(--br2)', background: 'var(--br2)18', border: '1px solid var(--br2)40', borderRadius: 20, padding: '3px 10px', marginBottom: '6%', alignSelf: 'flex-start' }}>
              {identity.badge || identity.title}
            </motion.div>

            {/* Hero metric */}
            <motion.div variants={rise} style={{ marginBottom: '5%' }}>
              <div style={{ fontSize: '3.4em', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 0.9 }}>
                <CountUp value={nonForkCount} duration={0.9} />
              </div>
              <div style={{ fontSize: '0.62em', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Public Projects</div>
            </motion.div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4% 2%', marginBottom: '5%' }}>
              <StatCell value={user.followers} label="Followers" />
              <StatCell value={totalStars} label="Stars" />
              <StatCell value={totalForks} label="Forks" />
              <StatCell value={streak} label="Streak" />
              <StatCell value={longestStreak} label="Best Streak" />
              <StatCell value={memberYears} label="Years Active" />
            </div>

            {/* Radar — reuses the same 6-dimension data already computed elsewhere */}
            {radarData?.length > 0 && (
              <motion.div variants={rise} style={{ height: 110, marginBottom: '2%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text3)', fontSize: 8 }} />
                    <Radar dataKey="A" stroke="var(--br3)" fill="var(--br3)" fillOpacity={0.35} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Languages */}
            <div style={{ marginBottom: '5%' }}><LanguageBar languages={languages} /></div>

            {/* Mini heatmap */}
            <div style={{ marginBottom: '5%' }}>
              <div style={{ fontSize: '0.5em', fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Last 70 Days</div>
              <MiniHeatmap activeDays={activeDays} />
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <motion.div variants={rise} style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: '5%' }}>
                {badges.map(b => (
                  <span key={b.label} style={{ fontSize: '0.52em', fontWeight: 700, color: 'var(--text2)', background: 'var(--bg2)', borderRadius: 20, padding: '3px 8px' }}>{b.emoji} {b.label}</span>
                ))}
              </motion.div>
            )}

            {/* AI bio */}
            <motion.div variants={rise} style={{ fontSize: '0.6em', color: 'var(--text2)', lineHeight: 1.5, marginTop: 'auto', paddingTop: '3%', borderTop: '1px solid var(--border)' }}>
              {bio.text}
            </motion.div>

            <motion.div variants={rise} style={{ fontSize: '0.48em', color: 'var(--text4)', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>{BRAND.appName} · gitstatus.techiesaie.com</span>
              <span>{BRAND.madeBy}</span>
            </motion.div>
          </motion.div>
        </TiltCard>
      </div>
    </div>
  )
}
