// VSBattle.jsx — the Comparison Card. Kept the filename for a smaller diff.
// This version leans back into some visual drama (VS header, animated
// counters, a winner crown with a soft glow, a brief contained confetti
// burst) per the brief — but stops short of the old rarity/pack/trading-card
// aesthetic that was deliberately removed a few rounds back. The difference:
// nothing here is fictional. The crown and confetti celebrate a REAL,
// already-computed win count; nothing is randomly rolled or invented.
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { calcWinner } from '../lib/winner.js'
import { fmt } from '../lib/utils.js'
import { templateVerdict, generateVerdict } from '../lib/aiCopy.js'
import { CountUp } from './MotionUI.jsx'
import { TrophyIcon } from './Icons.jsx'

// One contained confetti burst near the crown — not a screen-covering
// explosion, just a celebratory flourish, and only plays once on mount.
function CrownBurst() {
  return (
    <div style={{ position: 'absolute', inset: -20, pointerEvents: 'none', overflow: 'visible' }}>
      {Array.from({ length: 14 }).map((_, i) => {
        const ang = (360 / 14) * i
        return (
          <motion.span key={i}
            initial={{ opacity: 1, x: 0, y: 0 }}
            animate={{ opacity: 0, x: Math.cos(ang * Math.PI / 180) * 46, y: Math.sin(ang * Math.PI / 180) * 46 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            style={{ position: 'absolute', left: '50%', top: '50%', width: 4, height: 4, borderRadius: '50%', background: i % 2 ? 'var(--gold, #f5c842)' : 'var(--br3)' }}
          />
        )
      })}
    </div>
  )
}

function HeadToHead({ label, v1, v2, delay }) {
  const win = v1 === v2 ? 0 : v1 > v2 ? 1 : 2
  const total = (v1 + v2) || 1
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}
      style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'center' }}>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: win === 1 ? 'var(--br2)' : 'var(--text3)' }}><CountUp value={v1} duration={0.6} format={n => fmt(Math.round(n))} /></span>
        </div>
        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: win === 2 ? 'var(--br2)' : 'var(--text3)' }}><CountUp value={v2} duration={0.6} format={n => fmt(Math.round(n))} /></span>
        </div>
      </div>
      <div style={{ display: 'flex', height: 4, borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
        <motion.div initial={{ width: '50%' }} animate={{ width: `${(v1 / total) * 100}%` }} transition={{ duration: 0.6, delay }} style={{ background: win === 1 ? 'var(--br2)' : 'var(--border2)' }} />
        <div style={{ flex: 1, background: win === 2 ? 'var(--br2)' : 'var(--border2)' }} />
      </div>
    </motion.div>
  )
}

export function VSBattle({ data1, data2 }) {
  const { metrics, wins1, wins2, winner } = calcWinner(data1, data2)
  const winnerData = winner === 'user1' ? data1 : winner === 'user2' ? data2 : null

  const [verdict, setVerdict] = useState({ text: templateVerdict(data1, data2, winner, wins1, wins2), aiGenerated: false })
  useEffect(() => {
    let cancelled = false
    generateVerdict(data1, data2, metrics, winner, wins1, wins2).then(res => { if (!cancelled) setVerdict(res) })
    return () => { cancelled = true }
  }, [data1.user.login, data2.user.login])

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '26px 22px' }}>
      {/* VS header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
        {[data1, data2].map((d, i) => {
          const isWinner = winnerData?.user.login === d.user.login
          return (
            <React.Fragment key={d.user.login}>
              {i === 1 && <div style={{ fontSize: 22, fontWeight: 900, fontStyle: 'italic', color: 'var(--text4)' }}>VS</div>}
              <motion.div
                initial={{ opacity: 0, x: i === 0 ? -24 : 24 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}
              >
                {isWinner && <CrownBurst />}
                <div style={{ position: 'relative' }}>
                  {d.user.avatar_url && (
                    <img src={d.user.avatar_url} alt="" style={{
                      width: 56, height: 56, borderRadius: '50%',
                      border: `2px solid ${isWinner ? 'var(--gold, #f5c842)' : 'var(--border)'}`,
                      boxShadow: isWinner ? '0 0 18px rgba(245,200,66,0.45)' : 'none',
                    }} />
                  )}
                  {isWinner && (
                    <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                      style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)' }}>
                      <TrophyIcon size={16} color="var(--gold, #f5c842)" />
                    </motion.div>
                  )}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>@{d.user.login}</span>
              </motion.div>
            </React.Fragment>
          )
        })}
      </div>

      {/* Head-to-head cards */}
      <div style={{ maxWidth: 340, margin: '0 auto 16px' }}>
        {metrics.map((m, i) => (
          <HeadToHead key={m.key} label={m.label} v1={m.v1} v2={m.v2} delay={i * 0.04} />
        ))}
      </div>

      {/* AI Verdict */}
      <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
        {verdict.aiGenerated && <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>AI Verdict</div>}
        <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{verdict.text}</p>
      </div>
      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text4)' }}>
        Based on public GitHub activity — not a hiring signal.
      </div>
    </div>
  )
}
