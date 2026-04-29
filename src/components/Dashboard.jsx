import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PieChart, Pie, Cell
} from 'recharts'
import { fmt, fmtDate, timeAgo, scoreColor, scoreLabel } from '../lib/utils.js'
import { LANG_COLORS, REPO_TYPE_COLORS } from '../lib/constants.js'
import { Card, StatCard, SectionLabel, ScoreRing, Heatmap, LangBar, InfoPopup } from './Atoms.jsx'
import {
  StarIcon, ForkIcon, RepoIcon, UsersIcon, FireIcon, CodeIcon,
  AwardIcon, TrophyIcon, CalendarIcon, GlobeIcon, LinkIcon, ShareIcon,
  ChartIcon, ExternalIcon, TrendIcon, EyeIcon, IssueIcon, MedalIcon,
  ActivityIcon, CompareIcon, InfoIcon, GridIcon, ListIcon, ZapIcon
} from './Icons.jsx'
import { BRAND } from '../lib/brand.js'

const ACT_COLORS = { commit:'var(--br2)', pr:'var(--blue)', create:'var(--green2)', star:'var(--amber)', fork:'var(--purple)', issue:'var(--red)', other:'var(--text3)' }
const ACT_LABELS = { commit:'Commit', pr:'PR', create:'Created', star:'Starred', fork:'Forked', issue:'Issue', other:'Activity' }

function CT({ active, payload, label }) {
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

// ── Spotlight: #1 repo big card ──────────────────────────────────────────────
function SpotlightRepo({ repo }) {
  if (!repo) return null
  const typeColor = REPO_TYPE_COLORS[repo.type] || '#a08060'
  return (
    <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', display:'block' }}>
      <div style={{ background:'linear-gradient(135deg,#2a1208 0%,#3d1e10 100%)', borderRadius:'var(--r2)', padding:'22px 24px', color:'#fff', border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', transition:'transform 0.15s,box-shadow 0.15s', marginBottom:14 }}
        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(61,32,16,0.25)'}}
        onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:8 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <StarIcon size={16} color="#f5c842"/>
              </div>
              <div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700 }}>Top Repository</div>
              </div>
            </div>
            <div style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.025em', marginBottom:6, lineHeight:1.15 }}>{repo.name}</div>
            {repo.desc && <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.6, marginBottom:14, maxWidth:480 }}>{repo.desc}</p>}
            {repo.topics.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
                {repo.topics.slice(0,5).map(t => (
                  <span key={t} style={{ fontSize:11, padding:'3px 9px', borderRadius:20, background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.65)', fontWeight:500 }}>{t}</span>
                ))}
              </div>
            )}
            <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
              {[
                [<StarIcon size={13} color="#f5c842"/>, fmt(repo.stars), 'Stars'],
                [<ForkIcon size={13} color="rgba(255,255,255,0.5)"/>, fmt(repo.forks), 'Forks'],
                [<EyeIcon  size={13} color="rgba(255,255,255,0.5)"/>, fmt(repo.watchers), 'Watchers'],
                [<IssueIcon size={13} color="rgba(255,255,255,0.5)"/>, repo.openIssues, 'Open issues'],
              ].map(([ic, val, lbl]) => (
                <div key={lbl} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {ic}
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:'#f5c842', lineHeight:1 }}>{val}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Health score</div>
            <div style={{ fontSize:44, fontWeight:900, color: repo.health>=70?'#22c55e':repo.health>=45?'#f59e0b':'#ef4444', letterSpacing:'-0.04em', lineHeight:1 }}>{repo.health}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:4 }}>out of 100</div>
            <div style={{ marginTop:12 }}>
              <span style={{ fontSize:11, padding:'4px 10px', borderRadius:20, background: typeColor+'22', border:`1px solid ${typeColor}44`, color:typeColor, fontWeight:700 }}>{repo.type}</span>
            </div>
            <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:5, justifyContent:'flex-end' }}>
              <div style={{ width:9, height:9, borderRadius:'50%', background:LANG_COLORS[repo.lang]||'#a08060' }}/>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>{repo.lang}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

