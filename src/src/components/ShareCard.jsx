// ShareCard.jsx — GitStatus
// Changes vs original:
//  • Removed contribGrid / Heatmap (no longer in data)
//  • monthlyCommits can be any length (real data only) — adapts gracefully
//  • Added Twitter/X share button
//  • Added LinkedIn share button
//  • Added "Copy stats as text" button
//  • Added achievement badges on the profile card (top streaker, most starred, etc.)
//  • Commit bar chart shows "real push events" label, handles empty array

import React, { useState, useRef, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, Cell
} from 'recharts'
import {
  XIcon, FireIcon, StarIcon, RepoIcon, UsersIcon, TrophyIcon,
  CopyIcon, DownloadIcon, GithubIcon, CheckIcon, ForkIcon, ShareIcon
} from './Icons.jsx'
import { BRAND } from '../lib/brand.js'
import { fmt, scoreColor, scoreLabel } from '../lib/utils.js'
import { calcWinner } from '../lib/winner.js'
import { buildStory } from '../lib/narrative.js'
import { MagneticButton } from './MotionUI.jsx'
import { ProfileCard } from './ProfileCard.jsx'

async function cardToCanvas(el) {
  return html2canvas(el, {
    scale: 2, useCORS: true, allowTaint: true,
    backgroundColor: null, logging: false,
  })
}

// ── Achievement badges ────────────────────────────────────────────────────────
function getBadges(data) {
  const badges = []
  if (data.score >= 88) badges.push({ icon: '🏆', label: 'Elite Dev' })
  if (data.streak >= 30) badges.push({ icon: '🔥', label: '30d Streak' })
  if (data.totalStars >= 1000) badges.push({ icon: '⭐', label: '1k+ Stars' })
  if (data.nonForkCount >= 50) badges.push({ icon: '📦', label: '50+ Repos' })
  if (data.user.followers >= 500) badges.push({ icon: '👥', label: '500+ Fans' })
  if (data.languages?.length >= 8) badges.push({ icon: '🌐', label: 'Polyglot' })
  if (data.totalForks >= 500) badges.push({ icon: '🍴', label: '500+ Forks' })
  return badges.slice(0, 4)
}

// ── Profile Card is now imported from ./ProfileCard.jsx (the minimal, non-gaming version) ──

