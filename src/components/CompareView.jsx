import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, CartesianGrid, Legend } from 'recharts'
import { fetchGitHub } from '../lib/github.js'
import { LANG_COLORS, REPO_TYPE_COLORS } from '../lib/constants.js'
import { fmt, scoreColor, scoreLabel } from '../lib/utils.js'
import { Spinner, ScoreRing, Heatmap, ChartTooltip, LangBar } from './Atoms.jsx'
import { XIcon, ChartIcon, TrophyIcon, CheckIcon, StarIcon, ForkIcon, RepoIcon, UsersIcon, FireIcon, CodeIcon, AwardIcon, TrendIcon, ShareIcon, IssueIcon, EyeIcon, CompareIcon } from './Icons.jsx'
import { ShareCard } from './ShareCard.jsx'
import { BRAND } from '../lib/brand.js'
import { calcWinner } from '../lib/winner.js'

function WinBadge({ text }) {
  return <span style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:20,background:'var(--br)',color:'#f5c842',letterSpacing:'0.05em',textTransform:'uppercase' }}><TrophyIcon size={9} color="#f5c842"/>{text}</span>
}

function MetricDuel({ label, icon, v1, v2, fmtFn, u1, u2, higherBetter=true }) {
  const total=(v1+v2)||1
  const pct1=Math.round((v1/total)*100)
  const win1=higherBetter?v1>v2:v1<v2
  const win2=higherBetter?v2>v1:v2<v1
  const tie=v1===v2
  return (
    <div style={{ background:'var(--bg)',border:`1.5px solid ${win1&&!tie?'var(--br2)':'var(--border)'}`,borderRadius:'var(--r)',padding:'14px 16px',transition:'border-color 0.2s,box-shadow 0.15s' }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 2px 12px rgba(61,32,16,0.1)'}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='none'}}>
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
        <div style={{ width:30,height:30,borderRadius:8,background:win1&&!tie?'rgba(61,32,16,0.1)':'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',color:win1&&!tie?'var(--br2)':'var(--text3)' }}>{icon}</div>
        <span style={{ fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',flex:1 }}>{label}</span>
        {tie&&<span style={{ fontSize:9,background:'var(--bg3)',color:'var(--text3)',padding:'2px 7px',borderRadius:20,fontWeight:700 }}>TIE</span>}
        {!tie&&win1&&<WinBadge text="WINS"/>}
        {!tie&&win2&&<span style={{ fontSize:9,background:'var(--bg2)',color:'var(--br3)',padding:'2px 7px',borderRadius:20,fontWeight:700,border:'1px solid var(--border2)' }}>WINS</span>}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
        {[{v:v1,u:u1,wins:win1&&!tie,isLeft:true},{v:v2,u:u2,wins:win2&&!tie,isLeft:false}].map(({v,u,wins})=>(
          <div key={u.login} style={{ background:wins?'var(--br)':'rgba(0,0,0,0.025)',border:`1px solid ${wins?'transparent':'var(--border)'}`,borderRadius:9,padding:'11px 12px',position:'relative',transition:'background 0.2s' }}>
            {wins&&<div style={{ position:'absolute',top:8,right:9 }}><CheckIcon size={11} color="#f5c842"/></div>}
            <div style={{ fontSize:24,fontWeight:900,color:wins?'#f5c842':'var(--text)',letterSpacing:'-0.025em',lineHeight:1 }}>{fmtFn(v)}</div>
            <div style={{ fontSize:10,color:wins?'rgba(255,255,255,0.42)':'var(--text3)',marginTop:5,fontWeight:600,display:'flex',alignItems:'center',gap:5,overflow:'hidden' }}>
              {u.avatar_url&&<img src={u.avatar_url} alt="" style={{ width:14,height:14,borderRadius:'50%',flexShrink:0 }}/>}
              <span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.login}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height:5,borderRadius:3,background:'var(--bg3)',overflow:'hidden',display:'flex' }}>
        <div style={{ width:pct1+'%',height:'100%',background:win1?'var(--br)':'var(--border2)',borderRadius:'3px 0 0 3px',transition:'width 0.9s cubic-bezier(0.22,1,0.36,1)' }}/>
        <div style={{ flex:1,height:'100%',background:win2?'var(--br4)':'transparent',borderRadius:'0 3px 3px 0' }}/>
      </div>
      <div style={{ display:'flex',justifyContent:'space-between',marginTop:4 }}>
        <span style={{ fontSize:9,fontWeight:win1?700:400,color:win1?'var(--br2)':'var(--text4)' }}>{pct1}%</span>
        <span style={{ fontSize:9,fontWeight:win2?700:400,color:win2?'var(--br3)':'var(--text4)' }}>{100-pct1}%</span>
      </div>
    </div>
  )
}

export function CompareView({ data1, onClose }) {
  const [username2,setUsername2]=useState('')
  const [data2,setData2]=useState(null)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [tab,setTab]=useState('overview')
  const [showShareCard,setShowShareCard]=useState(false)

  const load=async()=>{
    if(!username2.trim())return
    setLoading(true);setError('');setData2(null)
    try{setData2(await fetchGitHub(username2.trim()))}
    catch(e){setError(e.message)}
    finally{setLoading(false)}
  }

  const u1=data1.user
  const tabSt=id=>({ padding:'7px 14px',border:'none',background:tab===id?'var(--br)':'transparent',color:tab===id?'#fff':'var(--text3)',borderRadius:8,fontWeight:600,fontSize:12,cursor:'pointer',transition:'all 0.2s',fontFamily:'Inter,sans-serif',whiteSpace:'nowrap' })

  const METRICS=data2?[
    {key:'score',    label:'Dev Score',      icon:<AwardIcon  size={15}/>, fmtFn:v=>v,       v1:data1.score,             v2:data2.score,              higherBetter:true },
    {key:'repos',    label:'Repos',          icon:<RepoIcon   size={15}/>, fmtFn:v=>v,       v1:data1.nonForkCount,      v2:data2.nonForkCount,       higherBetter:true },
    {key:'stars',    label:'Total Stars',    icon:<StarIcon   size={15}/>, fmtFn:fmt,        v1:data1.totalStars,        v2:data2.totalStars,         higherBetter:true },
    {key:'forks',    label:'Total Forks',    icon:<ForkIcon   size={15}/>, fmtFn:fmt,        v1:data1.totalForks,        v2:data2.totalForks,         higherBetter:true },
    {key:'followers',label:'Followers',      icon:<UsersIcon  size={15}/>, fmtFn:fmt,        v1:u1.followers,            v2:data2.user.followers,     higherBetter:true },
    {key:'streak',   label:'Streak',         icon:<FireIcon   size={15}/>, fmtFn:v=>v+'d',   v1:data1.streak,            v2:data2.streak,             higherBetter:true },
    {key:'langs',    label:'Languages',      icon:<CodeIcon   size={15}/>, fmtFn:v=>v,       v1:data1.languages.length,  v2:data2.languages.length,   higherBetter:true },
    {key:'avgStars', label:'Avg Stars/Repo', icon:<TrendIcon  size={15}/>, fmtFn:fmt,        v1:data1.avgStars,          v2:data2.avgStars,           higherBetter:true },
    {key:'watchers', label:'Watchers',       icon:<EyeIcon    size={15}/>, fmtFn:fmt,        v1:data1.totalWatchers||0,  v2:data2.totalWatchers||0,   higherBetter:true },
    {key:'issues',   label:'Open Issues',    icon:<IssueIcon  size={15}/>, fmtFn:v=>v,       v1:data1.topByStars.reduce((a,r)=>a+r.openIssues,0), v2:data2.topByStars.reduce((a,r)=>a+r.openIssues,0), higherBetter:false },
  ]:[]

  // Strict wins only — ties count for NEITHER (matches ShareCard logic via winner.js)
  const wins1=data2?METRICS.filter(m=>m.higherBetter?m.v1>m.v2:m.v1<m.v2).length:0
  const wins2=data2?METRICS.filter(m=>m.higherBetter?m.v2>m.v1:m.v2<m.v1).length:0
  const winner=data2?(wins1>wins2?'user1':wins2>wins1?'user2':'tie'):null

  return (
    <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r2)',marginBottom:16,overflow:'hidden',boxShadow:'var(--shadow2)' }}>
      {showShareCard&&data2&&<ShareCard data={data1} data2={data2} show={true} onClose={()=>setShowShareCard(false)}/>}

      {/* Header */}
      <div style={{ padding:'18px 24px',borderBottom:'1px solid var(--border)',background:'linear-gradient(90deg,var(--bg) 0%,var(--bg2) 100%)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:'var(--br)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><CompareIcon size={17} color="#fff"/></div>
          <div>
            <div style={{ fontSize:15,fontWeight:800,color:'var(--text)' }}>Developer Comparison</div>
            <div style={{ fontSize:12,color:'var(--text3)',marginTop:1 }}>Stats · Repos · Languages · Skill Radar · Commit Trends</div>
          </div>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          {data2&&(
            <button onClick={()=>setShowShareCard(true)} style={{ height:34,padding:'0 14px',border:'none',background:'var(--br)',color:'#fff',borderRadius:'var(--r)',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontFamily:'Inter,sans-serif' }}>
              <ShareIcon size={13} color="#fff"/>Share Battle
            </button>
          )}
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:6,display:'flex',alignItems:'center' }}><XIcon size={18}/></button>
        </div>
      </div>

      {/* Search row */}
      <div style={{ padding:'14px 24px',borderBottom:'1px solid var(--border)',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap' }}>
        <div style={{ display:'flex',alignItems:'center',gap:9,background:'var(--bg)',border:'1.5px solid var(--border2)',borderRadius:'var(--r)',padding:'7px 13px',flex:'0 0 auto' }}>
          {u1.avatar_url&&<img src={u1.avatar_url} alt="" style={{ width:28,height:28,borderRadius:'50%',border:'1.5px solid var(--border)' }}/>}
          <div><div style={{ fontSize:12,fontWeight:700,color:'var(--text)' }}>{u1.name||u1.login}</div><div style={{ fontSize:10,color:'var(--text3)' }}>@{u1.login}</div></div>
        </div>
        <div style={{ fontSize:13,fontWeight:800,color:'var(--text3)',padding:'0 2px',flexShrink:0 }}>VS</div>
        <input value={username2} onChange={e=>setUsername2(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Enter second username to compare…"
          style={{ flex:1,minWidth:180,height:42,padding:'0 14px',border:'1.5px solid var(--border2)',borderRadius:'var(--r)',background:'var(--bg)',color:'var(--text)',fontSize:14,outline:'none',fontFamily:'Inter,sans-serif',transition:'border-color 0.2s' }}
          onFocus={e=>e.target.style.borderColor='var(--br2)'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
        <button onClick={load} disabled={loading} style={{ height:42,padding:'0 22px',background:'var(--br)',color:'#fff',border:'none',borderRadius:'var(--r)',fontWeight:700,fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:8,fontFamily:'Inter,sans-serif',opacity:loading?0.75:1,flexShrink:0,transition:'opacity 0.2s' }}>
          {loading?<Spinner size={15} color="#fff"/>:<ChartIcon size={14} color="#fff"/>}
          {loading?'Loading…':'Compare'}
        </button>
        {error&&<div style={{ width:'100%',fontSize:13,color:'var(--red)',fontWeight:500,padding:'2px 0' }}>⚠ {error}</div>}
      </div>

      {!data2&&(
        <div style={{ padding:'56px 24px',textAlign:'center',color:'var(--text4)',fontSize:14 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px' }}><CompareIcon size={22} color="var(--text3)"/></div>
          <div style={{ fontWeight:600,color:'var(--text3)',marginBottom:6 }}>Enter a GitHub username above</div>
          <div style={{ fontSize:13 }}>Compare stats, repos, languages, commit patterns and more</div>
        </div>
      )}

      {data2&&(()=>{
        const u2=data2.user
        return (
          <div className="animate-fade">
            {/* Winner banner */}
            <div style={{ padding:'15px 24px',background:winner==='tie'?'var(--bg2)':'linear-gradient(90deg,#2a1208,#3d1e10)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:38,height:38,borderRadius:'50%',background:winner==='tie'?'var(--bg3)':'rgba(245,200,66,0.16)',border:`1.5px solid ${winner==='tie'?'var(--border)':'rgba(245,200,66,0.32)'}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <TrophyIcon size={18} color={winner==='tie'?'var(--text3)':'#f5c842'}/>
                </div>
                <div>
                  <div style={{ fontSize:15,fontWeight:800,color:winner==='tie'?'var(--text)':'#f5f0e8',lineHeight:1.2 }}>
                    {winner==='tie'
                      ? "It's a tie! Evenly matched developers"
                      : `${winner==='user1'?u1.name||u1.login:u2.name||u2.login} takes the lead`}
                  </div>
                  <div style={{ fontSize:12,color:winner==='tie'?'var(--text3)':'rgba(255,255,255,0.45)',marginTop:3 }}>
                    {winner==='tie'
                      ? `Tied ${wins1}–${wins2} across ${METRICS.length} metrics · for fun only`
                      : `${winner==='user1'?wins1:wins2}–${winner==='user1'?wins2:wins1} wins · share the result below`}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex',gap:8 }}>
                {[{u:u1,wins:wins1,iw:winner==='user1'},{u:u2,wins:wins2,iw:winner==='user2'}].map(({u,wins,iw})=>(
                  <div key={u.login} style={{ display:'flex',alignItems:'center',gap:7,padding:'7px 13px',borderRadius:22,background:iw?'rgba(245,200,66,0.16)':'rgba(255,255,255,0.06)',border:`1px solid ${iw?'rgba(245,200,66,0.32)':'rgba(255,255,255,0.08)'}`,color:iw?'#f5c842':'rgba(255,255,255,0.4)',fontWeight:700,fontSize:12 }}>
                    {iw&&<TrophyIcon size={12} color="#f5c842"/>}
                    {u.avatar_url&&<img src={u.avatar_url} alt="" style={{ width:18,height:18,borderRadius:'50%',opacity:0.85 }}/>}
                    {u.login}: {wins}W
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ padding:'10px 24px 0',borderBottom:'1px solid var(--border)',display:'flex',gap:4,overflowX:'auto' }}>
              {[['overview','Overview'],['repos','Repos'],['languages','Languages'],['radar','Radar'],['commits','Commits']].map(([id,label])=>(
                <button key={id} onClick={()=>setTab(id)} style={tabSt(id)}>{label}</button>
              ))}
            </div>

            <div style={{ padding:'22px 24px' }}>

              {/* OVERVIEW */}
              {tab==='overview'&&(
                <div className="animate-fade">
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20 }}>
                    {[{d:data1,u:u1,iw:winner==='user1'},{d:data2,u:u2,iw:winner==='user2'}].map(({d,u,iw})=>(
                      <div key={u.login} style={{ background:iw?'linear-gradient(135deg,#2a1208,#3d1e10)':'var(--bg)',border:`1.5px solid ${iw?'var(--br2)':'var(--border)'}`,borderRadius:'var(--r2)',padding:'20px',textAlign:'center',position:'relative',transition:'all 0.3s' }}>
                        {iw&&<div style={{ position:'absolute',top:12,right:12,background:'rgba(245,200,66,0.18)',border:'1px solid rgba(245,200,66,0.32)',borderRadius:20,padding:'3px 9px',display:'flex',alignItems:'center',gap:4 }}><TrophyIcon size={10} color="#f5c842"/><span style={{ fontSize:10,fontWeight:700,color:'#f5c842',letterSpacing:'0.04em' }}>WINNER</span></div>}
                        <div style={{ display:'flex',justifyContent:'center',marginBottom:10 }}>
                          {u.avatar_url
                            ?<img src={u.avatar_url} alt="" style={{ width:56,height:56,borderRadius:'50%',border:`2.5px solid ${iw?'rgba(245,200,66,0.5)':'var(--border)'}` }}/>
                            :<div style={{ width:56,height:56,borderRadius:'50%',background:'var(--br)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#f5ddb0',border:'2.5px solid var(--br2)' }}>{(u.name||u.login)[0].toUpperCase()}</div>}
                        </div>
                        <div style={{ fontSize:16,fontWeight:800,color:iw?'#fff':'var(--text)',marginBottom:2 }}>{u.name||u.login}</div>
                        <a href={`https://github.com/${u.login}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:12,color:iw?'rgba(255,255,255,0.45)':'var(--text3)',textDecoration:'none',display:'block',marginBottom:14 }}>@{u.login}</a>
                        <div style={{ display:'flex',justifyContent:'center',marginBottom:6 }}><ScoreRing score={d.score} size={80}/></div>
                        {u.bio&&<p style={{ fontSize:11,color:iw?'rgba(255,255,255,0.38)':'var(--text3)',marginTop:10,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{u.bio}</p>}
                        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginTop:14 }}>
                          {[[fmt(d.totalStars),'Stars'],[d.nonForkCount,'Repos'],[fmt(u.followers),'Followers']].map(([v,l])=>(
                            <div key={l} style={{ background:iw?'rgba(255,255,255,0.07)':'var(--bg2)',borderRadius:8,padding:'7px 4px',textAlign:'center' }}>
                              <div style={{ fontSize:14,fontWeight:800,color:iw?'#f5c842':'var(--text)',letterSpacing:'-0.02em' }}>{v}</div>
                              <div style={{ fontSize:9,color:iw?'rgba(255,255,255,0.35)':'var(--text4)',textTransform:'uppercase',letterSpacing:'0.04em',marginTop:2 }}>{l}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10 }}>
                    {METRICS.map(m=><MetricDuel key={m.key} {...m} u1={u1} u2={u2}/>)}
                  </div>
                </div>
              )}

              {/* REPOS */}
              {tab==='repos'&&(
                <div className="animate-fade">
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:18 }}>
                    {[{d:data1,u:u1},{d:data2,u:u2}].map(({d,u})=>(
                      <div key={u.login}>
                        <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:14,padding:'10px 14px',background:'var(--bg2)',borderRadius:'var(--r)',border:'1px solid var(--border)' }}>
                          {u.avatar_url&&<img src={u.avatar_url} alt="" style={{ width:28,height:28,borderRadius:'50%' }}/>}
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontSize:13,fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.name||u.login}</div>
                            <div style={{ fontSize:11,color:'var(--text3)' }}>{d.nonForkCount} repos · {fmt(d.totalStars)} stars · {fmt(d.totalForks)} forks</div>
                          </div>
                          <div style={{ textAlign:'right',flexShrink:0 }}>
                            <div style={{ fontSize:16,fontWeight:900,color:scoreColor(d.score),letterSpacing:'-0.02em' }}>{d.score}</div>
                            <div style={{ fontSize:9,color:scoreColor(d.score),textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:700 }}>{scoreLabel(d.score)}</div>
                          </div>
                        </div>
                        {d.topByStars.slice(0,5).map(r=>(
                          <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none',display:'block',marginBottom:8 }}>
                            <div style={{ background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'12px 14px',transition:'border-color 0.15s,box-shadow 0.15s' }}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--br3)';e.currentTarget.style.boxShadow='0 2px 8px rgba(61,32,16,0.1)'}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
                              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5 }}>
                                <span style={{ fontSize:13,fontWeight:700,color:'var(--blue)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%' }}>{r.name}</span>
                                <span style={{ display:'flex',alignItems:'center',gap:3,fontSize:12,color:'#d97706',fontWeight:700,flexShrink:0 }}><StarIcon size={11} color="#d97706"/>{fmt(r.stars)}</span>
                              </div>
                              {r.desc&&<p style={{ fontSize:11,color:'var(--text3)',marginBottom:6,lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{r.desc}</p>}
                              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                                <span style={{ fontSize:10,padding:'2px 7px',borderRadius:20,background:(REPO_TYPE_COLORS[r.type]||'#a08060')+'18',color:REPO_TYPE_COLORS[r.type]||'#a08060',fontWeight:600 }}>{r.type}</span>
                                {r.lang!=='—'&&<div style={{ display:'flex',alignItems:'center',gap:4 }}><div style={{ width:7,height:7,borderRadius:'50%',background:LANG_COLORS[r.lang]||'#a08060' }}/><span style={{ fontSize:11,color:'var(--text3)' }}>{r.lang}</span></div>}
                                <span style={{ marginLeft:'auto',fontSize:11,color:'var(--text4)',display:'flex',alignItems:'center',gap:3 }}><ForkIcon size={10} color="var(--text4)"/>{fmt(r.forks)}</span>
                              </div>
                            </div>
                          </a>
                        ))}
                        <div style={{ marginTop:10,padding:'12px 14px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)' }}>
                          <div style={{ fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:9 }}>Project Categories</div>
                          {d.repoTypes.slice(0,5).map(({type,count,color})=>(
                            <div key={type} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                              <div style={{ width:7,height:7,borderRadius:2,background:color,flexShrink:0 }}/>
                              <span style={{ fontSize:11,color:'var(--text2)',width:66,flexShrink:0 }}>{type}</span>
                              <div style={{ flex:1,height:4,background:'var(--bg3)',borderRadius:2,overflow:'hidden' }}>
                                <div style={{ width:(count/(d.repoTypes[0]?.count||1)*100)+'%',height:'100%',background:color,borderRadius:2,transition:'width 0.8s ease' }}/>
                              </div>
                              <span style={{ fontSize:11,color:'var(--text3)',width:18,textAlign:'right',fontWeight:600 }}>{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LANGUAGES */}
              {tab==='languages'&&(
                <div className="animate-fade">
                  {(()=>{
                    const s1=new Set(data1.languages.map(l=>l.name)),s2=new Set(data2.languages.map(l=>l.name))
                    const shared=[...s1].filter(l=>s2.has(l)),only1=[...s1].filter(l=>!s2.has(l)),only2=[...s2].filter(l=>!s1.has(l))
                    const pct=Math.round(shared.length/Math.max(s1.size,s2.size)*100)||0
                    return (
                      <>
                        <div style={{ background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'18px',marginBottom:18 }}>
                          <div style={{ fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:16 }}>Language Overlap Analysis</div>
                          <div style={{ display:'grid',gridTemplateColumns:'1fr 90px 1fr',gap:16,alignItems:'start' }}>
                            <div>
                              <div style={{ fontSize:11,fontWeight:700,color:'var(--br2)',marginBottom:9,textTransform:'uppercase',letterSpacing:'0.04em' }}>Only {u1.login} ({only1.length})</div>
                              <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                                {only1.length?only1.map(l=><span key={l} style={{ fontSize:11,padding:'4px 9px',borderRadius:20,background:(LANG_COLORS[l]||'#a08060')+'20',color:LANG_COLORS[l]||'var(--text2)',fontWeight:600,border:`1px solid ${(LANG_COLORS[l]||'#a08060')}30` }}>{l}</span>):<span style={{ fontSize:12,color:'var(--text4)',fontStyle:'italic' }}>None</span>}
                              </div>
                            </div>
                            <div style={{ textAlign:'center' }}>
                              <div style={{ width:64,height:64,borderRadius:'50%',background:pct>60?'rgba(34,197,94,0.1)':pct>30?'rgba(245,158,11,0.1)':'rgba(239,68,68,0.1)',border:`2px solid ${pct>60?'rgba(34,197,94,0.3)':pct>30?'rgba(245,158,11,0.3)':'rgba(239,68,68,0.3)'}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',margin:'0 auto 8px' }}>
                                <div style={{ fontSize:20,fontWeight:900,color:pct>60?'var(--green)':pct>30?'var(--amber)':'var(--red)',letterSpacing:'-0.03em',lineHeight:1 }}>{pct}%</div>
                              </div>
                              <div style={{ fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.04em',fontWeight:700 }}>overlap</div>
                              <div style={{ fontSize:12,color:'var(--text2)',marginTop:4,fontWeight:600 }}>{shared.length} shared</div>
                            </div>
                            <div style={{ textAlign:'right' }}>
                              <div style={{ fontSize:11,fontWeight:700,color:'var(--br3)',marginBottom:9,textTransform:'uppercase',letterSpacing:'0.04em' }}>Only {u2.login} ({only2.length})</div>
                              <div style={{ display:'flex',flexWrap:'wrap',gap:5,justifyContent:'flex-end' }}>
                                {only2.length?only2.map(l=><span key={l} style={{ fontSize:11,padding:'4px 9px',borderRadius:20,background:(LANG_COLORS[l]||'#a08060')+'20',color:LANG_COLORS[l]||'var(--text2)',fontWeight:600,border:`1px solid ${(LANG_COLORS[l]||'#a08060')}30` }}>{l}</span>):<span style={{ fontSize:12,color:'var(--text4)',fontStyle:'italic' }}>None</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                          {[{d:data1,u:u1},{d:data2,u:u2}].map(({d,u})=>(
                            <div key={u.login} style={{ background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'16px' }}>
                              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
                                {u.avatar_url&&<img src={u.avatar_url} alt="" style={{ width:22,height:22,borderRadius:'50%' }}/>}
                                <span style={{ fontSize:12,fontWeight:700,color:'var(--text)' }}>{u.login}</span>
                                <span style={{ marginLeft:'auto',fontSize:11,color:'var(--text3)' }}>{d.languages.length} languages</span>
                              </div>
                              {d.languages.map(l=><LangBar key={l.name} name={l.name} pct={l.pct} color={l.color}/>)}
                            </div>
                          ))}
                        </div>
                        {/* Shared language comparison chart */}
                        {shared.length>0&&(
                          <div style={{ marginTop:14,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'16px' }}>
                            <div style={{ fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:12 }}>Shared Languages — Usage Comparison</div>
                            <div style={{ overflowX:'auto' }}>
                              <div style={{ display:'flex',gap:6,minWidth:shared.length*70 }}>
                                {shared.map(name=>{
                                  const l1=data1.languages.find(l=>l.name===name),l2=data2.languages.find(l=>l.name===name)
                                  const col=LANG_COLORS[name]||'#a08060'
                                  return (
                                    <div key={name} style={{ flex:1,minWidth:60 }}>
                                      <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:7 }}>
                                        <div style={{ width:7,height:7,borderRadius:'50%',background:col }}/>
                                        <span style={{ fontSize:10,fontWeight:600,color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{name}</span>
                                      </div>
                                      <div style={{ background:'var(--bg2)',borderRadius:6,overflow:'hidden',height:72,display:'flex',flexDirection:'column',justifyContent:'flex-end' }}>
                                        <div style={{ display:'flex',gap:2,height:'100%',alignItems:'flex-end',padding:'0 4px 4px' }}>
                                          <div title={u1.login} style={{ flex:1,background:col,opacity:0.85,borderRadius:'2px 2px 0 0',height:(l1?.pct||0)+'%',minHeight:3,transition:'height 1s ease' }}/>
                                          <div title={u2.login} style={{ flex:1,background:col,opacity:0.4,borderRadius:'2px 2px 0 0',height:(l2?.pct||0)+'%',minHeight:3,transition:'height 1s ease' }}/>
                                        </div>
                                      </div>
                                      <div style={{ display:'flex',gap:2,marginTop:4 }}>
                                        <span style={{ flex:1,fontSize:9,color:'var(--text3)',textAlign:'center' }}>{l1?.pct||0}%</span>
                                        <span style={{ flex:1,fontSize:9,color:'var(--text4)',textAlign:'center' }}>{l2?.pct||0}%</span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            <div style={{ display:'flex',gap:14,marginTop:10 }}>
                              {[{u:u1,op:0.85},{u:u2,op:0.4}].map(({u,op})=>(
                                <div key={u.login} style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--text3)' }}>
                                  <div style={{ width:12,height:8,borderRadius:2,background:`rgba(100,100,100,${op})` }}/>
                                  <span>{u.login}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}

              {/* RADAR */}
              {tab==='radar'&&(
                <div className="animate-fade">
                  <div style={{ background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'14px 18px',marginBottom:16,display:'flex',gap:20,alignItems:'center',flexWrap:'wrap' }}>
                    <div style={{ display:'flex',gap:14 }}>
                      {[{u:u1,col:'var(--br)'},{u:u2,col:'var(--br4)'}].map(({u,col})=>(
                        <div key={u.login} style={{ display:'flex',alignItems:'center',gap:8 }}>
                          <div style={{ width:18,height:3,borderRadius:2,background:col }}/>
                          {u.avatar_url&&<img src={u.avatar_url} alt="" style={{ width:22,height:22,borderRadius:'50%',border:'1.5px solid var(--border)' }}/>}
                          <div><div style={{ fontSize:12,fontWeight:700,color:'var(--text)' }}>{u.login}</div><div style={{ fontSize:10,color:'var(--text3)' }}>Score: {data1.score||data2.score}</div></div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginLeft:'auto',fontSize:11,color:'var(--text3)' }}>6 skill dimensions — higher is better</div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={data1.radarData.map((d,i)=>({...d,B:data2.radarData[i]?.A||0}))}>
                      <PolarGrid stroke="var(--border)"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize:12,fill:'var(--text2)',fontFamily:'Inter,sans-serif',fontWeight:600 }}/>
                      <PolarRadiusAxis tick={{ fontSize:9,fill:'var(--text4)' }} domain={[0,100]} axisLine={false} tickCount={4}/>
                      <Radar name={u1.login} dataKey="A" stroke="var(--br)" fill="var(--br)" fillOpacity={0.15} strokeWidth={2.5} dot={{ fill:'var(--br)',r:4,stroke:'#fff',strokeWidth:1.5 }}/>
                      <Radar name={u2.login} dataKey="B" stroke="var(--br4)" fill="var(--br4)" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 3" dot={{ fill:'var(--br4)',r:3.5,stroke:'#fff',strokeWidth:1.5 }}/>
                      <Tooltip content={<ChartTooltip/>}/>
                      <Legend/>
                    </RadarChart>
                  </ResponsiveContainer>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:10,marginTop:16 }}>
                    {data1.radarData.map((item,i)=>{
                      const v1=item.A,v2=data2.radarData[i]?.A||0,win1=v1>=v2
                      return (
                        <div key={item.subject} style={{ background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'13px 15px' }}>
                          <div style={{ fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                            {item.subject}
                            <span style={{ fontSize:9,padding:'2px 7px',borderRadius:20,background:win1?'rgba(61,32,16,0.08)':'rgba(200,128,64,0.08)',color:win1?'var(--br2)':'var(--br4)',fontWeight:700 }}>{win1?u1.login:u2.login}</span>
                          </div>
                          {[{u:u1,v:v1,col:'var(--br)'},{u:u2,v:v2,col:'var(--br4)'}].map(({u,v,col})=>(
                            <div key={u.login} style={{ marginBottom:7 }}>
                              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                                <span style={{ fontSize:11,color:'var(--text2)',fontWeight:500 }}>{u.login}</span>
                                <span style={{ fontSize:12,fontWeight:700,color:'var(--text)' }}>{v}</span>
                              </div>
                              <div style={{ height:5,background:'var(--bg2)',borderRadius:3,overflow:'hidden' }}>
                                <div style={{ width:v+'%',height:'100%',background:col,borderRadius:3,transition:'width 0.9s ease' }}/>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* COMMITS */}
              {tab==='commits'&&(
                <div className="animate-fade">
                  <div style={{ background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'16px 18px',marginBottom:16 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10 }}>Monthly Commit Trend — 12 Months</div>
                    <div style={{ display:'flex',gap:14,marginBottom:12 }}>
                      {[{u:u1,col:'var(--br)'},{u:u2,col:'var(--br4)'}].map(({u,col})=>(
                        <div key={u.login} style={{ display:'flex',alignItems:'center',gap:7 }}>
                          <div style={{ width:16,height:4,borderRadius:2,background:col }}/>
                          {u.avatar_url&&<img src={u.avatar_url} alt="" style={{ width:18,height:18,borderRadius:'50%' }}/>}
                          <span style={{ fontSize:12,fontWeight:600,color:'var(--text2)' }}>{u.login}</span>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data1.monthlyCommits.map((m,i)=>({month:m.month,[u1.login]:m.commits,[u2.login]:data2.monthlyCommits[i]?.commits||0}))} margin={{ top:4,right:4,bottom:0,left:-20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg3)" vertical={false}/>
                        <XAxis dataKey="month" tick={{ fontSize:10,fill:'var(--text4)',fontFamily:'Inter' }} tickLine={false} axisLine={false} interval={2}/>
                        <YAxis tick={{ fontSize:10,fill:'var(--text4)',fontFamily:'Inter' }} tickLine={false} axisLine={false}/>
                        <Tooltip content={<ChartTooltip/>}/>
                        <Bar dataKey={u1.login} fill="var(--br)" radius={[2,2,0,0]} maxBarSize={16}/>
                        <Bar dataKey={u2.login} fill="var(--br4)" radius={[2,2,0,0]} maxBarSize={16} opacity={0.8}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                    {[{d:data1,u:u1},{d:data2,u:u2}].map(({d,u})=>(
                      <div key={u.login} style={{ background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'16px' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:12 }}>
                          {u.avatar_url&&<img src={u.avatar_url} alt="" style={{ width:24,height:24,borderRadius:'50%',border:'1.5px solid var(--border)' }}/>}
                          <span style={{ fontSize:13,fontWeight:700,color:'var(--text)' }}>{u.name||u.login}</span>
                          <span style={{ marginLeft:'auto',fontSize:12,color:'var(--orange)',fontWeight:700,display:'flex',alignItems:'center',gap:4 }}><FireIcon size={13} color="var(--orange)"/>{d.streak}d streak</span>
                          <span style={{ fontSize:12,color:'var(--text3)' }}>Best: <b style={{ color:'var(--text)' }}>{d.longestStreak}d</b></span>
                        </div>
                        <Heatmap grid={d.contribGrid}/>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14 }}>
                    {[{d:data1,u:u1},{d:data2,u:u2}].map(({d,u})=>(
                      <div key={u.login} style={{ background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'16px' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                          {u.avatar_url&&<img src={u.avatar_url} alt="" style={{ width:22,height:22,borderRadius:'50%' }}/>}
                          <span style={{ fontSize:13,fontWeight:700,color:'var(--text)' }}>{u.login}</span>
                        </div>
                        {[
                          [<FireIcon size={13} color="var(--orange)"/>,'Current Streak',d.streak+'d','var(--orange)'],
                          [<TrophyIcon size={13} color="var(--br3)"/>,'Best Streak',d.longestStreak+'d','var(--br3)'],
                          [<StarIcon size={13} color="#d97706"/>,'Total Stars',fmt(d.totalStars),'#d97706'],
                          [<RepoIcon size={13} color="var(--br2)"/>,'Public Repos',d.nonForkCount,'var(--br2)'],
                          [<UsersIcon size={13} color="var(--blue)"/>,'Followers',fmt(u.followers),'var(--blue)'],
                          [<AwardIcon size={13} color={scoreColor(d.score)}/>,'Dev Score',d.score,scoreColor(d.score)],
                        ].map(([ic,label,val,col],i,arr)=>(
                          <div key={i} style={{ display:'flex',alignItems:'center',gap:9,padding:'7px 0',borderBottom:i<arr.length-1?'1px solid var(--border)':'none' }}>
                            <div style={{ width:26,height:26,borderRadius:7,background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:col }}>{ic}</div>
                            <span style={{ flex:1,fontSize:12,color:'var(--text2)' }}>{label}</span>
                            <span style={{ fontSize:13,fontWeight:700,color:col }}>{val}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )
      })()}

      {/* Footer */}
      <div style={{ padding:'12px 24px',borderTop:'1px solid var(--border)',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8 }}>
        <div style={{ fontSize:12,color:'var(--text3)' }}>
          Powered by <a href={BRAND.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--br2)',fontWeight:700,textDecoration:'none' }}>{BRAND.appName}</a>
        </div>
        <div style={{ fontSize:12,color:'var(--text4)' }}>
          Made by <a href={BRAND.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--br3)',fontWeight:600,textDecoration:'none' }}>{BRAND.madeBy}</a>
          {' · '}
          <a href={BRAND.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--br3)',textDecoration:'none' }}>{BRAND.website}</a>
        </div>
      </div>
    </div>
  )
}
