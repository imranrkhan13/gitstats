import React, { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, Cell
} from 'recharts'
import { XIcon, FireIcon, StarIcon, RepoIcon, UsersIcon, TrophyIcon, CopyIcon, DownloadIcon, GithubIcon, CheckIcon, ForkIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'
import { fmt, scoreColor, scoreLabel } from '../lib/utils.js'
import { calcWinner } from '../lib/winner.js'

// ─── Grab card DOM → canvas → do stuff ───────────────────────────────────────
async function cardToCanvas(el) {
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
  })
}

// ─── Profile Card (single user) ──────────────────────────────────────────────
function ProfileCard({ data, cardRef }) {
  const { user, totalStars, nonForkCount, streak, longestStreak, score, languages, radarData, monthlyCommits } = data
  const initials = (user.name||user.login).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const col = scoreColor(score)

  return (
    <div ref={cardRef} style={{
      background: 'linear-gradient(145deg,#1e0c04 0%,#2d1608 55%,#160804 100%)',
      borderRadius: 20, padding: '26px 24px', color: '#fff',
      fontFamily: 'Inter,sans-serif', width: 420,
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    }}>
      {/* Brand strip */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:24, height:24, borderRadius:7, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <GithubIcon size={14} color="#fff"/>
          </div>
          <span style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,0.75)', letterSpacing:'-0.01em' }}>{BRAND.appName}</span>
        </div>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.22)', letterSpacing:'0.03em' }}>github.com/{user.login}</span>
      </div>

      {/* Avatar + name + score badge */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:22 }}>
        <div style={{ width:62, height:62, borderRadius:'50%', overflow:'hidden', border:'2.5px solid rgba(255,255,255,0.15)', flexShrink:0, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800 }}>
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" crossOrigin="anonymous" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : initials}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.025em', lineHeight:1.15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name||user.login}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:3 }}>@{user.login}</div>
          {user.bio && <div style={{ fontSize:11, color:'rgba(255,255,255,0.26)', marginTop:4, display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden', lineHeight:1.4 }}>{user.bio}</div>}
        </div>
        <div style={{ textAlign:'center', background:'rgba(255,255,255,0.07)', borderRadius:14, padding:'12px 16px', flexShrink:0, border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:34, fontWeight:900, color:col, lineHeight:1, letterSpacing:'-0.04em' }}>{score}</div>
          <div style={{ fontSize:9, color:col, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3, fontWeight:700 }}>{scoreLabel(score)}</div>
        </div>
      </div>

      {/* 4 stat tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
        {[
          [<RepoIcon size={12} color="#f5c842"/>, nonForkCount, 'Repos'],
          [<StarIcon size={12} color="#f5c842"/>, fmt(totalStars), 'Stars'],
          [<FireIcon size={12} color="#fb923c"/>, streak+'d', 'Streak'],
          [<UsersIcon size={12} color="#f5c842"/>, fmt(user.followers), 'Followers'],
        ].map(([ic,val,lbl]) => (
          <div key={lbl} style={{ background:'rgba(255,255,255,0.065)', borderRadius:11, padding:'12px 6px', textAlign:'center', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>{ic}</div>
            <div style={{ fontSize:19, fontWeight:900, color:'#f5c842', lineHeight:1, letterSpacing:'-0.02em' }}>{val}</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.32)', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:3 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Commit mini-chart */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:7 }}>12-month activity</div>
        <div style={{ height:46 }}>
          <ResponsiveContainer width="100%" height={46}>
            <BarChart data={monthlyCommits} margin={{ top:0, right:0, bottom:0, left:0 }} barCategoryGap="22%">
              <Bar dataKey="commits" radius={[2,2,0,0]}>
                {monthlyCommits.map((_,i) => <Cell key={i} fill={i===monthlyCommits.length-1?'#f5c842':`rgba(255,255,255,${0.06+(i/monthlyCommits.length)*0.26})`}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:4 }}>Skill profile</div>
        <div style={{ height:130 }}>
          <ResponsiveContainer width="100%" height={130}>
            <RadarChart data={radarData} margin={{ top:4, right:24, bottom:4, left:24 }}>
              <PolarGrid stroke="rgba(255,255,255,0.07)"/>
              <PolarAngleAxis dataKey="subject" tick={{ fontSize:9, fill:'rgba(255,255,255,0.38)', fontFamily:'Inter,sans-serif', fontWeight:500 }}/>
              <Radar dataKey="A" stroke="#f5c842" fill="#f5c842" fillOpacity={0.15} strokeWidth={1.5} dot={{ fill:'#f5c842', r:2.5, stroke:'none' }}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Language chips */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:16 }}>
        {languages.slice(0,6).map(l => (
          <span key={l.name} style={{ fontSize:11, padding:'4px 10px', borderRadius:20, background:l.color+'22', border:`1px solid ${l.color}3a`, color:l.color, fontWeight:600 }}>{l.name}</span>
        ))}
      </div>

      {/* Streak row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
        <div style={{ background:'rgba(249,115,22,0.11)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:11, padding:'12px 14px' }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4, display:'flex', alignItems:'center', gap:5 }}><FireIcon size={9} color="rgba(255,255,255,0.3)"/>Current streak</div>
          <div style={{ fontSize:26, fontWeight:900, color:'#fb923c', letterSpacing:'-0.03em' }}>{streak} <span style={{ fontSize:13, fontWeight:600 }}>days</span></div>
        </div>
        <div style={{ background:'rgba(245,200,66,0.07)', border:'1px solid rgba(245,200,66,0.14)', borderRadius:11, padding:'12px 14px' }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4, display:'flex', alignItems:'center', gap:5 }}><TrophyIcon size={9} color="rgba(255,255,255,0.3)"/>Longest streak</div>
          <div style={{ fontSize:26, fontWeight:900, color:'#f5c842', letterSpacing:'-0.03em' }}>{longestStreak} <span style={{ fontSize:13, fontWeight:600 }}>days</span></div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.22)' }}>
          Made by <span style={{ color:'rgba(255,255,255,0.55)', fontWeight:700 }}>{BRAND.madeBy}</span>
        </div>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:500 }}>🌐 {BRAND.website}</span>
      </div>
    </div>
  )
}

// ─── Compare Card (two users) ─────────────────────────────────────────────────
function CompareCard({ data1, data2, cardRef }) {
  const u1 = data1.user, u2 = data2.user
  // Use the SAME winner logic as CompareView
  const { metrics, wins1, wins2, winner } = calcWinner(data1, data2)
  const radarCombo = data1.radarData.map((d,i) => ({ subject:d.subject, A:d.A, B:data2.radarData[i]?.A||0 }))

  const winnerName = winner === 'user1' ? (u1.name||u1.login) : winner === 'user2' ? (u2.name||u2.login) : null
  const winnerScore = winner === 'user1' ? wins1 : wins2
  const loserScore  = winner === 'user1' ? wins2 : wins1

  return (
    <div ref={cardRef} style={{
      background: 'linear-gradient(145deg,#1e0c04 0%,#2d1608 55%,#160804 100%)',
      borderRadius: 20, padding: '26px 24px', color: '#fff',
      fontFamily: 'Inter,sans-serif', width: 420,
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    }}>
      {/* Brand */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:24, height:24, borderRadius:7, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}><GithubIcon size={14} color="#fff"/></div>
          <span style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,0.75)', letterSpacing:'-0.01em' }}>{BRAND.appName}</span>
        </div>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.22)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Developer Battle</span>
      </div>

      {/* Two profiles */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 48px 1fr', gap:10, alignItems:'center', marginBottom:18 }}>
        {[
          { d:data1, u:u1, iw:winner==='user1' },
          { d:data2, u:u2, iw:winner==='user2' },
        ].map(({ d, u, iw }) => (
          <div key={u.login} style={{ textAlign:'center' }}>
            <div style={{ position:'relative', display:'inline-block', marginBottom:8 }}>
              <div style={{ width:54, height:54, borderRadius:'50%', overflow:'hidden', border:`2.5px solid ${iw?'#f5c842':'rgba(255,255,255,0.15)'}`, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, margin:'0 auto' }}>
                {u.avatar_url ? <img src={u.avatar_url} alt="" crossOrigin="anonymous" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : (u.name||u.login)[0].toUpperCase()}
              </div>
              {iw && (
                <div style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#f5c842', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <TrophyIcon size={10} color="#3d2010"/>
                </div>
              )}
            </div>
            <div style={{ fontSize:13, fontWeight:800, color:iw?'#f5c842':'rgba(255,255,255,0.82)', lineHeight:1.2, marginBottom:2 }}>{u.name||u.login}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:6 }}>@{u.login}</div>
            <div style={{ fontSize:22, fontWeight:900, color:scoreColor(d.score), letterSpacing:'-0.03em', lineHeight:1 }}>{d.score}</div>
            <div style={{ fontSize:9, color:scoreColor(d.score), textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700, marginTop:2 }}>{scoreLabel(d.score)}</div>
          </div>
        ))}
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:18, fontWeight:900, color:'rgba(255,255,255,0.28)', marginBottom:6 }}>VS</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontWeight:600 }}>{wins1}-{wins2}</div>
        </div>
      </div>

      {/* Winner banner */}
      {winner !== 'tie' && (
        <div style={{ background:'rgba(245,200,66,0.1)', border:'1px solid rgba(245,200,66,0.22)', borderRadius:11, padding:'10px 14px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <TrophyIcon size={13} color="#f5c842"/>
          <span style={{ fontSize:13, fontWeight:800, color:'#f5c842' }}>{winnerName} wins {winnerScore}–{loserScore}</span>
        </div>
      )}
      {winner === 'tie' && (
        <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:11, padding:'10px 14px', marginBottom:18, textAlign:'center' }}>
          <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.6)' }}>Perfectly matched — it's a tie!</span>
        </div>
      )}

      {/* Metric bars — only show non-tie ones prominently */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:10 }}>Head-to-head ({metrics.length} metrics)</div>
        {metrics.map(({ key, label, v1, v2, higherBetter }) => {
          const total = (v1 + v2) || 1
          const pct = Math.round(v1/total*100)
          const w1 = higherBetter ? v1 > v2 : v1 < v2
          const w2 = higherBetter ? v2 > v1 : v2 < v1
          const tie = v1 === v2
          return (
            <div key={key} style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                <span style={{ fontWeight:w1?700:400, color:w1?'#f5c842':tie?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.38)' }}>{typeof v1==='number'&&v1>=1000?fmt(v1):v1}</span>
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:'0.05em', alignSelf:'center' }}>{label}{tie?' (tie)':''}</span>
                <span style={{ fontWeight:w2?700:400, color:w2?'#c88040':tie?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.38)' }}>{typeof v2==='number'&&v2>=1000?fmt(v2):v2}</span>
              </div>
              <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.06)', overflow:'hidden', display:'flex' }}>
                {tie ? (
                  <div style={{ width:'100%', height:'100%', background:'rgba(255,255,255,0.15)', borderRadius:3 }}/>
                ) : (
                  <>
                    <div style={{ width:pct+'%', height:'100%', background:w1?'#f5c842':'rgba(255,255,255,0.15)', borderRadius:'3px 0 0 3px', transition:'width 0.8s ease' }}/>
                    <div style={{ flex:1, height:'100%', background:w2?'#c88040':'rgba(255,255,255,0.05)', borderRadius:'0 3px 3px 0' }}/>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dual radar */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:8 }}>Skill comparison</div>
        <div style={{ display:'flex', gap:14, marginBottom:6 }}>
          {[{ u:u1, col:'#f5c842' },{ u:u2, col:'#c88040' }].map(({ u, col }) => (
            <div key={u.login} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:12, height:3, borderRadius:2, background:col }}/>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.42)' }}>{u.login}</span>
            </div>
          ))}
        </div>
        <div style={{ height:130 }}>
          <ResponsiveContainer width="100%" height={130}>
            <RadarChart data={radarCombo} margin={{ top:4, right:24, bottom:4, left:24 }}>
              <PolarGrid stroke="rgba(255,255,255,0.07)"/>
              <PolarAngleAxis dataKey="subject" tick={{ fontSize:9, fill:'rgba(255,255,255,0.34)', fontFamily:'Inter,sans-serif' }}/>
              <Radar dataKey="A" stroke="#f5c842" fill="#f5c842" fillOpacity={0.14} strokeWidth={1.5} dot={{ fill:'#f5c842', r:2.5, stroke:'none' }}/>
              <Radar dataKey="B" stroke="#c88040" fill="#c88040" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3" dot={{ fill:'#c88040', r:2, stroke:'none' }}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.22)' }}>
          Made by <span style={{ color:'rgba(255,255,255,0.55)', fontWeight:700 }}>{BRAND.madeBy}</span>
        </div>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:500 }}>🌐 {BRAND.website}</span>
      </div>
    </div>
  )
}

