// RepoShowcase.jsx — repository Deep Review modal.
//
// Two data tiers, deliberately: the hero/stats/tech-stack section uses data
// already fetched for the whole profile (instant, no extra calls). The
// Engineering Score + AI Insights are fetched ONLY when this modal opens,
// for THIS repo alone (see lib/engineeringScore.js for why — rate limits).
//
// Every score explains itself. Anything needing actual source-file analysis
// (complexity, coupling, duplicate code, design patterns) is labeled
// "Source analysis unavailable" rather than estimated — reading individual
// files is its own can of API calls this app doesn't spend without a reason.
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon, StarIcon, ForkIcon, ExternalIcon, CalendarIcon, EyeIcon, LinkIcon, UsersIcon, CheckIcon, IssueIcon } from './Icons.jsx'
import { fmt, timeAgo, fmtDate } from '../lib/utils.js'
import { LANG_COLORS, REPO_TYPE_COLORS } from '../lib/constants.js'
import { fetchEngineeringSignals, calcEngineeringScore } from '../lib/engineeringScore.js'
import { generateWithFallback } from '../lib/aiProviders.js'

const ARCHITECTURE_BLURBS = {
  'AI/ML': 'Structured around a model or pipeline — likely training/inference code plus data handling.',
  'DevOps': 'Infrastructure-first: config, automation, and deployment tooling over application code.',
  'Real-time': 'Built around live data flow — sockets or event streams driving the core logic.',
  'SaaS': 'Product-shaped: a backend/API layer with the concerns of a real, deployed service.',
  'Tooling': 'A focused utility — does one job, meant to be dropped into other projects or workflows.',
  'Frontend': 'UI-first — component structure and presentation are the main architectural concern.',
  'Library': 'Reusable-by-design — public API surface matters more than any single application.',
  'Systems': 'Lower-level and performance-conscious — closer to the metal than most repos.',
}

function StatBlock({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon}
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</span>
    </div>
  )
}

function ReasonRow({ ok, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12.5, color: 'var(--text2)', padding: '3px 0', lineHeight: 1.4 }}>
      <span style={{ color: ok ? 'var(--green)' : 'var(--amber)', fontWeight: 800, flexShrink: 0 }}>{ok ? '✓' : '⚠'}</span>
      {text}
    </div>
  )
}

function Unavailable({ label }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--text4)', fontStyle: 'italic', padding: '2px 0' }}>
      {label}: Source analysis unavailable — would require reading individual source files, which this app doesn't do automatically to stay within GitHub's unauthenticated rate limit.
    </div>
  )
}

