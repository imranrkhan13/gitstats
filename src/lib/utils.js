import { MONTHS } from './constants.js'

export const fmt = n => { if(!n&&n!==0)return'0'; if(n>=1e6)return(n/1e6).toFixed(1)+'M'; if(n>=1000)return(n/1000).toFixed(1)+'k'; return String(n) }
export const fmtFull = n => n?.toLocaleString() || '0'
export const fmtDate = s => s ? new Date(s).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : ''
export const timeAgo = s => { if(!s)return''; const d=Math.floor((Date.now()-new Date(s))/86400000); if(d===0)return'today'; if(d<2)return'1d ago'; if(d<30)return d+'d ago'; if(d<365)return Math.floor(d/30)+'mo ago'; return Math.floor(d/365)+'yr ago' }

export const detectRepoType = r => {
  const t=([...(r.topics||[]),r.description||'']).join(' ').toLowerCase()
  if(/llm|gpt|ai|ml|neural|langchain|openai|hugging/.test(t))return'AI/ML'
  if(/k8s|kubernetes|docker|terraform|devops|helm|ansible|ci|cd/.test(t))return'DevOps'
  if(/real.?time|crdt|websocket|socket\.io/.test(t))return'Real-time'
  if(/saas|dashboard|api|backend|server|express|fastapi|django/.test(t))return'SaaS'
  if(/cli|tool|plugin|extension|utility|helper/.test(t))return'Tooling'
  if(/react|vue|angular|next|svelte|frontend|ui|component/.test(t))return'Frontend'
  if(/rust|zig|systems|c\+\+|embedded|firmware/.test(t))return'Systems'
  return'Library'
}

export const getMonthLabels = n => {
  const now=new Date()
  return Array.from({length:n},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-(n-1-i),1)
    return MONTHS[d.getMonth()]+(d.getMonth()===0||i===0?` '${String(d.getFullYear()).slice(2)}`:'')
  })
}

// Fully deterministic score — same inputs always same output
export const calcScore = (repos,followers,stars,forks,memberYears,langCount) => {
  const repoScore     = Math.min(25, Math.log2(repos+1)*5.2)
  const followerScore = Math.min(22, Math.log10(followers+1)*9.5)
  const starScore     = Math.min(25, Math.log10(stars+1)*9.5)
  const forkScore     = Math.min(10, Math.log10(forks+1)*5)
  const tenureScore   = Math.min(10, memberYears*1.4)
  const diversityScore= Math.min(8,  langCount*0.9)
  return Math.min(100, Math.round(repoScore+followerScore+starScore+forkScore+tenureScore+diversityScore))
}

export const scoreLabel = s => s>=88?'Elite':s>=72?'Expert':s>=55?'Senior':s>=38?'Mid-level':s>=22?'Junior':'Beginner'
export const scoreColor = s => s>=80?'#22c55e':s>=60?'#f59e0b':s>=40?'#f97316':'#ef4444'

// Deterministic seeded RNG — same username = same decorative data every time
export const seededRandom = seed => {
  let s=seed
  return ()=>{ s=(s*1664525+1013904223)&0xffffffff; return(s>>>0)/0xffffffff }
}

export const hashString = str => {
  let h=0
  for(let i=0;i<str.length;i++){ h=((h<<5)-h)+str.charCodeAt(i); h|=0 }
  return Math.abs(h)
}

// Detect developer type from language mix
export const detectDevType = (languages, repoTypes) => {
  const names = languages.map(l=>l.name)
  const backLangs = ['Go','Rust','Python','Java','C++','C#','Ruby','PHP','Scala','Elixir','Kotlin']
  const frontLangs = ['TypeScript','JavaScript','HTML','CSS','Vue','Dart','Svelte']
  const hasBack  = names.filter(n=>backLangs.includes(n)).length
  const hasFront = names.filter(n=>frontLangs.includes(n)).length
  const hasInfra = names.filter(n=>['Shell','Dockerfile','HCL'].includes(n)).length
  const hasML    = repoTypes?.some(r=>r.type==='AI/ML')
  const hasDevOps= repoTypes?.some(r=>r.type==='DevOps') || hasInfra>0

  if(hasML) return { label:'AI/ML Engineer', color:'#8b5cf6', desc:'Builds machine learning & AI systems' }
  if(hasDevOps && hasBack>1) return { label:'DevOps Engineer', color:'#0ea5e9', desc:'Infrastructure, CI/CD & backend systems' }
  if(hasBack>=3 && hasFront>=2) return { label:'Full-stack Engineer', color:'#22c55e', desc:'Comfortable across the entire stack' }
  if(hasBack>=2 && hasFront<=1) return { label:'Backend Engineer', color:'#f59e0b', desc:'Server-side systems & APIs' }
  if(hasFront>=2 && hasBack<=1) return { label:'Frontend Engineer', color:'#3b82f6', desc:'UI, components & web experiences' }
  if(names.includes('Rust')||names.includes('C++')||names.includes('Zig')) return { label:'Systems Engineer', color:'#ef4444', desc:'Low-level, performance-critical code' }
  return { label:'Software Engineer', color:'#a08060', desc:'Versatile generalist developer' }
}

// GitHub age tier
export const ageTier = years => {
  if(years>=8) return { label:'Veteran', color:'#f5c842', desc:`${years}yr on GitHub` }
  if(years>=4) return { label:'Experienced', color:'#22c55e', desc:`${years}yr on GitHub` }
  if(years>=2) return { label:'Active', color:'#3b82f6', desc:`${years}yr on GitHub` }
  return { label:'Rising', color:'#f97316', desc:`${years}yr on GitHub` }
}

// Influence ratio
export const influenceRatio = (followers, following) => {
  if(!following) return followers>0?99:1
  const r = followers/following
  if(r>=10) return { label:'High influence', color:'#f5c842', ratio: r.toFixed(1)+'x' }
  if(r>=2)  return { label:'Growing influence', color:'#22c55e', ratio: r.toFixed(1)+'x' }
  if(r>=0.5)return { label:'Balanced', color:'#3b82f6', ratio: r.toFixed(1)+'x' }
  return { label:'Explorer', color:'#a08060', ratio: r.toFixed(2)+'x' }
}

// Extract top topics from all repos
export const extractTopTopics = repos => {
  const counts = {}
  repos.forEach(r => (r.topics||[]).forEach(t=>{ counts[t]=(counts[t]||0)+1 }))
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([name,count])=>({name,count}))
}

// Per-repo health score
export const repoHealth = r => {
  let score = 0
  if(r.stars>0)      score += Math.min(30, Math.log10(r.stars+1)*15)
  if(r.forks>0)      score += Math.min(25, Math.log10(r.forks+1)*14)
  if(r.watchers>0)   score += Math.min(15, Math.log10(r.watchers+1)*10)
  if(r.desc)         score += 10
  if(r.topics?.length>0) score += Math.min(10, r.topics.length*2)
  if(r.openIssues>0) score += Math.min(10, r.openIssues*1.5) // issues = people care
  return Math.min(100, Math.round(score))
}
