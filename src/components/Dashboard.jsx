// Dashboard.jsx — GitStatus · Zero estimation, real data only
import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PieChart, Pie, Cell
} from 'recharts'
import { fmt, fmtDate, timeAgo } from '../lib/utils.js'
import { LANG_COLORS, REPO_TYPE_COLORS } from '../lib/constants.js'
import { Card, StatCard, SectionLabel, ScoreRing, LangBar, InfoPopup } from './Atoms.jsx'
import {
  StarIcon, ForkIcon, RepoIcon, UsersIcon, FireIcon, CodeIcon,
  TrophyIcon, CalendarIcon, GlobeIcon, LinkIcon, ShareIcon,
  ChartIcon, ExternalIcon, TrendIcon, EyeIcon, IssueIcon, MedalIcon,
  ActivityIcon, CompareIcon, InfoIcon, GridIcon, ListIcon, ZapIcon
} from './Icons.jsx'
import { BRAND } from '../lib/brand.js'

const ACT_COLORS = {
  commit: 'var(--br2)', pr: '#3b82f6', review: '#8b5cf6',
  create: '#22c55e', star: '#d97706', fork: '#a97bff',
  issue: '#ef4444', comment: '#0ea5e9', other: 'var(--text3)'
}
const ACT_LABELS = {
  commit: 'Push', pr: 'PR', review: 'Review', create: 'Created',
  star: 'Starred', fork: 'Forked', issue: 'Issue', comment: 'Comment', other: 'Event'
}

