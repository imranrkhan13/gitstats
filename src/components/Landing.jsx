import React, { useState, useRef, useEffect } from 'react'
import { fetchGitHub } from '../lib/github.js'
import { Spinner } from './Atoms.jsx'
import { GithubIcon, FireIcon, StarIcon, ChartIcon, ShareIcon, AwardIcon, CodeIcon, TrendIcon, CompareIcon, ActivityIcon, InfoIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'

const FEATURES = [
  [FireIcon,  '#f97316', 'Streak Tracker',    'See daily contribution streaks'],
  [CodeIcon,  '#3b82f6', 'Language Stats',    'Breakdown of every language used'],
  [StarIcon,  '#d97706', 'Top Repos',         'Sorted by stars, forks, or activity'],
  [CompareIcon,'#8b5cf6','Deep Compare',      '10-metric head-to-head analysis'],
  [ShareIcon, '#6b4020', 'Share Cards',       'Beautiful shareable profile cards'],
  [AwardIcon, '#22c55e', 'Dev Score',         'Deterministic 100-point score'],
  [ChartIcon, '#0ea5e9', 'Commit Charts',     'Monthly trends visualized'],
  [ActivityIcon,'#ef4444','Activity Feed',    'Live public GitHub events'],
]

export function Landing({ onLoad }) {
  const [username, setUsername] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const inputRef = useRef()
  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = async (uname) => {
    const u = (uname || username).trim()
    if (!u) return
    setLoading(true); setError('')
    try { onLoad(await fetchGitHub(u)) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const examples = ['torvalds', 'gaearon', 'sindresorhus', 'yyx990803', 'tj']

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', position:'relative', overflow:'hidden' }}>
      {/* Background blobs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'12%', left:'8%', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle,rgba(245,200,66,0.055) 0%,transparent 70%)', filter:'blur(40px)' }}/>
        <div style={{ position:'absolute', bottom:'18%', right:'6%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(107,64,32,0.07) 0%,transparent 70%)', filter:'blur(36px)' }}/>
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:600, textAlign:'center' }}>
        {/* Logo */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:30 }} className="animate-fade-up d1">
          <div style={{ width:48, height:48, background:'var(--br)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(61,32,16,0.22)' }}>
            <GithubIcon size={26} color="#fff"/>
          </div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:24, fontWeight:900, color:'var(--br)', letterSpacing:'-0.03em', lineHeight:1 }}>{BRAND.appName}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, letterSpacing:'0.03em' }}>{BRAND.tagline}</div>
          </div>
        </div>

        <h1 style={{ fontSize:'clamp(28px,6vw,48px)', fontWeight:900, color:'var(--text)', letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:14 }} className="animate-fade-up d2">
          Your GitHub profile,<br/><span style={{ color:'var(--br2)' }}>beautifully analyzed.</span>
        </h1>

        <p style={{ fontSize:16, color:'var(--text3)', lineHeight:1.65, maxWidth:420, margin:'0 auto 34px' }} className="animate-fade-up d3">
          Stats, streaks, languages, repos — all in one shareable card. Compare developers, share your wins.
        </p>

        {/* Search input */}
        <div className="animate-fade-up d4" style={{ background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'var(--r2)', padding:'5px 5px 5px 16px', display:'flex', gap:8, boxShadow:'0 4px 24px rgba(61,32,16,0.08)', maxWidth:460, margin:'0 auto 12px' }}>
          <div style={{ display:'flex', alignItems:'center', flexShrink:0 }}><GithubIcon size={16} color="var(--text3)"/></div>
          <input ref={inputRef} value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}
            placeholder="Enter any GitHub username…"
            style={{ flex:1, border:'none', background:'transparent', fontSize:15, color:'var(--text)', outline:'none', fontFamily:'Inter,sans-serif', padding:'7px 0' }}/>
          <button onClick={()=>submit()} disabled={loading}
            style={{ height:44, padding:'0 22px', background:'var(--br)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.8:1, display:'flex', alignItems:'center', gap:8, fontFamily:'Inter,sans-serif', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(61,32,16,0.2)', transition:'background 0.2s' }}
            onMouseEnter={e=>{if(!loading)e.currentTarget.style.background='var(--br2)'}}
            onMouseLeave={e=>e.currentTarget.style.background='var(--br)'}>
            {loading ? <Spinner size={16} color="#fff"/> : null}
            {loading ? 'Analyzing…' : 'Analyze →'}
          </button>
        </div>

        {error && <div style={{ color:'var(--red)', fontSize:14, fontWeight:500, marginBottom:12 }} className="animate-fade">⚠ {error}</div>}

        {/* Example buttons */}
        <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginBottom:44 }} className="animate-fade-up d5">
          <span style={{ fontSize:12, color:'var(--text4)', alignSelf:'center' }}>Try:</span>
          {examples.map(u => (
            <button key={u} onClick={()=>submit(u)}
              style={{ fontSize:12, color:'var(--text2)', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:20, padding:'5px 13px', cursor:'pointer', fontFamily:'Inter,sans-serif', fontWeight:500, transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--bg3)';e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='var(--bg2)';e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}>
              @{u}
            </button>
          ))}
        </div>

        {/* Feature grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:8, marginBottom:40, maxWidth:580, margin:'0 auto 40px' }} className="animate-fade-up d6">
          {FEATURES.map(([Icon, color, title, desc]) => (
            <div key={title} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'12px 14px', textAlign:'left', transition:'border-color 0.15s,box-shadow 0.15s', cursor:'default' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.boxShadow='var(--shadow2)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
              <div style={{ width:28, height:28, borderRadius:8, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
                <Icon size={15} color={color}/>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{title}</div>
              <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.45 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Footer branding */}
        <div style={{ fontSize:12, color:'var(--text4)' }} className="animate-fade-up d7">
          Built by{' '}
          <a href={BRAND.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--br3)', fontWeight:700, textDecoration:'none' }}>{BRAND.madeBy}</a>
          {' · '}
          <a href={BRAND.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--br2)', fontWeight:600, textDecoration:'none' }}>{BRAND.website}</a>
        </div>
      </div>
    </div>
  )
}