export function RepoShowcase({ repo, owner, onClose }) {
  const [eng, setEng] = useState(null)          // { signals, score, reasons } | 'error' | null (loading)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    if (!repo) return
    setEng(null); setAiText(''); setAiError('')
    fetchEngineeringSignals(owner, repo.name)
      .then(signals => setEng({ signals, ...calcEngineeringScore(signals) }))
      .catch(() => setEng('error'))
  }, [repo, owner])

  if (!repo) return null

  const ogImage = `https://opengraph.githubassets.com/1/${owner}/${repo.name}`
  const archBlurb = ARCHITECTURE_BLURBS[repo.type] || 'General-purpose repository — no single architectural pattern stands out.'
  const scoreColor = (s) => s >= 70 ? 'var(--green)' : s >= 45 ? 'var(--amber)' : 'var(--red)'

  const runAI = async (kind) => {
    setAiLoading(true); setAiText(''); setAiError('')
    const base = `Repo: ${owner}/${repo.name}\nDescription: ${repo.desc || 'none'}\nPrimary language: ${repo.lang}\nTopics: ${(repo.topics || []).join(', ') || 'none'}\nStars: ${repo.stars}, Forks: ${repo.forks}${eng && eng !== 'error' ? `\nHas README: ${eng.signals.hasReadme} (${eng.signals.readmeLength} chars)\nHas tests: ${eng.signals.hasTests}\nHas CI: ${eng.signals.hasCI}` : ''}`
    const prompt = kind === 'explain'
      ? `Explain what this GitHub repository likely does and how it's organized, in 3-4 sentences, for a developer seeing it for the first time. Be concrete, don't pad with generic praise.\n\n${base}`
      : `Suggest 3 specific, actionable improvements to this repository's README, based on what's known about it. Short bullet points, no fluff.\n\n${base}`
    const res = await generateWithFallback(prompt)
    if (res.ok) setAiText(res.text)
    else setAiError('AI unavailable right now (no provider configured or all failed) — try again later.')
    setAiLoading(false)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(10,5,0,0.72)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          style={{ width: '100%', maxWidth: 680, maxHeight: '88vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 18, boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}
        >
          {/* Hero */}
          <div style={{ position: 'relative', borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden', background: 'var(--bg2)', aspectRatio: '1200/630' }}>
            <img src={ogImage} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 8, background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close">
              <XIcon size={15} color="#fff" />
            </button>
          </div>

          <div style={{ padding: '20px 24px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>{repo.name}</div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: (REPO_TYPE_COLORS[repo.type] || '#a08060') + '18', color: REPO_TYPE_COLORS[repo.type] || '#a08060', fontWeight: 700 }}>{repo.type}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {repo.homepage && (
                  <a href={repo.homepage} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--green)', borderRadius: 8, padding: '8px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <LinkIcon size={12} color="#fff" /> Live Demo
                  </a>
                )}
                <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ExternalIcon size={12} color="var(--text2)" /> GitHub
                </a>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 }}>{repo.desc || 'No description provided.'}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <StatBlock icon={<StarIcon size={13} color="#d97706" />} label="stars" value={fmt(repo.stars)} />
              <StatBlock icon={<ForkIcon size={13} color="var(--text3)" />} label="forks" value={fmt(repo.forks)} />
              {repo.watchers != null && <StatBlock icon={<EyeIcon size={13} color="var(--text3)" />} label="watching" value={fmt(repo.watchers)} />}
              <StatBlock icon={<IssueIcon size={13} color="var(--text3)" />} label="open issues" value={fmt(repo.openIssues || 0)} />
              <StatBlock icon={<CalendarIcon size={13} color="var(--text3)" />} label="created" value={fmtDate(repo.created)} />
              <StatBlock icon={<CalendarIcon size={13} color="var(--text3)" />} label="last push" value={timeAgo(repo.pushed)} />
            </div>

            {/* Tech stack */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Tech Stack</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {repo.lang && repo.lang !== '—' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text2)', background: 'var(--bg2)', borderRadius: 20, padding: '4px 10px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: LANG_COLORS[repo.lang] || '#a08060' }} />{repo.lang}
                  </span>
                )}
                {(repo.topics || []).slice(0, 6).map(t => (
                  <span key={t} style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--bg2)', borderRadius: 20, padding: '4px 10px' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Engineering Score — the flagship section, fetched on open */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: eng && eng !== 'error' ? 12 : 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Engineering Score</span>
                {eng && eng !== 'error' && <span style={{ fontSize: 20, fontWeight: 900, color: scoreColor(eng.score) }}>{eng.score}</span>}
              </div>

              {!eng && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text3)' }}>
                  <div style={{ width: 12, height: 12, border: '2px solid var(--border2)', borderTopColor: 'var(--br3)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Checking README, tests, CI, license, contributors…
                </div>
              )}
              {eng === 'error' && <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>Couldn't fetch repository internals right now — GitHub API may be rate-limited. Try again shortly.</div>}
              {eng && eng !== 'error' && (
                <>
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--bg2)', overflow: 'hidden', marginBottom: 10 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${eng.score}%` }} transition={{ duration: 0.6 }} style={{ height: '100%', background: scoreColor(eng.score), borderRadius: 4 }} />
                  </div>
                  {eng.reasons.map((r, i) => <ReasonRow key={i} {...r} />)}
                </>
              )}
            </div>

            {/* Real team/release signals — not estimates */}
            {eng && eng !== 'error' && (
              <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
                <StatBlock icon={<UsersIcon size={13} color="var(--text3)" />} label={eng.signals.contributorCount === 100 ? 'contributors (100+)' : 'contributors'} value={eng.signals.contributorCount ?? '—'} />
                <StatBlock icon={<CheckIcon size={13} color="var(--text3)" />} label="tagged releases" value={eng.signals.releaseCount} />
                <StatBlock icon={<CalendarIcon size={13} color="var(--text3)" />} label="repo age" value={`${Math.max(1, Math.round((Date.now() - new Date(eng.signals.createdAt)) / 31536000000))}y`} />
              </div>
            )}

            {/* Architecture (heuristic, labeled as such) */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Architecture (from topics &amp; language)</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, margin: 0 }}>{archBlurb}</p>
              {repo.isArchived && <p style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8, fontWeight: 600 }}>Archived — no longer actively maintained.</p>}
            </div>

            {/* Explicitly unavailable, rather than fabricated */}
            <div style={{ marginBottom: 16 }}>
              <Unavailable label="Complexity" />
              <Unavailable label="Coupling / duplicate code" />
              <Unavailable label="Design patterns used" />
              <Unavailable label="Estimated time invested" />
            </div>

            {/* Important files — real, from the root listing */}
            {eng && eng !== 'error' && eng.signals.rootFiles.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Important Files (root)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {eng.signals.rootFiles.slice(0, 14).map(f => (
                    <span key={f} style={{ fontSize: 11.5, color: 'var(--text3)', background: 'var(--bg2)', borderRadius: 6, padding: '3px 8px', fontFamily: 'monospace' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights — reuses the same provider cascade as "Roast Me", degrades honestly */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>AI Insights</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button onClick={() => runAI('explain')} disabled={aiLoading} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text2)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: aiLoading ? 'wait' : 'pointer', fontFamily: 'Inter,sans-serif' }}>Explain this repository</button>
                <button onClick={() => runAI('readme')} disabled={aiLoading} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text2)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: aiLoading ? 'wait' : 'pointer', fontFamily: 'Inter,sans-serif' }}>Suggest README improvements</button>
              </div>
              {aiLoading && <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>Thinking…</div>}
              {aiError && <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>{aiError}</div>}
              {aiText && <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>{aiText}</div>}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