// ── Developer identity card ──────────────────────────────────────────────────
function DevIdentityCard({ devType, githubAge, influence, estContributions, followers, following }) {
  return (
    <Card style={{ marginBottom:14 }}>
      <SectionLabel>Developer Identity</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
        {/* Dev type */}
        <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Engineer Type</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:devType.color+'18', border:`1px solid ${devType.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <CodeIcon size={17} color={devType.color}/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--text)', lineHeight:1.2 }}>{devType.label}</div>
            </div>
          </div>
          <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5 }}>{devType.desc}</div>
        </div>

        {/* GitHub age */}
        <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>GitHub Status</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:githubAge.color+'18', border:`1px solid ${githubAge.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <CalendarIcon size={17} color={githubAge.color}/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--text)', lineHeight:1.2 }}>{githubAge.label}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{githubAge.desc}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
            <div style={{ flex:1, height:5, background:'var(--bg2)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ width: githubAge.label==='Veteran'?'100%':githubAge.label==='Experienced'?'70%':githubAge.label==='Active'?'45%':'25%', height:'100%', background:githubAge.color, borderRadius:3, transition:'width 1s ease' }}/>
            </div>
          </div>
        </div>

        {/* Influence */}
        <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Influence Ratio</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:influence.color+'18', border:`1px solid ${influence.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <TrendIcon size={17} color={influence.color}/>
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:influence.color, letterSpacing:'-0.03em', lineHeight:1 }}>{influence.ratio}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{influence.label}</div>
            </div>
          </div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>{fmt(followers)} followers / {fmt(following)} following</div>
        </div>

        {/* Est. contributions */}
        <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Est. Contributions</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <ZapIcon size={17} color="#8b5cf6"/>
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1 }}>{fmt(estContributions)}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>total commits est.</div>
            </div>
          </div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>Estimated from repo activity</div>
        </div>
      </div>
    </Card>
  )
}

// ── Top Topics / Interests ───────────────────────────────────────────────────
function TopicsCard({ topics }) {
  if (!topics?.length) return null
  const TOPIC_COLORS = ['#3178c6','#f59e0b','#22c55e','#8b5cf6','#ef4444','#0ea5e9','#f97316','#6b4020','#a97bff','#00b4ab','#dc322f','#39594d']
  return (
    <Card style={{ marginBottom:14 }}>
      <SectionLabel>Top Interests & Topics</SectionLabel>
      <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
        {topics.map((t, i) => (
          <div key={t.name} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:22, background:'var(--bg)', border:'1px solid var(--border)', transition:'border-color 0.15s,box-shadow 0.15s', cursor:'default' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=TOPIC_COLORS[i%TOPIC_COLORS.length];e.currentTarget.style.boxShadow=`0 2px 8px ${TOPIC_COLORS[i%TOPIC_COLORS.length]}22`}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:TOPIC_COLORS[i%TOPIC_COLORS.length], flexShrink:0 }}/>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--text2)' }}>{t.name}</span>
            <span style={{ fontSize:10, color:'var(--text4)', fontVariantNumeric:'tabular-nums' }}>×{t.count}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Repo health grid ──────────────────────────────────────────────────────────
function RepoHealthGrid({ repos }) {
  return (
    <Card style={{ marginBottom:14 }}>
      <SectionLabel>Repository Health Scores</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:10 }}>
        {repos.slice(0,6).map(r => {
          const hColor = r.health>=70?'#22c55e':r.health>=45?'#f59e0b':'#ef4444'
          return (
            <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
              <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'13px 15px', transition:'border-color 0.15s,box-shadow 0.15s', cursor:'pointer' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--br3)';e.currentTarget.style.boxShadow='0 3px 12px rgba(61,32,16,0.1)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--blue)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'75%' }}>{r.name}</span>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:16, fontWeight:900, color:hColor, lineHeight:1 }}>{r.health}</div>
                    <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'0.04em' }}>health</div>
                  </div>
                </div>
                <div style={{ height:4, background:'var(--bg2)', borderRadius:2, overflow:'hidden', marginBottom:9 }}>
                  <div style={{ width:r.health+'%', height:'100%', background:hColor, borderRadius:2, transition:'width 1s ease' }}/>
                </div>
                <div style={{ display:'flex', gap:12, fontSize:11, color:'var(--text3)' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:3 }}><StarIcon size={10} color="#d97706"/>{fmt(r.stars)}</span>
                  <span style={{ display:'flex', alignItems:'center', gap:3 }}><ForkIcon size={10} color="var(--text4)"/>{fmt(r.forks)}</span>
                  <span style={{ display:'flex', alignItems:'center', gap:3 }}><IssueIcon size={10} color="var(--text4)"/>{r.openIssues}</span>
                  <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:3 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:LANG_COLORS[r.lang]||'#a08060' }}/>{r.lang}
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

// ── Main Dashboard ────────────────────────────────────────────────────────────
export function Dashboard({ data, onShare, onCompare }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [repoSort,  setRepoSort]  = useState('stars')
  const [repoView,  setRepoView]  = useState('grid')
  const [showInfo,  setShowInfo]  = useState(false)

  const {
    user, totalStars, totalForks, totalWatchers, nonForkCount, languages,
    topByStars, monthlyCommits, contribGrid, streak, longestStreak, score,
    activity, repoTypes, memberYears, avgStars, stack, radarData,
    spotlightRepo, devType, githubAge, influence, topTopics, estContributions,
  } = data

  const initials = (user.name||user.login).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

  const sortedRepos = [...topByStars].sort((a,b) =>
    repoSort==='stars'  ? b.stars-a.stars :
    repoSort==='forks'  ? b.forks-a.forks :
    repoSort==='issues' ? b.openIssues-a.openIssues :
    repoSort==='health' ? b.health-a.health :
    new Date(b.updated)-new Date(a.updated)
  )

  const tabSt = id => ({
    padding:'8px 16px', border:'none',
    background: activeTab===id?'var(--br)':'transparent',
    color: activeTab===id?'#fff':'var(--text3)',
    borderRadius:9, fontWeight:600, fontSize:13,
    cursor:'pointer', transition:'all 0.2s', fontFamily:'Inter,sans-serif', whiteSpace:'nowrap',
  })

  const scoreBreakdown = [
    { label:'Repositories', value:Math.min(25,Math.round(Math.log2(nonForkCount+1)*5.2)), max:25, color:'var(--blue)' },
    { label:'Followers',    value:Math.min(22,Math.round(Math.log10(user.followers+1)*9.5)), max:22, color:'var(--purple)' },
    { label:'Stars',        value:Math.min(25,Math.round(Math.log10(totalStars+1)*9.5)), max:25, color:'#d97706' },
    { label:'Forks',        value:Math.min(10,Math.round(Math.log10(totalForks+1)*5)), max:10, color:'var(--br3)' },
    { label:'Tenure',       value:Math.min(10,Math.round(memberYears*1.4)), max:10, color:'var(--green)' },
    { label:'Diversity',    value:Math.min(8,Math.round(languages.length*0.9)), max:8, color:'var(--amber)' },
  ]

  return (
    <div style={{ maxWidth:980, margin:'0 auto', padding:'0 20px 80px' }}>
      <InfoPopup show={showInfo} onClose={()=>setShowInfo(false)}/>

      {/* Nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 0 20px', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', gap:3, background:'var(--bg2)', borderRadius:12, padding:4 }}>
            {[['overview','Overview'],['repos','Repos'],['activity','Activity']].map(([id,label]) => (
              <button key={id} onClick={()=>setActiveTab(id)} style={tabSt(id)}>{label}</button>
            ))}
          </div>
          <button onClick={()=>setShowInfo(true)} title="How scoring works"
            style={{ width:32, height:32, borderRadius:'50%', border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--br2)';e.currentTarget.style.color='var(--br2)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text3)'}}>
            <InfoIcon size={15}/>
          </button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCompare}
            style={{ height:38, padding:'0 16px', border:'1.5px solid var(--border2)', background:'var(--surface)', borderRadius:'var(--r)', fontSize:13, fontWeight:600, cursor:'pointer', color:'var(--text2)', display:'flex', alignItems:'center', gap:7, fontFamily:'Inter,sans-serif', transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--br2)';e.currentTarget.style.background='var(--bg2)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.background='var(--surface)'}}>
            <CompareIcon size={14} color="var(--br2)"/> Compare
          </button>
          <button onClick={onShare}
            style={{ height:38, padding:'0 18px', border:'none', background:'var(--br)', color:'#fff', borderRadius:'var(--r)', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontFamily:'Inter,sans-serif', boxShadow:'0 2px 8px rgba(61,32,16,0.25)', transition:'background 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--br2)'}
            onMouseLeave={e=>e.currentTarget.style.background='var(--br)'}>
            <ShareIcon size={14} color="#fff"/> Share Card
          </button>
        </div>
      </div>

      {/* Profile Hero */}
      <Card style={{ marginBottom:14, padding:'24px' }} className="animate-fade-up d1">
        <div style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:78, height:78, borderRadius:'50%', overflow:'hidden', border:'3px solid var(--border)', background:'var(--bg2)' }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <div style={{ width:'100%', height:'100%', background:'var(--br)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#f5ddb0' }}>{initials}</div>}
            </div>
            <div style={{ position:'absolute', bottom:3, right:3, width:17, height:17, borderRadius:'50%', background:'var(--green)', border:'2.5px solid var(--surface)' }}/>
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:5 }}>
              <h1 style={{ fontSize:24, fontWeight:900, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1 }}>{user.name||user.login}</h1>
              <a href={`https://github.com/${user.login}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:14, color:'var(--br3)', textDecoration:'none', fontWeight:500, display:'flex', alignItems:'center', gap:4 }}>
                @{user.login} <ExternalIcon size={11} color="var(--br3)"/>
              </a>
              {/* Dev type badge inline */}
              {devType && <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:devType.color+'18', border:`1px solid ${devType.color}30`, color:devType.color, fontWeight:700 }}>{devType.label}</span>}
            </div>
            {user.bio && <p style={{ fontSize:14, color:'var(--text2)', marginBottom:11, lineHeight:1.6, maxWidth:520 }}>{user.bio}</p>}
            <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
              {user.company  && <span style={{ fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:5 }}><RepoIcon size={12} color="var(--text4)"/>{user.company}</span>}
              {user.location && <span style={{ fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:5 }}><GlobeIcon size={12} color="var(--text4)"/>{user.location}</span>}
              {user.blog     && <a href={user.blog.startsWith('http')?user.blog:'https://'+user.blog} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:'var(--blue)', display:'flex', alignItems:'center', gap:5, textDecoration:'none' }}><LinkIcon size={12} color="var(--blue)"/>{user.blog.replace(/^https?:\/\//,'')}</a>}
              <span style={{ fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:5 }}><CalendarIcon size={12} color="var(--text4)"/>Joined {fmtDate(user.created_at)}</span>
              {githubAge && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:githubAge.color+'18', border:`1px solid ${githubAge.color}30`, color:githubAge.color, fontWeight:600 }}>{githubAge.label}</span>}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, marginLeft:'auto' }}>
            <ScoreRing score={score} size={90}/>
            <button onClick={()=>setShowInfo(true)} style={{ fontSize:10, color:'var(--text4)', background:'none', border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:3, marginTop:2 }}>
              <InfoIcon size={10} color="var(--text4)"/> How it's calculated
            </button>
          </div>
        </div>
      </Card>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(135px,1fr))', gap:10, marginBottom:14 }}>
        {[
          { label:'Repositories', value:fmt(nonForkCount),   sub:'original repos',        icon:<RepoIcon    size={15} color="var(--br3)"/>,   dark:false, d:'d2' },
          { label:'Total Stars',  value:fmt(totalStars),     sub:'earned across repos',   icon:<StarIcon    size={15} color="#d97706"/>,       dark:false, d:'d2' },
          { label:'Total Forks',  value:fmt(totalForks),     sub:'by the community',      icon:<ForkIcon    size={15} color="var(--br3)"/>,    dark:false, d:'d3' },
          { label:'Followers',    value:fmt(user.followers), sub:fmt(user.following)+' following', icon:<UsersIcon size={15} color="var(--br3)"/>, dark:false, d:'d3' },
          { label:'Streak',       value:`${streak}d`,        sub:'days active now',       icon:<FireIcon    size={15} color="var(--orange)"/>, dark:true,  d:'d4' },
          { label:'Best Streak',  value:`${longestStreak}d`, sub:'personal best',         icon:<TrophyIcon  size={15} color="var(--br4)"/>,   dark:false, d:'d4' },
          { label:'Member',       value:`${memberYears}yr`,  sub:'on GitHub',             icon:<CalendarIcon size={15} color="var(--br3)"/>,  dark:false, d:'d5' },
          { label:'Avg Stars',    value:avgStars>=1000?fmt(avgStars):avgStars, sub:'per repo', icon:<TrendIcon size={15} color="var(--br3)"/>, dark:false, d:'d5' },
        ].map(({ label, value, sub, icon, dark, d }) => (
          <StatCard key={label} label={label} value={value} sub={sub} icon={icon} dark={dark} className={`animate-fade-up ${d}`}/>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab==='overview' && (
        <>
          {/* Spotlight repo */}
          {spotlightRepo && <SpotlightRepo repo={spotlightRepo}/>}

          {/* Developer identity */}
          {devType && <DevIdentityCard devType={devType} githubAge={githubAge} influence={influence} estContributions={estContributions} followers={user.followers} following={user.following}/>}

          {/* Heatmap */}
          <Card style={{ marginBottom:14 }} className="animate-fade-up d3">
            <SectionLabel right={
              <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text3)' }}>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><FireIcon size={13} color="var(--orange)"/><b style={{ color:'var(--text)' }}>{streak}</b> day streak</span>
                <span>Best: <b style={{ color:'var(--text)' }}>{longestStreak}d</b></span>
              </div>
            }>Contribution Activity — Last Year</SectionLabel>
            <Heatmap grid={contribGrid}/>
          </Card>

          {/* Commits + Languages */}
          <div style={{ display:'grid', gridTemplateColumns:'1.15fr 0.85fr', gap:12, marginBottom:14 }}>
            <Card className="animate-fade-up d4">
              <SectionLabel>Monthly Commits (12 months)</SectionLabel>
              <ResponsiveContainer width="100%" height={175}>
                <BarChart data={monthlyCommits} margin={{ top:4, right:4, bottom:0, left:-22 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg3)" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:10, fill:'var(--text4)', fontFamily:'Inter' }} tickLine={false} axisLine={false} interval={2}/>
                  <YAxis tick={{ fontSize:10, fill:'var(--text4)', fontFamily:'Inter' }} tickLine={false} axisLine={false}/>
                  <Tooltip content={<CT/>}/>
                  <Bar dataKey="commits" radius={[3,3,0,0]} maxBarSize={26}>
                    {monthlyCommits.map((_,i) => (
                      <Cell key={i} fill={i===monthlyCommits.length-1?'var(--br)':i>=monthlyCommits.length-3?'var(--br2)':'var(--br3)'}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="animate-fade-up d4">
              <SectionLabel>Languages</SectionLabel>
              {languages.map(l => <LangBar key={l.name} name={l.name} pct={l.pct} color={l.color}/>)}
              {!languages.length && <p style={{ fontSize:13, color:'var(--text4)', fontStyle:'italic' }}>No language data</p>}
            </Card>
          </div>

          {/* Score breakdown + Pie */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <Card className="animate-fade-up d5">
              <SectionLabel right={
                <button onClick={()=>setShowInfo(true)} style={{ fontSize:11, color:'var(--br3)', background:'none', border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:4, fontWeight:600 }}>
                  <InfoIcon size={12} color="var(--br3)"/> How?
                </button>
              }>Dev Score Breakdown</SectionLabel>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
                <ScoreRing score={score} size={76}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>
                    <b style={{ color:'var(--text)' }}>Deterministic</b> — same profile always gets the same score. No randomness.
                  </div>
                </div>
              </div>
              {scoreBreakdown.map(({ label, value, max, color }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:12, color:'var(--text2)', width:82, flexShrink:0 }}>{label}</span>
                  <div style={{ flex:1, height:6, background:'var(--bg2)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:(value/max*100)+'%', height:'100%', background:color, borderRadius:3, transition:'width 1s ease' }}/>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:color, width:34, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{value}/{max}</span>
                </div>
              ))}
            </Card>

            <Card className="animate-fade-up d5">
              <SectionLabel>Language Share</SectionLabel>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={languages} cx="50%" cy="48%" innerRadius={52} outerRadius={82} paddingAngle={2} dataKey="pct">
                    {languages.map((l) => <Cell key={l.name} fill={l.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v,n) => [`${v}%`, n]} contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px 12px' }}>
                {languages.slice(0,6).map(l => (
                  <div key={l.name} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:l.color }}/>
                    <span style={{ fontSize:11, color:'var(--text2)' }}>{l.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Streak + Radar */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <Card style={{ background:'linear-gradient(140deg,#2a1208 0%,#1a0a04 100%)', border:'none' }} className="animate-fade-up d6">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.07em', textTransform:'uppercase' }}>Streak Stats</span>
                <FireIcon size={22} color="var(--orange)"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {[[streak,'Current','#fb923c'],[longestStreak,'Best ever','var(--gold)']].map(([val,label,c]) => (
                  <div key={label} style={{ background:'rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 12px', border:'1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize:34, fontWeight:900, color:c, letterSpacing:'-0.04em', lineHeight:1 }}>{val}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Last 28 days</div>
              <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                {Array.from({length:28},(_,i) => {
                  const active = i < streak || (i < streak+4 && i%3!==0)
                  return <div key={i} style={{ width:15, height:15, borderRadius:3, background:active?(i<streak?'#fb923c':'rgba(255,255,255,0.18)'):'rgba(255,255,255,0.05)' }}/>
                })}
              </div>
            </Card>

            <Card className="animate-fade-up d6">
              <SectionLabel>Skill Radar</SectionLabel>
              <ResponsiveContainer width="100%" height={210}>
                <RadarChart data={radarData} margin={{ top:4, right:20, bottom:4, left:20 }}>
                  <PolarGrid stroke="var(--border)"/>
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize:11, fill:'var(--text3)', fontFamily:'Inter,sans-serif', fontWeight:600 }}/>
                  <Radar dataKey="A" stroke="var(--br2)" fill="var(--br2)" fillOpacity={0.18} strokeWidth={2.5} dot={{ fill:'var(--br2)', r:4, stroke:'var(--surface)', strokeWidth:2 }}/>
                  <Tooltip content={<CT/>}/>
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Topics */}
          {topTopics?.length > 0 && <TopicsCard topics={topTopics}/>}

          {/* Repo categories + Tech stack */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <Card className="animate-fade-up d7">
              <SectionLabel>Project Categories</SectionLabel>
              {repoTypes.length>0 ? repoTypes.map(({ type, count, color }) => (
                <div key={type} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
                  <div style={{ width:9, height:9, borderRadius:2.5, background:color, flexShrink:0 }}/>
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--text2)', width:76, flexShrink:0 }}>{type}</span>
                  <div style={{ flex:1, height:6, background:'var(--bg2)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:(count/(repoTypes[0]?.count||1)*100)+'%', height:'100%', background:color, borderRadius:3, transition:'width 0.9s ease' }}/>
                  </div>
                  <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600, width:20, textAlign:'right' }}>{count}</span>
                </div>
              )) : <p style={{ fontSize:13, color:'var(--text4)', fontStyle:'italic' }}>Not enough data</p>}
            </Card>

            <Card className="animate-fade-up d7">
              <SectionLabel>Tech Stack</SectionLabel>
              {[['Backend',stack.back,'var(--blue)'],['Frontend',stack.front,'var(--green)'],['Infra / Shell',stack.infra,'var(--amber)']].map(([lbl,items,accent]) =>
                items?.length>0 && (
                  <div key={lbl} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:accent, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:7 }}>{lbl}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                      {items.map(l => (
                        <span key={l.name} style={{ fontSize:12, padding:'4px 10px', borderRadius:20, background:l.color+'1a', border:`1px solid ${l.color}33`, color:l.color, fontWeight:600 }}>{l.name}</span>
                      ))}
                    </div>
                  </div>
                )
              )}
            </Card>
          </div>

          {/* Repo health grid */}
          <RepoHealthGrid repos={topByStars}/>

          {/* Extra stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(185px,1fr))', gap:10, marginBottom:14 }}>
            {[
              { icon:<EyeIcon size={14} color="var(--br3)"/>,    label:'Total Watchers',       value:fmt(totalWatchers||0) },
              { icon:<UsersIcon size={14} color="var(--blue)"/>, label:'Following',             value:fmt(user.following) },
              { icon:<MedalIcon size={14} color="var(--amber)"/>,label:'Public Gists',          value:fmt(user.public_gists||0) },
            ].map(({ icon, label, value }) => (
              <Card key={label} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:'-0.02em' }}>{value}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>{label}</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── REPOS TAB ── */}
      {activeTab==='repos' && (
        <>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }} className="animate-fade-up">
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>All Repositories</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{nonForkCount} repos · {fmt(totalStars)} stars · {fmt(totalForks)} forks</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ display:'flex', gap:3, background:'var(--bg2)', borderRadius:8, padding:3 }}>
                {[['stars','Stars'],['forks','Forks'],['health','Health'],['updated','Recent'],['issues','Issues']].map(([s,label]) => (
                  <button key={s} onClick={()=>setRepoSort(s)} style={{ padding:'5px 10px', border:'none', borderRadius:6, background:repoSort===s?'var(--surface)':'transparent', color:repoSort===s?'var(--text)':'var(--text3)', fontWeight:600, fontSize:11, cursor:'pointer', boxShadow:repoSort===s?'var(--shadow)':'none', transition:'all 0.15s', fontFamily:'Inter' }}>{label}</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:3, background:'var(--bg2)', borderRadius:8, padding:3 }}>
                {[['grid',<GridIcon size={13}/>],['list',<ListIcon size={13}/>]].map(([v,ic]) => (
                  <button key={v} onClick={()=>setRepoView(v)} style={{ width:30, height:28, border:'none', borderRadius:6, background:repoView===v?'var(--surface)':'transparent', color:repoView===v?'var(--text)':'var(--text3)', cursor:'pointer', transition:'all 0.15s', fontFamily:'Inter', boxShadow:repoView===v?'var(--shadow)':'none', display:'flex', alignItems:'center', justifyContent:'center' }}>{ic}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:repoView==='grid'?'grid':'flex', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', flexDirection:'column', gap:10 }} className="animate-fade-up d2">
            {sortedRepos.map(r => (
              <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:repoView==='grid'?'16px 18px':'13px 16px', cursor:'pointer', transition:'border-color 0.2s,box-shadow 0.2s', display:repoView==='list'?'flex':'block', alignItems:repoView==='list'?'center':undefined, gap:repoView==='list'?16:undefined }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--br3)';e.currentTarget.style.boxShadow='0 4px 16px rgba(61,32,16,0.1)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}>
                  {repoView==='grid' ? (
                    <>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8, gap:8 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--blue)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'68%' }}>{r.name}</div>
                        <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                          <span style={{ fontSize:11, padding:'2px 7px', borderRadius:20, background:(REPO_TYPE_COLORS[r.type]||'#a08060')+'18', color:REPO_TYPE_COLORS[r.type]||'#a08060', fontWeight:600 }}>{r.type}</span>
                        </div>
                      </div>
                      <p style={{ fontSize:12, color:'var(--text3)', lineHeight:1.55, marginBottom:10, minHeight:36, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{r.desc||'No description'}</p>
                      {r.topics.length>0 && <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>{r.topics.slice(0,3).map(t=><span key={t} style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:'var(--bg2)', color:'var(--text3)', fontWeight:500 }}>{t}</span>)}</div>}
                      {/* Health bar */}
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}>
                        <span style={{ fontSize:10, color:'var(--text4)', width:38 }}>Health</span>
                        <div style={{ flex:1, height:4, background:'var(--bg2)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ width:r.health+'%', height:'100%', background:r.health>=70?'var(--green)':r.health>=45?'var(--amber)':'var(--red)', borderRadius:2 }}/>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:r.health>=70?'var(--green)':r.health>=45?'var(--amber)':'var(--red)', width:24, textAlign:'right' }}>{r.health}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid var(--border)', paddingTop:10 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <div style={{ width:9, height:9, borderRadius:'50%', background:LANG_COLORS[r.lang]||'#a08060' }}/>
                          <span style={{ fontSize:11, color:'var(--text3)' }}>{r.lang}</span>
                        </div>
                        <div style={{ display:'flex', gap:10 }}>
                          <span style={{ fontSize:12, color:'#d97706', fontWeight:700, display:'flex', alignItems:'center', gap:3 }}><StarIcon size={11} color="#d97706"/>{fmt(r.stars)}</span>
                          <span style={{ fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:3 }}><ForkIcon size={10} color="var(--text4)"/>{fmt(r.forks)}</span>
                        </div>
                        <span style={{ fontSize:11, color:'var(--text4)' }}>{timeAgo(r.updated)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                          <span style={{ fontSize:14, fontWeight:700, color:'var(--blue)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
                          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background:(REPO_TYPE_COLORS[r.type]||'#a08060')+'18', color:REPO_TYPE_COLORS[r.type]||'#a08060', fontWeight:600, flexShrink:0 }}>{r.type}</span>
                        </div>
                        <p style={{ fontSize:12, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.desc||'No description'}</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
                        <div style={{ width:48, height:4, background:'var(--bg2)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ width:r.health+'%', height:'100%', background:r.health>=70?'var(--green)':r.health>=45?'var(--amber)':'var(--red)', borderRadius:2 }}/>
                        </div>
                        <span style={{ fontSize:13, color:'#d97706', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}><StarIcon size={12} color="#d97706"/>{fmt(r.stars)}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:8, height:8, borderRadius:'50%', background:LANG_COLORS[r.lang]||'#a08060' }}/><span style={{ fontSize:11, color:'var(--text3)' }}>{r.lang}</span></div>
                        <span style={{ fontSize:11, color:'var(--text4)', minWidth:54, textAlign:'right' }}>{timeAgo(r.updated)}</span>
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
      {activeTab==='activity' && (
        <>
          <Card style={{ marginBottom:14 }} className="animate-fade-up d1">
            <SectionLabel>Commit Trend (12 months)</SectionLabel>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={monthlyCommits} margin={{ top:4, right:4, bottom:0, left:-22 }}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--br2)" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="var(--br2)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg3)" vertical={false}/>
                <XAxis dataKey="month" tick={{ fontSize:10, fill:'var(--text4)', fontFamily:'Inter' }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'var(--text4)', fontFamily:'Inter' }} tickLine={false} axisLine={false}/>
                <Tooltip content={<CT/>}/>
                <Area type="monotone" dataKey="commits" stroke="var(--br2)" fill="url(#cg)" strokeWidth={2.5} dot={false} activeDot={{ r:5, fill:'var(--br2)', stroke:'var(--surface)', strokeWidth:2 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card style={{ marginBottom:14 }} className="animate-fade-up d2">
            <SectionLabel right={
              <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--text3)' }}>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><FireIcon size={13} color="var(--orange)"/><b style={{ color:'var(--text)' }}>{streak}d</b> streak</span>
                <span>Best: <b style={{ color:'var(--text)' }}>{longestStreak}d</b></span>
              </div>
            }>Contribution Heatmap</SectionLabel>
            <Heatmap grid={contribGrid}/>
          </Card>

          <Card className="animate-fade-up d3">
            <SectionLabel>Recent Public Activity</SectionLabel>
            {activity.length>0 ? (
              <div>
                {activity.map((a, i) => (
                  <div key={i} style={{ display:'flex', gap:12, padding:'11px 0', borderBottom:i<activity.length-1?'1px solid var(--border)':'none', alignItems:'flex-start' }}>
                    <div style={{ width:32, height:32, borderRadius:9, background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <div style={{ width:9, height:9, borderRadius:'50%', background:ACT_COLORS[a.type]||'var(--text3)' }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.msg}</div>
                      <div style={{ fontSize:11, color:'var(--text4)', marginTop:3, display:'flex', gap:8 }}>
                        {a.repo && <span style={{ fontWeight:600, color:'var(--br3)' }}>{a.repo}</span>}
                        <span>{timeAgo(a.time)}</span>
                        <span style={{ padding:'1px 7px', borderRadius:20, background:'var(--bg2)', color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', fontSize:10 }}>{ACT_LABELS[a.type]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'28px 0', color:'var(--text4)', fontSize:14 }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}><ActivityIcon size={28} color="var(--border2)"/></div>
                No recent public activity
              </div>
            )}
          </Card>
        </>
      )}

      {/* Footer */}
      <div style={{ textAlign:'center', padding:'32px 0 0', borderTop:'1px solid var(--border)', marginTop:32 }}>
        <div style={{ fontSize:13, color:'var(--text3)' }}>
          Powered by <a href={BRAND.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--br2)', fontWeight:700, textDecoration:'none' }}>{BRAND.appName}</a>
          {' · '}Made by <a href={BRAND.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--br3)', fontWeight:700, textDecoration:'none' }}>{BRAND.madeBy}</a>
        </div>
        <div style={{ fontSize:11, color:'var(--text4)', marginTop:4 }}>
          <a href={BRAND.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--text4)', textDecoration:'none' }}>{BRAND.website}</a>
          {' · '}
          <a href={BRAND.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--text4)', textDecoration:'none' }}>{BRAND.portfolio}</a>
        </div>
      </div>
    </div>
  )
}