// ─── Main ShareCard modal ─────────────────────────────────────────────────────
export function ShareCard({ data, data2=null, show, onClose }) {
  const cardRef  = useRef(null)
  const [status, setStatus] = useState('idle') // idle | rendering | done-download | done-copy | done-link | error
  const [errorMsg, setErrorMsg] = useState('')
  if (!show) return null
  const isCompare = !!data2

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
    } catch(e) {
      setErrorMsg(e.message); setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
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
        } catch(e) {
          // Clipboard image API not supported — fall back to download
          const link = document.createElement('a')
          link.download = `gitstatus-${data.user.login}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
          setStatus('done-download')
          setTimeout(() => setStatus('idle'), 3000)
        }
      }, 'image/png')
    } catch(e) {
      setErrorMsg(e.message); setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
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
    } catch(e) {
      setErrorMsg('Could not copy: ' + url); setStatus('error')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  const isRendering = status === 'rendering'
  const btnBase = { flex:1, height:44, display:'flex', alignItems:'center', justifyContent:'center', gap:8, border:'1px solid rgba(255,255,255,0.14)', borderRadius:11, fontSize:13, fontWeight:600, cursor:isRendering?'wait':'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.2s', background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.75)' }

  const BtnIcon = ({ type }) => {
    if (isRendering) return <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
    if (type === 'download' && status === 'done-download') return <CheckIcon size={14} color="#4ade80"/>
    if (type === 'copy'     && status === 'done-copy')     return <CheckIcon size={14} color="#4ade80"/>
    if (type === 'link'     && status === 'done-link')     return <CheckIcon size={14} color="#4ade80"/>
    if (type === 'download') return <DownloadIcon size={14} color="rgba(255,255,255,0.75)"/>
    if (type === 'copy')     return <CopyIcon size={14} color="rgba(255,255,255,0.75)"/>
    if (type === 'link')     return <CopyIcon size={14} color="rgba(255,255,255,0.75)"/>
    return null
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(8,3,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(14px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:500, maxHeight:'92vh', overflowY:'auto', animation:'scaleIn 0.28s cubic-bezier(0.22,1,0.36,1)' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{isCompare ? 'Battle Card' : 'GitHub Card'}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Download as image, copy to clipboard, or share a link</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:12 }}>
            <XIcon size={15} color="#fff"/>
          </button>
        </div>

        {/* Card preview */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          {isCompare
            ? <CompareCard data1={data} data2={data2} cardRef={cardRef}/>
            : <ProfileCard data={data} cardRef={cardRef}/>}
        </div>

        {/* 3 action buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
          <button onClick={handleDownload} disabled={isRendering} style={{ ...btnBase, ...(status==='done-download'?{background:'rgba(74,222,128,0.15)',borderColor:'rgba(74,222,128,0.35)',color:'#4ade80'}:{}) }}>
            <BtnIcon type="download"/>
            {status==='done-download'?'Saved!':isRendering?'Working…':'Download'}
          </button>
          <button onClick={handleCopyImage} disabled={isRendering} style={{ ...btnBase, ...(status==='done-copy'?{background:'rgba(74,222,128,0.15)',borderColor:'rgba(74,222,128,0.35)',color:'#4ade80'}:{}) }}>
            <BtnIcon type="copy"/>
            {status==='done-copy'?'Copied!':isRendering?'Working…':'Copy Image'}
          </button>
          <button onClick={handleCopyLink} disabled={isRendering} style={{ ...btnBase, ...(status==='done-link'?{background:'rgba(74,222,128,0.15)',borderColor:'rgba(74,222,128,0.35)',color:'#4ade80'}:{}) }}>
            <BtnIcon type="link"/>
            {status==='done-link'?'Copied!':'Copy Link'}
          </button>
        </div>

        {status === 'error' && (
          <div style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:9, padding:'10px 14px', fontSize:12, color:'#fca5a5', marginBottom:10 }}>
            {errorMsg}
          </div>
        )}

        {/* Branding */}
        <p style={{ fontSize:11, color:'rgba(255,255,255,0.22)', textAlign:'center', lineHeight:1.65 }}>
          Built by <a href={BRAND.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color:'rgba(255,255,255,0.5)', textDecoration:'none', fontWeight:700 }}>{BRAND.madeBy}</a>
          {' · '}
          <a href={BRAND.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color:'#f5c842', textDecoration:'none', fontWeight:600 }}>{BRAND.website}</a>
        </p>
      </div>
    </div>
  )
}
