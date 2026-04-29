import React, { useState } from 'react'
import { CONTRIB_COLORS } from '../lib/constants.js'
import { scoreColor, scoreLabel } from '../lib/utils.js'

export function Spinner({ size=20, color='var(--br2)' }) {
  return <div style={{ width:size, height:size, border:`2px solid var(--border2)`, borderTopColor:color, borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block', flexShrink:0 }}/>
}

export function ScoreRing({ score, size=84 }) {
  const r = (size/2)-7, c = 2*Math.PI*r, f = (Math.min(score,100)/100)*c
  const col = scoreColor(score), lbl = scoreLabel(score)
  return (
    <div style={{ textAlign:'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg2)" strokeWidth={6.5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={6.5}
          strokeDasharray={`${f.toFixed(1)} ${(c-f).toFixed(1)}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition:'stroke-dasharray 1.4s cubic-bezier(0.22,1,0.36,1)' }}/>
        <text x={size/2} y={size/2+6} textAnchor="middle" fontSize={21} fontWeight={900} fill={col} fontFamily="Inter,sans-serif">{score}</text>
      </svg>
      <div style={{ fontSize:10, fontWeight:700, color:col, textTransform:'uppercase', letterSpacing:'0.07em', marginTop:2 }}>{lbl}</div>
    </div>
  )
}

export function Heatmap({ grid }) {
  const [hovered, setHovered] = useState(null)
  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(52,minmax(9px,1fr))', gap:2.5, minWidth:500 }}>
        {grid.map((l, i) => (
          <div key={i} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
            style={{ aspectRatio:'1', borderRadius:2.5, background:CONTRIB_COLORS[l], transform:hovered===i?'scale(1.6)':'scale(1)', transition:'transform .1s', cursor:'default' }}/>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop:7 }}>
        <span style={{ fontSize:10, color:'var(--text4)' }}>Less</span>
        {CONTRIB_COLORS.map((c,i) => <div key={i} style={{ width:10, height:10, borderRadius:2, background:c }}/>)}
        <span style={{ fontSize:10, color:'var(--text4)' }}>More</span>
      </div>
    </div>
  )
}

export function Card({ children, style={}, className='' }) {
  return <div className={className} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'20px', boxShadow:'var(--shadow)', ...style }}>{children}</div>
}

export function SectionLabel({ children, right }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <span style={{ fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:'0.07em', textTransform:'uppercase' }}>{children}</span>
      {right && <div style={{ flexShrink:0 }}>{right}</div>}
    </div>
  )
}

export function StatCard({ label, value, sub, icon, dark=false, className='' }) {
  return (
    <div className={`animate-fade-up ${className}`}
      style={{ background:dark?'var(--br)':'var(--surface)', border:`1px solid ${dark?'transparent':'var(--border)'}`, borderRadius:'var(--r2)', padding:'16px 18px', boxShadow:'var(--shadow)', transition:'transform 0.15s,box-shadow 0.15s', cursor:'default' }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow2)' }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='var(--shadow)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:dark?'rgba(255,255,255,0.45)':'var(--text3)' }}>{label}</span>
        <div style={{ width:30, height:30, borderRadius:9, background:dark?'rgba(255,255,255,0.1)':'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
      </div>
      <div style={{ fontSize:27, fontWeight:900, letterSpacing:'-0.035em', lineHeight:1, color:dark?'var(--gold)':'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize:11, marginTop:6, color:dark?'rgba(255,255,255,0.35)':'var(--text4)' }}>{sub}</div>}
    </div>
  )
}

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:9, padding:'9px 13px', fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight:700, marginBottom:4, color:'var(--text)' }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:p.color||'var(--br2)', flexShrink:0 }}/>
          <span style={{ color:'var(--text3)' }}>{p.name}:</span>
          <span style={{ fontWeight:700, color:'var(--text)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function LangBar({ name, pct, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
      <div style={{ width:9, height:9, borderRadius:'50%', background:color, flexShrink:0 }}/>
      <span style={{ fontSize:13, fontWeight:500, color:'var(--text2)', width:96, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
      <div style={{ flex:1, height:6, background:'var(--bg2)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:3, background:color, width:pct+'%', transition:'width 1.1s cubic-bezier(0.22,1,0.36,1)' }}/>
      </div>
      <span style={{ fontSize:11, color:'var(--text3)', width:30, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{pct}%</span>
    </div>
  )
}

export function InfoPopup({ show, onClose }) {
  if (!show) return null

  const scoreItems = [
    { label:'Repositories (0–25 pts)', color:'var(--blue)',   desc:'Log₂(repos) × 5.2. More original repos = more output. A dev with 10 repos scores ~17pts, 50 repos scores ~25pts.' },
    { label:'Followers (0–22 pts)',     color:'var(--purple)', desc:'Log₁₀(followers) × 9.5. Community recognition. Log-scaled so going from 0→100 followers matters more than 1000→2000.' },
    { label:'Stars (0–25 pts)',         color:'#d97706',       desc:'Log₁₀(totalStars) × 9.5. Real-world impact of your code. A repo with 1k stars gives about the same as ten with 100 stars.' },
    { label:'Forks (0–10 pts)',         color:'var(--br3)',    desc:'Log₁₀(forks) × 5. People building on top of your work — strong signal of useful, reusable code.' },
    { label:'Tenure (0–10 pts)',        color:'var(--green)',  desc:'Years on GitHub × 1.4. Consistency and longevity count. 5 years = 7pts, 7+ years = capped at 10pts.' },
    { label:'Language diversity (0–8 pts)', color:'var(--amber)', desc:'Number of languages × 0.9. Breadth across languages shows versatility. 5 languages = 4.5pts, 9+ = 8pts.' },
  ]

  const streakItems = [
    { label:'What counts as a streak day?', desc:'Any day with a Push, Pull Request, Issue, Create, or Code Review event in your public GitHub activity.' },
    { label:'Where does the data come from?', desc:'GitHub\'s public events API (/users/:login/events/public). We fetch up to 100 recent events — GitHub only keeps ~90 days of events.' },
    { label:'Why might my streak show 0?', desc:'If your last activity was 2+ days ago, or you only have private repo activity (not visible via public API), the streak will show 0.' },
    { label:'Monthly commits', desc:'Real push counts from your public events where available. For months with no event data (older than ~90 days), we show a seeded estimate.' },
  ]

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(10,5,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20, backdropFilter:'blur(8px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--surface)', borderRadius:20, padding:28, width:'100%', maxWidth:540, boxShadow:'0 24px 60px rgba(0,0,0,0.22)', animation:'scaleIn 0.25s cubic-bezier(0.22,1,0.36,1)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--text)', marginBottom:4 }}>How GitStatus works</div>
            <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.55 }}>Everything is transparent — here's exactly what we calculate and how.</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4, marginLeft:16, flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Score */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:3 }}>Dev Score (0–100)</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginBottom:12, lineHeight:1.55 }}>
            A <strong style={{ color:'var(--text)' }}>deterministic formula</strong> — same GitHub profile always gets the same score. No randomness. Six dimensions, each log-scaled to avoid outliers dominating.
          </div>
          {scoreItems.map(({ label, color, desc }) => (
            <div key={label} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0, marginTop:5 }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Streak */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:3 }}>Streak & Activity</div>
          {streakItems.map(({ label, desc }) => (
            <div key={label} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--orange)', flexShrink:0, marginTop:5 }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Compare */}
        <div style={{ background:'var(--bg)', borderRadius:12, padding:'16px', marginBottom:20, border:'1px solid var(--border)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:8 }}>How Comparison Works</div>
          <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>
            We compare <strong>8 metrics</strong> head-to-head: Dev Score, Stars, Repos, Followers, Streak, Forks, Languages, and Avg Stars/Repo. Only <em>strict wins</em> count — ties don't go to either side. The developer who wins more categories wins overall. Built for fun — not a hiring decision.
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ background:'linear-gradient(135deg,var(--bg2) 0%,var(--bg) 100%)', borderRadius:12, padding:'14px 16px', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.65 }}>
            <strong style={{ color:'var(--br2)' }}>Important:</strong> GitHub stats only reflect public activity. Private repos, company work, and contributions to orgs you haven't made public are invisible. A score of 30 doesn't mean a weak engineer — it might mean they do their best work privately.
          </div>
        </div>

        <button onClick={onClose} style={{ width:'100%', height:42, marginTop:18, background:'var(--br)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Got it</button>
      </div>
    </div>
  )
}
