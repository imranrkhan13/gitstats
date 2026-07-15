// ProfileCard.jsx — Clean Developer Card with confirmed data only
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import { TiltCard } from './CardEngine.jsx'
import { calcIdentity } from '../lib/identity.js'
import { getBadges } from '../lib/badges.js'
import { templateBio, generateBio } from '../lib/aiCopy.js'
import { fmt } from '../lib/utils.js'
import { CountUp } from './MotionUI.jsx'
import { BRAND } from '../lib/brand.js'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }
const rise = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } }

function StatCell({ value, label, sub, highlight }) {
  return (
    <motion.div variants={rise} style={{ textAlign: 'left' }}>
      <div style={{ fontSize: '1.6em', fontWeight: 900, color: highlight ? 'var(--br3)' : 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        <CountUp value={typeof value === 'number' ? value : 0} format={n => typeof value === 'number' ? fmt(Math.round(n)) : value} duration={0.7} />
      </div>
      <div style={{ fontSize: '0.5em', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.42em', color: 'var(--text4)', fontWeight: 600, marginTop: 2 }}>{sub}</div>}
    </motion.div>
  )
}

function StatRow({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '4% 2%', marginBottom: '5%' }}>
      {items.map((item, i) => <StatCell key={i} {...item} />)}
    </div>
  )
}

function LanguageBar({ languages }) {
  if (!languages?.length) return null
  const top = languages.slice(0, 5)
  return (
    <motion.div variants={rise}>
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
        {top.map(l => (
          <motion.div key={l.name} initial={{ width: 0 }} animate={{ width: `${l.pct}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: l.color || 'var(--br3)' }} />
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

function StreakCard({ streak, longestStreak, totalCommits, commitsThisYear, commitStreakData = {} }) {
  const currentStreakCommits = commitStreakData.currentStreakCommits || 0
  const bestStreakCommits = commitStreakData.bestStreakCommits || 0

  return (
    <motion.div variants={rise} style={{
      background: 'linear-gradient(135deg, var(--br3)12 0%, var(--br2)08 100%)',
      border: '1px solid var(--border)', borderRadius: 14, padding: '5% 6%', marginBottom: '5%'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8% 5%' }}>
        <div>
          <div style={{ fontSize: '2.2em', fontWeight: 900, color: 'var(--br3)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            <CountUp value={streak} duration={0.9} />
          </div>
          <div style={{ fontSize: '0.5em', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Current Streak</div>
          <div style={{ fontSize: '0.46em', color: 'var(--br2)', fontWeight: 700, marginTop: 3 }}>{currentStreakCommits} commits</div>
        </div>
        <div>
          <div style={{ fontSize: '2.2em', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            <CountUp value={longestStreak} duration={0.9} />
          </div>
          <div style={{ fontSize: '0.5em', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Best Streak</div>
          <div style={{ fontSize: '0.46em', color: 'var(--br2)', fontWeight: 700, marginTop: 3 }}>{bestStreakCommits} commits</div>
        </div>
        <div>
          <div style={{ fontSize: '2.2em', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            <CountUp value={totalCommits} duration={0.9} />
          </div>
          <div style={{ fontSize: '0.5em', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Total Commits</div>
        </div>
        <div>
          <div style={{ fontSize: '2.2em', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            <CountUp value={commitsThisYear} duration={0.9} />
          </div>
          <div style={{ fontSize: '0.5em', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>This Year</div>
        </div>
      </div>
    </motion.div>
  )
}

// Simple text-based activity summary — no confusing graph
function ActivitySummary({ contributions = [], totalCommits = 0, commitsThisYear = 0 }) {
  if (!contributions?.length) return null

  const activeDays = contributions.filter(d => d.count > 0).length
  const maxDay = contributions.reduce((max, d) => d.count > max.count ? d : max, contributions[0] || { date: '', count: 0 })
  const avg = activeDays > 0 ? Math.round(totalCommits / activeDays) : 0

  return (
    <motion.div variants={rise} style={{ marginBottom: '5%' }}>
      <div style={{ fontSize: '0.58em', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Activity Summary
      </div>
      <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
          <div>
            <div style={{ fontSize: '0.9em', fontWeight: 900, color: 'var(--text)' }}>{totalCommits}</div>
            <div style={{ fontSize: '0.42em', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commits (365d)</div>
          </div>
          <div>
            <div style={{ fontSize: '0.9em', fontWeight: 900, color: 'var(--text)' }}>{commitsThisYear}</div>
            <div style={{ fontSize: '0.42em', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commits in 2026</div>
          </div>
          <div>
            <div style={{ fontSize: '0.9em', fontWeight: 900, color: 'var(--text)' }}>{activeDays}</div>
            <div style={{ fontSize: '0.42em', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Days</div>
          </div>
          <div>
            <div style={{ fontSize: '0.9em', fontWeight: 900, color: 'var(--text)' }}>{avg}</div>
            <div style={{ fontSize: '0.42em', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg / Active Day</div>
          </div>
        </div>
        {maxDay.count > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: '0.48em', color: 'var(--text3)', fontWeight: 600 }}>
            Best day: <strong style={{ color: 'var(--br3)' }}>{maxDay.date}</strong> with <strong style={{ color: 'var(--br3)' }}>{maxDay.count}</strong> commits
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ProfileCard({ data, width = 'min(420px, 92vw)', full = false, cardRef }) {
  const {
    user, nonForkCount, totalStars, totalForks, streak, longestStreak,
    languages, memberYears, radarData, totalCommits = 0, commitsThisYear = 0,
    totalPRs = 0, totalIssues = 0, contributions = [], commitStreakData = {}
  } = data

  const identity = calcIdentity(data)
  const badges = getBadges(data)
  const initials = (user.name || user.login).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const [bio, setBio] = useState({ text: templateBio(data), aiGenerated: false })
  useEffect(() => {
    let cancelled = false
    generateBio(data).then(res => { if (!cancelled) setBio(res) })
    return () => { cancelled = true }
  }, [data.user.login])

  const containerWidth = full ? '100%' : width
  const padding = full ? '5% 6%' : '7% 8%'

  return (
    <div style={{ width: containerWidth, maxWidth: '100%', margin: '0 auto' }}>
      <div ref={cardRef}>
        <TiltCard width={containerWidth} aspectRatio="auto" disabled={full}>
          <motion.div
            variants={stagger} initial="hidden" animate="show"
            style={{
              width: '100%', display: 'flex', flexDirection: 'column',
              padding, boxSizing: 'border-box', fontFamily: 'Inter,sans-serif',
              fontSize: full ? 'min(2.8vw, 15px)' : 'min(3.2vw, 14px)',
              background: 'linear-gradient(160deg, var(--surface) 0%, var(--bg) 100%)',
              minHeight: full ? '90vh' : 'auto'
            }}
          >
            {/* Avatar + Name */}
            <motion.div variants={rise} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '4%' }}>
              <div style={{ width: full ? 56 : 48, height: full ? 56 : 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--text2)' }}>
                {user.avatar_url ? <img src={user.avatar_url} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '1.15em', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || user.login}</div>
                <div style={{ fontSize: '0.62em', color: 'var(--text3)' }}>@{user.login}</div>
                {user.bio && full && <div style={{ fontSize: '0.55em', color: 'var(--text2)', marginTop: 4, lineHeight: 1.4 }}>{user.bio}</div>}
              </div>
            </motion.div>

            <motion.div variants={rise} style={{ display: 'inline-block', fontSize: '0.58em', fontWeight: 800, color: 'var(--br2)', background: 'var(--br2)18', border: '1px solid var(--br2)40', borderRadius: 20, padding: '3px 10px', marginBottom: '4%', alignSelf: 'flex-start' }}>
              {identity.badge || identity.title}
            </motion.div>

            {/* Hero */}
            <motion.div variants={rise} style={{ marginBottom: '4%' }}>
              <div style={{ fontSize: '3.6em', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 0.9 }}>
                <CountUp value={nonForkCount} duration={0.9} />
              </div>
              <div style={{ fontSize: '0.62em', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Public Projects</div>
            </motion.div>

            {/* Stats */}
            <StatRow items={[
              { value: user.followers, label: 'Followers' },
              { value: user.following, label: 'Following', sub: 'Network' },
              { value: totalStars, label: 'Stars' },
              { value: totalForks, label: 'Forks' }
            ]} />

            {/* Streak — single source of truth */}
            <StreakCard streak={streak} longestStreak={longestStreak} totalCommits={totalCommits}
              commitsThisYear={commitsThisYear} commitStreakData={commitStreakData} />

            {full && (
              <StatRow items={[
                { value: totalPRs, label: 'Pull Requests' },
                { value: totalIssues, label: 'Issues' },
                { value: memberYears, label: 'Years Active' },
                { value: Math.round((totalCommits / Math.max(memberYears, 1)) / 365), label: 'Daily Avg' }
              ]} />
            )}

            {/* Radar */}
            {radarData?.length > 0 && (
              <motion.div variants={rise} style={{ height: full ? 140 : 110, marginBottom: '2%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text3)', fontSize: full ? 10 : 8 }} />
                    <Radar dataKey="A" stroke="var(--br3)" fill="var(--br3)" fillOpacity={0.35} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Languages */}
            <div style={{ marginBottom: '4%' }}><LanguageBar languages={languages} /></div>

            {/* Activity Summary — clean text, no confusing graph */}
            <ActivitySummary contributions={contributions} totalCommits={totalCommits} commitsThisYear={commitsThisYear} />

            {/* Bio */}
            {full && bio.text && (
              <motion.div variants={rise} style={{ fontSize: '0.55em', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '4%', padding: '3% 4%', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                {bio.aiGenerated && <span style={{ color: 'var(--br3)', fontWeight: 700, marginRight: 4 }}>✨ AI Summary:</span>}
                {bio.text}
              </motion.div>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <motion.div variants={rise} style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: '4%' }}>
                {badges.map(b => <span key={b.label} style={{ fontSize: '0.52em', fontWeight: 700, color: 'var(--text2)', background: 'var(--bg2)', borderRadius: 20, padding: '3px 8px' }}>{b.emoji} {b.label}</span>)}
              </motion.div>
            )}

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