// ── Compare Card ──────────────────────────────────────────────────────────────
function CompareCard({ data1, data2, cardRef }) {
  const u1 = data1.user, u2 = data2.user
  const { metrics, wins1, wins2, winner } = calcWinner(data1, data2)
  const radarCombo = data1.radarData.map((d, i) => ({ subject: d.subject, A: d.A, B: data2.radarData[i]?.A || 0 }))
  const winnerName = winner === 'user1' ? (u1.name || u1.login) : winner === 'user2' ? (u2.name || u2.login) : null
  const winnerScore = winner === 'user1' ? wins1 : wins2
  const loserScore = winner === 'user1' ? wins2 : wins1

  return (
    <div ref={cardRef} style={{
      background: 'linear-gradient(145deg,#1e0c04 0%,#2d1608 55%,#160804 100%)',
      borderRadius: 20, padding: '26px 24px', color: '#fff',
      fontFamily: 'Inter,sans-serif', width: 420,
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GithubIcon size={14} color="#fff" /></div>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.75)', letterSpacing: '-0.01em' }}>{BRAND.appName}</span>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Developer Comparison</span>
      </div>

      {/* Two profiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', gap: 10, alignItems: 'center', marginBottom: 18 }}>
        {[{ d: data1, u: u1, iw: winner === 'user1' }, { d: data2, u: u2, iw: winner === 'user2' }].map(({ d, u, iw }) => (
          <div key={u.login} style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${iw ? '#f5c842' : 'rgba(255,255,255,0.15)'}`, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, margin: '0 auto' }}>
                {u.avatar_url ? <img src={u.avatar_url} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.name || u.login)[0].toUpperCase()}
              </div>
              {iw && (
                <div style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#f5c842', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrophyIcon size={10} color="#3d2010" />
                </div>
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: iw ? '#f5c842' : 'rgba(255,255,255,0.82)', lineHeight: 1.2, marginBottom: 2 }}>{u.name || u.login}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>@{u.login}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: scoreColor(d.score), letterSpacing: '-0.03em', lineHeight: 1 }}>{d.score}</div>
            <div style={{ fontSize: 9, color: scoreColor(d.score), textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginTop: 2 }}>{scoreLabel(d.score)}</div>
          </div>
        ))}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.28)', marginBottom: 6 }}>VS</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{wins1}-{wins2}</div>
        </div>
      </div>

      {/* Winner banner */}
      {winner !== 'tie' ? (
        <div style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.22)', borderRadius: 11, padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <TrophyIcon size={13} color="#f5c842" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#f5c842' }}>{winnerName} wins {winnerScore}–{loserScore}</span>
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, padding: '10px 14px', marginBottom: 18, textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Perfectly matched — it's a tie!</span>
        </div>
      )}

      {/* Metric bars */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Head-to-head ({metrics.length} metrics)</div>
        {metrics.map(({ key, label, v1, v2, higherBetter }) => {
          const total = (v1 + v2) || 1, pct = Math.round(v1 / total * 100)
          const w1 = higherBetter ? v1 > v2 : v1 < v2, w2 = higherBetter ? v2 > v1 : v2 < v1, tie = v1 === v2
          return (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ fontWeight: w1 ? 700 : 400, color: w1 ? '#f5c842' : tie ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.38)' }}>{typeof v1 === 'number' && v1 >= 1000 ? fmt(v1) : v1}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'center' }}>{label}{tie ? ' (tie)' : ''}</span>
                <span style={{ fontWeight: w2 ? 700 : 400, color: w2 ? '#c88040' : tie ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.38)' }}>{typeof v2 === 'number' && v2 >= 1000 ? fmt(v2) : v2}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
                {tie ? (
                  <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.15)', borderRadius: 3 }} />
                ) : (
                  <>
                    <div style={{ width: pct + '%', height: '100%', background: w1 ? '#f5c842' : 'rgba(255,255,255,0.15)', borderRadius: '3px 0 0 3px', transition: 'width 0.8s ease' }} />
                    <div style={{ flex: 1, height: '100%', background: w2 ? '#c88040' : 'rgba(255,255,255,0.05)', borderRadius: '0 3px 3px 0' }} />
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dual radar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Skill comparison</div>
        <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
          {[{ u: u1, col: '#f5c842' }, { u: u2, col: '#c88040' }].map(({ u, col }) => (
            <div key={u.login} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, background: col }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)' }}>{u.login}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 130 }}>
          <ResponsiveContainer width="100%" height={130}>
            <RadarChart data={radarCombo} margin={{ top: 4, right: 24, bottom: 4, left: 24 }}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.34)', fontFamily: 'Inter,sans-serif' }} />
              <Radar dataKey="A" stroke="#f5c842" fill="#f5c842" fillOpacity={0.14} strokeWidth={1.5} dot={{ fill: '#f5c842', r: 2.5, stroke: 'none' }} />
              <Radar dataKey="B" stroke="#c88040" fill="#c88040" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3" dot={{ fill: '#c88040', r: 2, stroke: 'none' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
          Made by <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{BRAND.madeBy}</span>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>🌐 {BRAND.website}</span>
      </div>
    </div>
  )
}

// ── Build plain-text stats summary ────────────────────────────────────────────
function buildStatsText(data, data2 = null) {
  const u = data.user
  if (data2) {
    const u2 = data2.user
    const { wins1, wins2, winner } = calcWinner(data, data2)
    const winnerName = winner === 'user1' ? u.login : winner === 'user2' ? u2.login : 'tie'
    return [
      `GitHub comparison: @${u.login} vs @${u2.login}`,
      ``,
      `@${u.login}: Score ${data.score} | ${data.totalStars}⭐ | ${data.nonForkCount} repos | ${u.followers} followers | ${data.streak}d streak`,
      `@${u2.login}: Score ${data2.score} | ${data2.totalStars}⭐ | ${data2.nonForkCount} repos | ${u2.followers} followers | ${data2.streak}d streak`,
      ``,
      `Result: ${winner === 'tie' ? '🤝 Tie!' : '🏆 ' + winnerName + ' wins ' + Math.max(wins1, wins2) + '-' + Math.min(wins1, wins2)}`,
      ``,
      `Via ${BRAND.appName} · ${BRAND.websiteUrl}`,
    ].join('\n')
  }
  const badges = getBadges(data)
  return [
    `📊 My GitHub Stats via ${BRAND.appName}`,
    ``,
    `👤 ${u.name || u.login} (@${u.login})`,
    u.bio ? `💬 ${u.bio}` : null,
    ``,
    `🏆 Dev Score: ${data.score}/100 (${scoreLabel(data.score)})`,
    `⭐ Stars: ${fmt(data.totalStars)}`,
    `📦 Repos: ${data.nonForkCount}`,
    `👥 Followers: ${fmt(u.followers)}`,
    `🔥 Current Streak: ${data.streak} days`,
    `🏅 Best Streak: ${data.longestStreak} days`,
    `🍴 Forks: ${fmt(data.totalForks)}`,
    data.languages?.length ? `💻 Languages: ${data.languages.slice(0, 5).map(l => l.name).join(', ')}` : null,
    badges.length ? `🎖 Achievements: ${badges.map(b => b.icon + ' ' + b.label).join(' · ')}` : null,
    ``,
    `🌐 ${BRAND.websiteUrl}/?user=${u.login}`,
  ].filter(Boolean).join('\n')
}

// ── Main ShareCard modal ──────────────────────────────────────────────────────
export function ShareCard({ data, data2 = null, show, onClose }) {
  const cardRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  // Mount/unmount is controlled by the parent via AnimatePresence (App.jsx / CompareView.jsx)
  // so the exit animation below actually gets to play instead of the component vanishing instantly.
  const isCompare = !!data2

  // Scroll lock + Escape-to-close. Runs once per mount (this component is only
  // ever mounted while the modal is open — see App.jsx / CompareView.jsx — so
  // "on mount" and "on close" line up with "modal opens" / "modal closes").
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const canNativeShareFiles = typeof navigator !== 'undefined' && !!navigator.canShare && !!navigator.share

  const handleNativeShare = async () => {
    setStatus('rendering')
    try {
      const canvas = await getCanvas()
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      const filename = isCompare ? `gitstatus-${data.user.login}-vs-${data2.user.login}.png` : `gitstatus-${data.user.login}.png`
      const file = new File([blob], filename, { type: 'image/png' })
      const url = isCompare
        ? `${BRAND.websiteUrl}/?user=${data.user.login}&compare=${data2.user.login}`
        : `${BRAND.websiteUrl}/?user=${data.user.login}`
      const shareData = { files: [file], title: BRAND.appName, text: isCompare ? `GitHub comparison via ${BRAND.appName}` : buildStory(data).repos, url }
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData)
        setStatus('idle')
      } else {
        // Device supports navigator.share but not file attachments — fall back
        // to sharing the link so the person isn't left with a dead button.
        await navigator.share({ title: BRAND.appName, text: shareData.text, url })
        setStatus('idle')
      }
    } catch (e) {
      if (e?.name !== 'AbortError') { setErrorMsg('Could not open the share sheet'); setStatus('error'); setTimeout(() => setStatus('idle'), 4000) }
      else setStatus('idle')
    }
  }

  const getCanvas = async () => {
    const el = cardRef.current
    if (!el) throw new Error('Card not found')
    return cardToCanvas(el)
  }

  const handleDownload = async () => {
    setStatus('rendering')
    try {
      const canvas = await getCanvas()
      const link = document.createElement('a')
      link.download = isCompare
        ? `gitstatus-${data.user.login}-vs-${data2.user.login}.png`
        : `gitstatus-${data.user.login}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setStatus('done-download')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e) { setErrorMsg(e.message); setStatus('error'); setTimeout(() => setStatus('idle'), 4000) }
  }

  const handleCopyImage = async () => {
    setStatus('rendering')
    try {
      const canvas = await getCanvas()
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          setStatus('done-copy')
          setTimeout(() => setStatus('idle'), 3000)
        } catch {
          const link = document.createElement('a')
          link.download = `gitstatus-${data.user.login}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
          setStatus('done-download')
          setTimeout(() => setStatus('idle'), 3000)
        }
      }, 'image/png')
    } catch (e) { setErrorMsg(e.message); setStatus('error'); setTimeout(() => setStatus('idle'), 4000) }
  }

  const handleCopyLink = async () => {
    const url = isCompare
      ? `${BRAND.websiteUrl}/?user=${data.user.login}&compare=${data2.user.login}`
      : `${BRAND.websiteUrl}/?user=${data.user.login}`
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        const ta = document.createElement('textarea')
        ta.value = url; ta.style.cssText = 'position:fixed;opacity:0'
        document.body.appendChild(ta); ta.select()
        document.execCommand('copy'); document.body.removeChild(ta)
      }
      setStatus('done-link')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e) { setErrorMsg('Could not copy: ' + url); setStatus('error'); setTimeout(() => setStatus('idle'), 5000) }
  }

  const handleCopyText = async () => {
    const text = buildStatsText(data, data2)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'
        document.body.appendChild(ta); ta.select()
        document.execCommand('copy'); document.body.removeChild(ta)
      }
      setStatus('done-text')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (e) { setErrorMsg('Copy failed'); setStatus('error'); setTimeout(() => setStatus('idle'), 4000) }
  }

  const handleTwitter = () => {
    const text = isCompare
      ? `GitHub comparison: @${data.user.login} vs @${data2?.user.login} — check it out on ${BRAND.appName}`
      : `${buildStory(data).repos} Check yours on ${BRAND.appName}.`
    const url = isCompare
      ? `${BRAND.websiteUrl}/?user=${data.user.login}&compare=${data2.user.login}`
      : `${BRAND.websiteUrl}/?user=${data.user.login}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const handleLinkedIn = () => {
    const url = isCompare
      ? `${BRAND.websiteUrl}/?user=${data.user.login}&compare=${data2.user.login}`
      : `${BRAND.websiteUrl}/?user=${data.user.login}`
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
  }

  const isRendering = status === 'rendering'

  const BtnIcon = ({ type }) => {
    if (isRendering && ['download', 'copy', 'share'].includes(type)) return <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    const done = status === 'done-download' && type === 'download' || status === 'done-copy' && type === 'copy' || status === 'done-link' && type === 'link' || status === 'done-text' && type === 'text'
    if (done) return <CheckIcon size={14} color="#4ade80" />
    if (type === 'download') return <DownloadIcon size={14} color="rgba(255,255,255,0.75)" />
    if (type === 'copy') return <CopyIcon size={14} color="rgba(255,255,255,0.75)" />
    if (type === 'link') return <CopyIcon size={14} color="rgba(255,255,255,0.75)" />
    if (type === 'text') return <CopyIcon size={14} color="rgba(255,255,255,0.75)" />
    if (type === 'share') return <ShareIcon size={14} color="#150a04" />
    return null
  }

  const btnBase = {
    flex: 1, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, fontSize: 12, fontWeight: 600,
    cursor: isRendering ? 'wait' : 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.2s',
    background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)',
  }
  const doneStyle = { background: 'rgba(74,222,128,0.15)', borderColor: 'rgba(74,222,128,0.35)', color: '#4ade80' }

  return (
    <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.08 } }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,3,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(14px)' }}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 60 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{ width: '100%', maxWidth: 500, maxHeight: '92vh', overflowY: 'auto' }}
      >

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{isCompare ? 'Comparison Card' : 'GitHub Card'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Download, copy, or share your GitHub stats</div>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.08, background: 'rgba(255,255,255,0.18)' }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}
            aria-label="Close"
          >
            <XIcon size={15} color="#fff" />
          </motion.button>
        </div>

        {/* Card preview — scales down visually on narrow screens so the 420px-wide
            card fits without horizontal scrolling. The card's actual DOM width stays
            420px (unchanged) so html2canvas always exports a consistent, correctly-sized image. */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div className="gs-card-scale-inner">
            {isCompare
              ? <CompareCard data1={data} data2={data2} cardRef={cardRef} />
              : <ProfileCard data={data} cardRef={cardRef} />}
          </div>
        </div>
        <style>{`
          @media (max-width: 460px) {
            .gs-card-scale-inner { zoom: 0.82; }
          }
          @media (max-width: 400px) {
            .gs-card-scale-inner { zoom: 0.7; }
          }
          @supports not (zoom: 1) {
            @media (max-width: 460px) {
              .gs-card-scale-inner { transform: scale(0.82); transform-origin: top center; margin-bottom: -18%; }
            }
          }
        `}</style>

        {/* Primary actions */}
        {canNativeShareFiles && (
          <MagneticButton onClick={handleNativeShare} disabled={isRendering} glow="rgba(245,200,66,0.5)"
            style={{ ...btnBase, width: '100%', marginBottom: 8, background: 'var(--br4, #f5c842)', color: '#150a04', borderColor: 'transparent', fontWeight: 800 }}>
            <BtnIcon type="share" />
            {isRendering ? 'Preparing…' : 'Share Image…'}
          </MagneticButton>
        )}
        <div className="rg2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <MagneticButton onClick={handleDownload} disabled={isRendering} glow="rgba(245,200,66,0.4)" style={{ ...btnBase, ...(status === 'done-download' ? doneStyle : {}) }}>
            <BtnIcon type="download" />
            {status === 'done-download' ? 'Saved!' : isRendering ? 'Working…' : 'Download PNG'}
          </MagneticButton>
          <MagneticButton onClick={handleCopyImage} disabled={isRendering} glow="rgba(245,200,66,0.4)" style={{ ...btnBase, ...(status === 'done-copy' ? doneStyle : {}) }}>
            <BtnIcon type="copy" />
            {status === 'done-copy' ? 'Copied!' : isRendering ? 'Working…' : 'Copy Image'}
          </MagneticButton>
        </div>

        <div className="rg2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <button onClick={handleCopyLink} disabled={isRendering} style={{ ...btnBase, ...(status === 'done-link' ? doneStyle : {}) }}>
            <BtnIcon type="link" />
            {status === 'done-link' ? 'Copied!' : 'Copy Link'}
          </button>
          <button onClick={handleCopyText} disabled={isRendering} style={{ ...btnBase, ...(status === 'done-text' ? doneStyle : {}) }}>
            <BtnIcon type="text" />
            {status === 'done-text' ? 'Copied!' : 'Copy as Text'}
          </button>
        </div>

        {/* Social share buttons */}
        <div className="rg2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <button onClick={handleTwitter} style={{ ...btnBase, background: 'rgba(29,161,242,0.12)', borderColor: 'rgba(29,161,242,0.25)', color: '#1da1f2' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1da1f2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.26 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            Share on X
          </button>
          <button onClick={handleLinkedIn} style={{ ...btnBase, background: 'rgba(0,119,181,0.12)', borderColor: 'rgba(0,119,181,0.25)', color: '#0077b5' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#0077b5"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" fill="#0077b5" /></svg>
            Share on LinkedIn
          </button>
        </div>

        {status === 'error' && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#fca5a5', marginBottom: 10 }}>
            {errorMsg}
          </div>
        )}

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', textAlign: 'center', lineHeight: 1.65 }}>
          Built by <a href={BRAND.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 700 }}>{BRAND.madeBy}</a>
          {' · '}
          <a href={BRAND.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#f5c842', textDecoration: 'none', fontWeight: 600 }}>{BRAND.website}</a>
        </p>
      </motion.div>
    </motion.div>
  )
}