function CT({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 13px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color || 'var(--br2)', flexShrink: 0 }} />
          <span style={{ color: 'var(--text3)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Spotlight repo ────────────────────────────────────────────────────────────
function SpotlightRepo({ repo }) {
  if (!repo) return null
  const typeColor = REPO_TYPE_COLORS[repo.type] || '#a08060'
  return (
    <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ background: 'linear-gradient(135deg,#2a1208 0%,#3d1e10 100%)', borderRadius: 'var(--r2)', padding: '22px 24px', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'transform 0.15s,box-shadow 0.15s', marginBottom: 14 }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(61,32,16,0.25)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 8 }}>⭐ Top Starred Repository</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', marginBottom: 6 }}>{repo.name}</div>
            {repo.isArchived && <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 8, display: 'block' }}>ARCHIVED</span>}
            {repo.desc && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 12, maxWidth: 480 }}>{repo.desc}</p>}
            {repo.topics.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {repo.topics.slice(0, 6).map(t => (
                  <span key={t} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {[
                [<StarIcon size={13} color="#f5c842" />, fmt(repo.stars), 'Stars'],
                [<ForkIcon size={13} color="rgba(255,255,255,0.5)" />, fmt(repo.forks), 'Forks'],
                [<EyeIcon size={13} color="rgba(255,255,255,0.5)" />, fmt(repo.watchers), 'Watchers'],
                [<IssueIcon size={13} color="rgba(255,255,255,0.5)" />, repo.openIssues, 'Open Issues'],
              ].map(([ic, val, lbl]) => (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ic}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f5c842', lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Health score</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: repo.health >= 70 ? '#22c55e' : repo.health >= 45 ? '#f59e0b' : '#ef4444', letterSpacing: '-0.04em', lineHeight: 1 }}>{repo.health}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>out of 100</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: typeColor + '22', border: `1px solid ${typeColor}44`, color: typeColor, fontWeight: 700 }}>{repo.type}</span>
              {repo.lang !== '—' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: LANG_COLORS[repo.lang] || '#a08060' }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{repo.lang}</span>
                </div>
              )}
              {repo.license && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{repo.license}</span>}
              {repo.created && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Created {repo.created.slice(0, 7)}</span>}
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

// ── Developer Identity ────────────────────────────────────────────────────────
function DevIdentityCard({ devType, githubAge, influence, eventStats, followers, following, memberMonths, archivedCount, activeRepoCount }) {
  return (
    <Card style={{ marginBottom: 14 }}>
      <SectionLabel>Developer Identity</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(185px,1fr))', gap: 12 }}>
        {[
          { label: 'Engineer Type', icon: <CodeIcon size={17} color={devType.color} />, bg: devType.color + '18', border: devType.color + '30', value: devType.label, sub: devType.desc },
          { label: 'GitHub Status', icon: <CalendarIcon size={17} color={githubAge.color} />, bg: githubAge.color + '18', border: githubAge.color + '30', value: githubAge.label, sub: githubAge.desc },
          ...(eventStats?.developerStyle ? [{ label: 'Coding Style', icon: <ZapIcon size={17} color="#8b5cf6" />, bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', value: eventStats.developerStyle, sub: eventStats.developerStyle === 'Builder' ? 'Primarily ships & writes code' : eventStats.developerStyle === 'Collaborator' ? 'Focuses on PRs, reviews & discussions' : 'Equal mix of building & collaborating' }] : []),
          { label: 'Influence', icon: <TrendIcon size={17} color={influence.color} />, bg: influence.color + '18', border: influence.color + '30', value: influence.ratio, sub: `${influence.label} · ${fmt(followers)} / ${fmt(following)}` },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{c.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{c.value}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.45 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8, marginTop: 12 }}>
        {[
          { label: 'Active Repos', value: activeRepoCount, note: 'original, not archived', color: 'var(--blue)' },
          { label: 'Archived', value: archivedCount, note: 'no longer maintained', color: 'var(--text4)' },
          { label: 'Months Active', value: memberMonths, note: 'on GitHub', color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, padding: '11px 13px' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: '-0.025em' }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 1 }}>{s.note}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Real 28-day streak calendar ───────────────────────────────────────────────
function StreakCard({ streak, longestStreak, activeDays, lastActive, eventStats }) {
  const today = utcToday()
  const last28 = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(); d.setUTCDate(d.getUTCDate() - (27 - i))
    return d.toISOString().slice(0, 10)
  })
  const activeSet = new Set(activeDays || [])

  return (
    <Card style={{ background: 'linear-gradient(140deg,#2a1208 0%,#1a0a04 100%)', border: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Streak · Real Events</span>
        <FireIcon size={22} color="var(--orange)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[[streak, 'Current', '#fb923c'], [longestStreak, 'Longest seen', 'var(--gold)']].map(([val, label, c]) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: c, letterSpacing: '-0.04em', lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>days</div>
          </div>
        ))}
      </div>

      {eventStats && (eventStats.mostActiveDay || eventStats.mostActiveHour || lastActive) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: 8, marginBottom: 14 }}>
          {eventStats.mostActiveDay && (
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 9, padding: '9px 12px' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Peak day</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fb923c' }}>{eventStats.mostActiveDay}</div>
            </div>
          )}
          {eventStats.mostActiveHour && (
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 9, padding: '9px 12px' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Peak time</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fb923c' }}>{eventStats.mostActiveHour}</div>
            </div>
          )}
          {lastActive && (
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 9, padding: '9px 12px' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Last active</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{lastActive}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Last 28 days — public GitHub events
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {last28.map((dateStr, i) => {
          const isActive = activeSet.has(dateStr)
          const isToday = dateStr === new Date().toISOString().slice(0, 10)
          return (
            <div key={i} title={`${dateStr}${isActive ? ' · active' : ''}`} style={{
              aspectRatio: '1', borderRadius: 3,
              background: isActive ? '#fb923c' : 'rgba(255,255,255,0.06)',
              border: isToday ? '1.5px solid rgba(255,255,255,0.4)' : '1px solid transparent',
              transition: 'transform 0.1s', cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          )
        })}
      </div>
      {activeDays?.length === 0 && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 10, lineHeight: 1.5 }}>
          No public events in the last 90 days. Private activity isn't visible via GitHub's public API.
        </div>
      )}
    </Card>
  )
}

// ── Activity breakdown (events only, last ~90 days) ───────────────────────────
function ActivityBreakdownCard({ eventStats }) {
  const { eventBreakdown, dayActivity, prCount, reviewCount, issueCount,
    pushCount, commentCount, totalCommits, totalEvents } = eventStats
  if (totalEvents === 0) return null

  const pills = [
    { label: 'Pushes', value: pushCount, color: 'var(--br2)' },
    { label: 'Commits', value: totalCommits, color: 'var(--br3)' },
    { label: 'PRs', value: prCount, color: 'var(--blue)' },
    { label: 'Reviews', value: reviewCount, color: '#8b5cf6' },
    { label: 'Issues', value: issueCount, color: 'var(--red)' },
    { label: 'Comments', value: commentCount, color: '#0ea5e9' },
  ].filter(s => s.value > 0)

  return (
    <Card style={{ marginBottom: 14 }}>
      <SectionLabel right={<span style={{ fontSize: 11, color: 'var(--text4)' }}>{totalEvents} events · last ~90 days · public only</span>}>
        Activity Breakdown
      </SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 10 }}>Event Types</div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={eventBreakdown} cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={2} dataKey="value">
                {eventBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 6 }}>
            {eventBreakdown.map(e => (
              <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} />
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{e.name} <b style={{ color: 'var(--text)' }}>{e.value}</b></span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 10 }}>Activity by Day of Week</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={dayActivity} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text4)', fontFamily: 'Inter' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text4)', fontFamily: 'Inter' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CT />} />
              <Bar dataKey="count" name="Events" radius={[3, 3, 0, 0]} maxBarSize={24}>
                {dayActivity.map((d, i) => {
                  const max = Math.max(...dayActivity.map(x => x.count))
                  return <Cell key={i} fill={d.count === max ? 'var(--br)' : 'var(--br3)'} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {pills.map(s => (
              <div key={s.label} style={{ padding: '3px 9px', borderRadius: 20, background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{s.label}: <b style={{ color: 'var(--text)' }}>{s.value}</b></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Topics ────────────────────────────────────────────────────────────────────
function TopicsCard({ topics }) {
  if (!topics?.length) return null
  const TCOLORS = ['#3178c6', '#f59e0b', '#22c55e', '#8b5cf6', '#ef4444', '#0ea5e9', '#f97316', '#6b4020', '#a97bff', '#00b4ab', '#dc322f', '#39594d']
  return (
    <Card style={{ marginBottom: 14 }}>
      <SectionLabel>Top Repository Topics</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {topics.map((t, i) => (
          <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 22, background: 'var(--bg)', border: '1px solid var(--border)', transition: 'border-color 0.15s,box-shadow 0.15s', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = TCOLORS[i % TCOLORS.length]; e.currentTarget.style.boxShadow = `0 2px 8px ${TCOLORS[i % TCOLORS.length]}22` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: TCOLORS[i % TCOLORS.length], flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{t.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text4)' }}>×{t.count}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Stars by language ─────────────────────────────────────────────────────────
function StarsByLangCard({ topLangByStars }) {
  if (!topLangByStars?.length) return null
  const max = topLangByStars[0]?.stars || 1
  return (
    <Card>
      <SectionLabel right={<span style={{ fontSize: 11, color: 'var(--text4)' }}>from public repos</span>}>Stars by Language</SectionLabel>
      {topLangByStars.map(({ lang, stars, color }) => (
        <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', width: 88, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang}</span>
          <div style={{ flex: 1, height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: (stars / max * 100) + '%', height: '100%', background: color, borderRadius: 3, transition: 'width 1s ease' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text3)', width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(stars)}</span>
        </div>
      ))}
    </Card>
  )
}

// ── Repo health grid ──────────────────────────────────────────────────────────
function RepoHealthGrid({ repos }) {
  return (
    <Card style={{ marginBottom: 14 }}>
      <SectionLabel>Repository Health Scores</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
        {repos.slice(0, 6).map(r => {
          const hColor = r.health >= 70 ? '#22c55e' : r.health >= 45 ? '#f59e0b' : '#ef4444'
          return (
            <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '13px 15px', transition: 'border-color 0.15s,box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--br3)'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(61,32,16,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '72%' }}>{r.name}</span>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: hColor, lineHeight: 1 }}>{r.health}</div>
                    <div style={{ fontSize: 9, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>health</div>
                  </div>
                </div>
                <div style={{ height: 4, background: 'var(--bg2)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: r.health + '%', height: '100%', background: hColor, borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><StarIcon size={10} color="#d97706" />{fmt(r.stars)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><ForkIcon size={10} color="var(--text4)" />{fmt(r.forks)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IssueIcon size={10} color="var(--text4)" />{r.openIssues}</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: LANG_COLORS[r.lang] || '#a08060' }} />{r.lang}
                  </span>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </Card>
  )
}

// ── Repos per year ────────────────────────────────────────────────────────────
function ReposByYearChart({ reposByYear }) {
  if (!reposByYear?.length) return null
  return (
    <Card style={{ marginBottom: 14 }}>
      <SectionLabel right={<span style={{ fontSize: 11, color: 'var(--text4)' }}>original repos only</span>}>Repos Created per Year</SectionLabel>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={reposByYear} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text4)', fontFamily: 'Inter' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text4)', fontFamily: 'Inter' }} tickLine={false} axisLine={false} />
          <Tooltip content={<CT />} />
          <Bar dataKey="count" name="Repos Created" radius={[3, 3, 0, 0]} maxBarSize={28}>
            {reposByYear.map((_, i) => (
              <Cell key={i} fill={i === reposByYear.length - 1 ? 'var(--br)' : 'var(--br3)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

function utcToday() { return new Date().toISOString().slice(0, 10) }

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function Dashboard({ data, onShare, onCompare }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [repoSort, setRepoSort] = useState('stars')
  const [repoView, setRepoView] = useState('grid')
  const [showInfo, setShowInfo] = useState(false)

  const {
    user, totalStars, totalForks, totalWatchers, nonForkCount, activeRepoCount, archivedCount,
    languages, topLangByStars, reposByYear,
    topByStars, recentlyActive, monthlyCommits,
    streak, longestStreak, score, activity, repoTypes,
    memberYears, memberMonths, avgStars, stack, radarData, spotlightRepo,
    devType, githubAge, influence, topTopics,
    eventStats, activeDays, lastActive,
  } = data

  const initials = (user.name || user.login).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const sortedRepos = [...topByStars].sort((a, b) =>
    repoSort === 'stars' ? b.stars - a.stars :
      repoSort === 'forks' ? b.forks - a.forks :
        repoSort === 'issues' ? b.openIssues - a.openIssues :
          repoSort === 'health' ? b.health - a.health :
            new Date(b.updated) - new Date(a.updated)
  )

  const tabSt = id => ({
    padding: '8px 16px', border: 'none',
    background: activeTab === id ? 'var(--br)' : 'transparent',
    color: activeTab === id ? '#fff' : 'var(--text3)',
    borderRadius: 9, fontWeight: 600, fontSize: 13,
    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap',
  })

  const scoreBreakdown = [
    { label: 'Repositories', value: Math.min(25, Math.round(Math.log2(nonForkCount + 1) * 5.2)), max: 25, color: 'var(--blue)' },
    { label: 'Followers', value: Math.min(22, Math.round(Math.log10(user.followers + 1) * 9.5)), max: 22, color: 'var(--purple)' },
    { label: 'Stars', value: Math.min(25, Math.round(Math.log10(totalStars + 1) * 9.5)), max: 25, color: '#d97706' },
    { label: 'Forks', value: Math.min(10, Math.round(Math.log10(totalForks + 1) * 5)), max: 10, color: 'var(--br3)' },
    { label: 'Tenure', value: Math.min(10, Math.round(memberYears * 1.4)), max: 10, color: 'var(--green)' },
    { label: 'Diversity', value: Math.min(8, Math.round(languages.length * 0.9)), max: 8, color: 'var(--amber)' },
  ]

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px 80px' }}>
      <InfoPopup show={showInfo} onClose={() => setShowInfo(false)} />

      {/* Tabs + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0 20px', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3, background: 'var(--bg2)', borderRadius: 12, padding: 4 }}>
            {[['overview', 'Overview'], ['repos', 'Repos'], ['activity', 'Activity']].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={tabSt(id)}>{label}</button>
            ))}
          </div>
          <button onClick={() => setShowInfo(true)} title="How scoring works"
            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--br2)'; e.currentTarget.style.color = 'var(--br2)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}>
            <InfoIcon size={15} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCompare}
            style={{ height: 38, padding: '0 16px', border: '1.5px solid var(--border2)', background: 'var(--surface)', borderRadius: 'var(--r)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Inter,sans-serif', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--br2)'; e.currentTarget.style.background = 'var(--bg2)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface)' }}>
            <CompareIcon size={14} color="var(--br2)" /> Compare
          </button>
          <button onClick={onShare}
            style={{ height: 38, padding: '0 18px', border: 'none', background: 'var(--br)', color: '#fff', borderRadius: 'var(--r)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Inter,sans-serif', boxShadow: '0 2px 8px rgba(61,32,16,0.25)', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--br2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--br)'}>
            <ShareIcon size={14} color="#fff" /> Share Card
          </button>
        </div>
      </div>

      {/* Profile Hero */}
      <Card style={{ marginBottom: 14, padding: '24px' }} className="animate-fade-up d1">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 78, height: 78, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--border)', background: 'var(--bg2)' }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: 'var(--br)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#f5ddb0' }}>{initials}</div>}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 5 }}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{user.name || user.login}</h1>
              <a href={`https://github.com/${user.login}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: 'var(--br3)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                @{user.login} <ExternalIcon size={11} color="var(--br3)" />
              </a>
              {devType && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: devType.color + '18', border: `1px solid ${devType.color}30`, color: devType.color, fontWeight: 700 }}>{devType.label}</span>}
              {githubAge && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: githubAge.color + '18', border: `1px solid ${githubAge.color}30`, color: githubAge.color, fontWeight: 600 }}>{githubAge.label}</span>}
            </div>
            {user.bio && <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 11, lineHeight: 1.6, maxWidth: 520 }}>{user.bio}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {user.company && <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}><RepoIcon size={12} color="var(--text4)" />{user.company}</span>}
              {user.location && <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}><GlobeIcon size={12} color="var(--text4)" />{user.location}</span>}
              {user.blog && <a href={user.blog.startsWith('http') ? user.blog : 'https://' + user.blog} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}><LinkIcon size={12} color="var(--blue)" />{user.blog.replace(/^https?:\/\//, '')}</a>}
              {user.twitter_username && <a href={`https://twitter.com/${user.twitter_username}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1da1f2', textDecoration: 'none' }}>@{user.twitter_username}</a>}
              <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}><CalendarIcon size={12} color="var(--text4)" />Joined {fmtDate(user.created_at)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            <ScoreRing score={score} size={90} />
            <button onClick={() => setShowInfo(true)} style={{ fontSize: 10, color: 'var(--text4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <InfoIcon size={10} color="var(--text4)" /> How it's calculated
            </button>
          </div>
        </div>
      </Card>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(135px,1fr))', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Repositories', value: fmt(nonForkCount), sub: 'original repos', icon: <RepoIcon size={15} color="var(--br3)" />, dark: false, d: 'd2' },
          { label: 'Total Stars', value: fmt(totalStars), sub: 'across all repos', icon: <StarIcon size={15} color="#d97706" />, dark: false, d: 'd2' },
          { label: 'Total Forks', value: fmt(totalForks), sub: 'by the community', icon: <ForkIcon size={15} color="var(--br3)" />, dark: false, d: 'd3' },
          { label: 'Followers', value: fmt(user.followers), sub: fmt(user.following) + ' following', icon: <UsersIcon size={15} color="var(--br3)" />, dark: false, d: 'd3' },
          { label: 'Current Streak', value: `${streak}d`, sub: 'days active', icon: <FireIcon size={15} color="var(--orange)" />, dark: true, d: 'd4' },
          { label: 'Longest Streak', value: `${longestStreak}d`, sub: 'within 90d window', icon: <TrophyIcon size={15} color="var(--br4)" />, dark: false, d: 'd4' },
          { label: 'Member', value: `${memberYears}yr`, sub: `${memberMonths} months`, icon: <CalendarIcon size={15} color="var(--br3)" />, dark: false, d: 'd5' },
          { label: 'Avg Stars', value: avgStars >= 1000 ? fmt(avgStars) : avgStars, sub: 'per repo', icon: <TrendIcon size={15} color="var(--br3)" />, dark: false, d: 'd5' },
        ].map(({ label, value, sub, icon, dark, d }) => (
          <StatCard key={label} label={label} value={value} sub={sub} icon={icon} dark={dark} className={`animate-fade-up ${d}`} />
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <>
          {spotlightRepo && <SpotlightRepo repo={spotlightRepo} />}
          {devType && <DevIdentityCard devType={devType} githubAge={githubAge} influence={influence} eventStats={eventStats} followers={user.followers} following={user.following} memberMonths={memberMonths} archivedCount={archivedCount} activeRepoCount={activeRepoCount} />}

          {/* Commit chart — only if we have real data */}
          {monthlyCommits.length > 0 && (
            <Card style={{ marginBottom: 14 }} className="animate-fade-up d3">
              <SectionLabel right={<span style={{ fontSize: 11, color: 'var(--text4)' }}>real push events only · last ~90 days</span>}>
                Commits by Month
              </SectionLabel>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyCommits} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg3)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text4)', fontFamily: 'Inter' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text4)', fontFamily: 'Inter' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CT />} />
                  <Bar dataKey="commits" name="Commits" radius={[3, 3, 0, 0]} maxBarSize={36}>
                    {monthlyCommits.map((_, i) => (
                      <Cell key={i} fill={i === monthlyCommits.length - 1 ? 'var(--br)' : i >= monthlyCommits.length - 2 ? 'var(--br2)' : 'var(--br3)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Languages + pie */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <Card className="animate-fade-up d4">
              <SectionLabel right={<span style={{ fontSize: 11, color: 'var(--text4)' }}>by repo size (bytes)</span>}>Languages</SectionLabel>
              {languages.map(l => <LangBar key={l.name} name={l.name} pct={l.pct} color={l.color} />)}
              {!languages.length && <p style={{ fontSize: 13, color: 'var(--text4)', fontStyle: 'italic' }}>No language data</p>}
            </Card>
            <Card className="animate-fade-up d4">
              <SectionLabel>Language Share</SectionLabel>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={languages} cx="50%" cy="48%" innerRadius={48} outerRadius={76} paddingAngle={2} dataKey="pct">
                    {languages.map(l => <Cell key={l.name} fill={l.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 12px' }}>
                {languages.slice(0, 6).map(l => (
                  <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>{l.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Score breakdown + Radar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <Card className="animate-fade-up d5">
              <SectionLabel right={<button onClick={() => setShowInfo(true)} style={{ fontSize: 11, color: 'var(--br3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}><InfoIcon size={12} color="var(--br3)" /> How?</button>}>Dev Score</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <ScoreRing score={score} size={76} />
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                  <b style={{ color: 'var(--text)' }}>Deterministic</b> — same inputs always give the same score.
                </div>
              </div>
              {scoreBreakdown.map(({ label, value, max, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)', width: 82, flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: (value / max * 100) + '%', height: '100%', background: color, borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: color, width: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}/{max}</span>
                </div>
              ))}
            </Card>
            <Card className="animate-fade-up d5">
              <SectionLabel>Skill Radar</SectionLabel>
              <ResponsiveContainer width="100%" height={210}>
                <RadarChart data={radarData} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text3)', fontFamily: 'Inter,sans-serif', fontWeight: 600 }} />
                  <Radar dataKey="A" stroke="var(--br2)" fill="var(--br2)" fillOpacity={0.18} strokeWidth={2.5} dot={{ fill: 'var(--br2)', r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} />
                  <Tooltip content={<CT />} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Streak + Activity breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <StreakCard streak={streak} longestStreak={longestStreak} activeDays={activeDays} lastActive={lastActive} eventStats={eventStats} />
            {eventStats && eventStats.totalEvents > 0
              ? <ActivityBreakdownCard eventStats={eventStats} />
              : (
                <Card>
                  <SectionLabel>Activity Breakdown</SectionLabel>
                  <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>No public events in the last 90 days</div>
                </Card>
              )
            }
          </div>

          {topTopics?.length > 0 && <TopicsCard topics={topTopics} />}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <Card>
              <SectionLabel>Project Categories</SectionLabel>
              {repoTypes.length > 0 ? repoTypes.map(({ type, count, color }) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2.5, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', width: 76, flexShrink: 0 }}>{type}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: (count / (repoTypes[0]?.count || 1) * 100) + '%', height: '100%', background: color, borderRadius: 3, transition: 'width 0.9s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, width: 20, textAlign: 'right' }}>{count}</span>
                </div>
              )) : <p style={{ fontSize: 13, color: 'var(--text4)', fontStyle: 'italic' }}>Not enough data</p>}
            </Card>
            <Card>
              <SectionLabel>Tech Stack</SectionLabel>
              {[['Backend', stack.back, 'var(--blue)'], ['Frontend', stack.front, 'var(--green)'], ['Infra', stack.infra, 'var(--amber)']].map(([lbl, items, accent]) =>
                items?.length > 0 && (
                  <div key={lbl} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>{lbl}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {items.map(l => (
                        <span key={l.name} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: l.color + '1a', border: `1px solid ${l.color}33`, color: l.color, fontWeight: 600 }}>{l.name}</span>
                      ))}
                    </div>
                  </div>
                )
              )}
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <StarsByLangCard topLangByStars={topLangByStars} />
            <Card>
              <SectionLabel>Extra Stats</SectionLabel>
              {[
                { icon: <EyeIcon size={14} color="var(--br3)" />, label: 'Total Watchers', value: fmt(totalWatchers || 0) },
                { icon: <UsersIcon size={14} color="var(--blue)" />, label: 'Following', value: fmt(user.following) },
                { icon: <MedalIcon size={14} color="var(--amber)" />, label: 'Public Gists', value: fmt(user.public_gists || 0) },
                { icon: <RepoIcon size={14} color="var(--text4)" />, label: 'Archived Repos', value: archivedCount },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text2)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{value}</span>
                </div>
              ))}
            </Card>
          </div>

          <RepoHealthGrid repos={topByStars} />
          <ReposByYearChart reposByYear={reposByYear} />
        </>
      )}

      {/* ── REPOS TAB ── */}
      {activeTab === 'repos' && (
        <>
          {recentlyActive?.length > 0 && (
            <Card style={{ marginBottom: 14 }} className="animate-fade-up">
              <SectionLabel right={<span style={{ fontSize: 11, color: 'var(--text4)' }}>by last push date</span>}>Recently Active</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 9 }}>
                {recentlyActive.map(r => (
                  <a key={r.name} href={r.url || `https://github.com/${user.login}/${r.name}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 14px', transition: 'border-color 0.15s,box-shadow 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--br3)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(61,32,16,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                        <span style={{ fontSize: 10, color: 'var(--text4)', flexShrink: 0 }}>{timeAgo(r.updated)}</span>
                      </div>
                      {r.isArchived && <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>Archived · </span>}
                      {r.desc && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 7, fontSize: 11, color: 'var(--text3)' }}>
                        {r.lang !== '—' && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: LANG_COLORS[r.lang] || '#a08060' }} />{r.lang}</span>}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><StarIcon size={10} color="#d97706" />{fmt(r.stars)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><ForkIcon size={10} color="var(--text4)" />{fmt(r.forks)}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 20, background: (REPO_TYPE_COLORS[r.type] || '#a08060') + '18', color: REPO_TYPE_COLORS[r.type] || '#a08060', fontWeight: 600 }}>{r.type}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Top Repositories</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{nonForkCount} repos · {fmt(totalStars)} ⭐ · {fmt(totalForks)} forks · {archivedCount} archived</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ display: 'flex', gap: 3, background: 'var(--bg2)', borderRadius: 8, padding: 3 }}>
                {[['stars', 'Stars'], ['forks', 'Forks'], ['health', 'Health'], ['updated', 'Recent'], ['issues', 'Issues']].map(([s, label]) => (
                  <button key={s} onClick={() => setRepoSort(s)} style={{ padding: '5px 10px', border: 'none', borderRadius: 6, background: repoSort === s ? 'var(--surface)' : 'transparent', color: repoSort === s ? 'var(--text)' : 'var(--text3)', fontWeight: 600, fontSize: 11, cursor: 'pointer', boxShadow: repoSort === s ? 'var(--shadow)' : 'none', transition: 'all 0.15s', fontFamily: 'Inter' }}>{label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 3, background: 'var(--bg2)', borderRadius: 8, padding: 3 }}>
                {[['grid', <GridIcon size={13} />], ['list', <ListIcon size={13} />]].map(([v, ic]) => (
                  <button key={v} onClick={() => setRepoView(v)} style={{ width: 30, height: 28, border: 'none', borderRadius: 6, background: repoView === v ? 'var(--surface)' : 'transparent', color: repoView === v ? 'var(--text)' : 'var(--text3)', cursor: 'pointer', transition: 'all 0.15s', boxShadow: repoView === v ? 'var(--shadow)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: repoView === 'grid' ? 'grid' : 'flex', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', flexDirection: 'column', gap: 10 }}>
            {sortedRepos.map(r => (
              <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: repoView === 'grid' ? '16px 18px' : '13px 16px', cursor: 'pointer', transition: 'border-color 0.2s,box-shadow 0.2s', display: repoView === 'list' ? 'flex' : 'block', alignItems: repoView === 'list' ? 'center' : undefined, gap: repoView === 'list' ? 16 : undefined }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--br3)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(61,32,16,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
                  {repoView === 'grid' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                          {r.isArchived && <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>ARCHIVED</span>}
                        </div>
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: (REPO_TYPE_COLORS[r.type] || '#a08060') + '18', color: REPO_TYPE_COLORS[r.type] || '#a08060', fontWeight: 600, flexShrink: 0 }}>{r.type}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.55, marginBottom: 10, minHeight: 34, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.desc || 'No description'}</p>
                      {r.topics.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>{r.topics.slice(0, 3).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--text3)', fontWeight: 500 }}>{t}</span>)}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text4)', width: 38 }}>Health</span>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg2)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: r.health + '%', height: '100%', background: r.health >= 70 ? 'var(--green)' : r.health >= 45 ? 'var(--amber)' : 'var(--red)', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: r.health >= 70 ? 'var(--green)' : r.health >= 45 ? 'var(--amber)' : 'var(--red)', width: 24, textAlign: 'right' }}>{r.health}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 9 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {r.lang !== '—' && <><div style={{ width: 9, height: 9, borderRadius: '50%', background: LANG_COLORS[r.lang] || '#a08060' }} /><span style={{ fontSize: 11, color: 'var(--text3)' }}>{r.lang}</span></>}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ fontSize: 12, color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><StarIcon size={11} color="#d97706" />{fmt(r.stars)}</span>
                          <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}><ForkIcon size={10} color="var(--text4)" />{fmt(r.forks)}</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text4)' }}>{timeAgo(r.updated)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: (REPO_TYPE_COLORS[r.type] || '#a08060') + '18', color: REPO_TYPE_COLORS[r.type] || '#a08060', fontWeight: 600, flexShrink: 0 }}>{r.type}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc || 'No description'}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <span style={{ fontSize: 13, color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><StarIcon size={12} color="#d97706" />{fmt(r.stars)}</span>
                        {r.lang !== '—' && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: LANG_COLORS[r.lang] || '#a08060' }} /><span style={{ fontSize: 11, color: 'var(--text3)' }}>{r.lang}</span></div>}
                        <span style={{ fontSize: 11, color: 'var(--text4)', minWidth: 52, textAlign: 'right' }}>{timeAgo(r.updated)}</span>
                      </div>
                    </>
                  )}
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* ── ACTIVITY TAB ── */}
      {activeTab === 'activity' && (
        <>
          {/* Commits chart */}
          {monthlyCommits.length > 0 ? (
            <Card style={{ marginBottom: 14 }} className="animate-fade-up d1">
              <SectionLabel right={<span style={{ fontSize: 11, color: 'var(--text4)' }}>real push events · ~90 day window</span>}>Commit Activity</SectionLabel>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={monthlyCommits} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--br2)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--br2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg3)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text4)', fontFamily: 'Inter' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text4)', fontFamily: 'Inter' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CT />} />
                  <Area type="monotone" dataKey="commits" name="Commits" stroke="var(--br2)" fill="url(#cg)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--br2)', stroke: 'var(--surface)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <Card style={{ marginBottom: 14 }}>
              <SectionLabel>Commit Activity</SectionLabel>
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>
                No push events found in the last 90 days.
              </div>
            </Card>
          )}

          {eventStats && <ActivityBreakdownCard eventStats={eventStats} />}

          {/* Streak + Radar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <StreakCard streak={streak} longestStreak={longestStreak} activeDays={activeDays} lastActive={lastActive} eventStats={eventStats} />
            <Card>
              <SectionLabel>Skill Radar</SectionLabel>
              <ResponsiveContainer width="100%" height={210}>
                <RadarChart data={radarData} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text3)', fontFamily: 'Inter,sans-serif', fontWeight: 600 }} />
                  <Radar dataKey="A" stroke="var(--br2)" fill="var(--br2)" fillOpacity={0.18} strokeWidth={2.5} dot={{ fill: 'var(--br2)', r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} />
                  <Tooltip content={<CT />} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <ReposByYearChart reposByYear={reposByYear} />

          {/* Activity feed */}
          <Card className="animate-fade-up d3">
            <SectionLabel right={<span style={{ fontSize: 11, color: 'var(--text4)' }}>{activity.length} recent public events</span>}>Recent Activity</SectionLabel>
            {activity.length > 0 ? (
              <div>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACT_COLORS[a.type] || 'var(--text3)', flexShrink: 0, marginTop: 6 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.msg}</div>
                      <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {a.repoShort && <span style={{ fontWeight: 600, color: 'var(--br3)' }}>{a.repoShort}</span>}
                        {a.detail && <span>{a.detail}</span>}
                        <span>{timeAgo(a.time)}</span>
                        <span style={{ padding: '1px 7px', borderRadius: 20, background: (ACT_COLORS[a.type] || 'var(--border)') + '22', color: ACT_COLORS[a.type] || 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10, border: `1px solid ${ACT_COLORS[a.type] || 'var(--border)'}33` }}>{ACT_LABELS[a.type]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text4)', fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><ActivityIcon size={28} color="var(--border2)" /></div>
                No recent public activity found
              </div>
            )}
          </Card>
        </>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px 0 0', borderTop: '1px solid var(--border)', marginTop: 32 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>
          Powered by <a href={BRAND.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--br2)', fontWeight: 700, textDecoration: 'none' }}>{BRAND.appName}</a>
          {' · '}Made by <a href={BRAND.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--br3)', fontWeight: 700, textDecoration: 'none' }}>{BRAND.madeBy}</a>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 6, maxWidth: 480, margin: '6px auto 0', lineHeight: 1.6 }}>
          All data is sourced directly from GitHub's public REST API. Activity data is limited to the last ~90 days. Private repos and org-private contributions are not visible.
        </div>
      </div>
    </div>
  )
}