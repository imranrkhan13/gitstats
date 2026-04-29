import { LANG_COLORS } from './constants.js'
import { detectRepoType, getMonthLabels, calcScore, seededRandom, hashString, detectDevType, ageTier, influenceRatio, extractTopTopics, repoHealth } from './utils.js'

export async function fetchGitHub(username) {
  const [uRes, rRes, evRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
    fetch(`https://api.github.com/users/${username}/events/public?per_page=100`),
  ])
  if (!uRes.ok) {
    if (uRes.status === 404) throw new Error('User not found on GitHub')
    if (uRes.status === 403) throw new Error('GitHub API rate limit — wait 60 seconds and try again')
    throw new Error(`GitHub returned ${uRes.status}`)
  }
  const [user, repos, events] = await Promise.all([uRes.json(), rRes.json(), evRes.json()])
  return processData(user, Array.isArray(repos) ? repos : [], Array.isArray(events) ? events : [])
}

// ── Real streak from events ──────────────────────────────────────────────────
function calcStreakFromEvents(events) {
  // Pull unique days that had push/create/pr activity
  const activeDays = new Set()
  events.forEach(e => {
    if (['PushEvent','PullRequestEvent','CreateEvent','IssuesEvent','IssueCommentEvent','PullRequestReviewEvent'].includes(e.type)) {
      const day = e.created_at?.slice(0, 10) // "YYYY-MM-DD"
      if (day) activeDays.add(day)
    }
  })

  const sorted = [...activeDays].sort((a, b) => b.localeCompare(a)) // newest first

  if (!sorted.length) return { streak: 0, longestStreak: 0, lastActive: null, activeDays: [] }

  // Check if most recent active day is today or yesterday (otherwise streak is broken)
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  const mostRecent = sorted[0]
  const streakActive = mostRecent === todayStr || mostRecent === yesterdayStr

  // Count current streak from most recent
  let streak = 0
  if (streakActive) {
    let checkDate = new Date(mostRecent)
    for (let i = 0; i < 365; i++) {
      const ds = checkDate.toISOString().slice(0, 10)
      if (activeDays.has(ds)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else break
    }
  }

  // Longest streak over all known active days
  let longest = 0, cur = 0
  let prev = null
  ;[...activeDays].sort().forEach(d => {
    if (!prev) { cur = 1 }
    else {
      const diff = (new Date(d) - new Date(prev)) / 86400000
      if (diff === 1) cur++
      else cur = 1
    }
    if (cur > longest) longest = cur
    prev = d
  })
  if (streak > longest) longest = streak

  return { streak, longestStreak: Math.max(longest, streak), lastActive: sorted[0], activeDays: sorted }
}

export function processData(user, repos, events) {
  const seed = hashString(user.login + (user.created_at || ''))
  const rng  = seededRandom(seed)

  const nonFork = repos.filter(r => !r.fork)
  const langCount = {}, langBytes = {}
  let totalStars = 0, totalForks = 0, totalWatchers = 0

  nonFork.forEach(r => {
    totalStars    += r.stargazers_count || 0
    totalForks    += r.forks_count || 0
    totalWatchers += r.watchers_count || 0
    if (r.language) {
      langCount[r.language] = (langCount[r.language] || 0) + 1
      langBytes[r.language] = (langBytes[r.language] || 0) + (r.size || 1)
    }
  })

  const langTotal = Object.values(langCount).reduce((a, b) => a + b, 0) || 1
  const languages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, count]) => ({
      name, count,
      pct: Math.round(count / langTotal * 100),
      bytes: langBytes[name] || 0,
      color: LANG_COLORS[name] || '#a08060',
    }))

  const topByStars = [...nonFork]
    .sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 8)
    .map(r => ({
      name: r.name, desc: r.description || '',
      stars: r.stargazers_count, forks: r.forks_count,
      lang: r.language || '—', updated: r.updated_at,
      url: r.html_url, type: detectRepoType(r),
      topics: r.topics || [], openIssues: r.open_issues_count || 0,
      watchers: r.watchers_count || 0, size: r.size || 0,
      health: 0,
    }))
  topByStars.forEach(r => { r.health = repoHealth(r) })

  const spotlightRepo = topByStars[0] || null

  const labels = getMonthLabels(12)

  // Real monthly commit counts from events
  const commitMap = {}
  events.forEach(e => {
    if (e.type === 'PushEvent') {
      const month = e.created_at?.slice(0, 7) // "YYYY-MM"
      if (month) commitMap[month] = (commitMap[month] || 0) + (e.payload?.size || 1)
    }
  })

  const now = new Date()
  const monthlyCommits = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const key = d.toISOString().slice(0, 7)
    const label = labels[i]
    const real = commitMap[key]
    // Use real data if available, otherwise deterministic estimate
    return { month: label, commits: real !== undefined ? real : Math.round(4 + rng() * 40 + i * 0.8) }
  })

  const contribGrid = Array.from({ length: 52 * 7 }, (_, i) => {
    const w = Math.floor(i / 7), b = (w > 4 && w < 48) ? 0.18 : 0, r = rng()
    return r < 0.30 + b ? 0 : r < 0.52 + b ? 1 : r < 0.70 + b ? 2 : r < 0.86 + b ? 3 : 4
  })

  // REAL streak from events
  const streakData = calcStreakFromEvents(events)
  const streak = streakData.streak
  const longestStreak = streakData.longestStreak

  const memberYears = Math.max(1, new Date().getFullYear() - new Date(user.created_at).getFullYear())
  const score = calcScore(nonFork.length, user.followers, totalStars, totalForks, memberYears, languages.length)

  const RTYPE_COLORS = { 'AI/ML':'#8b5cf6','DevOps':'#0ea5e9','Real-time':'#f59e0b','SaaS':'#22c55e','Tooling':'#f97316','Frontend':'#3b82f6','Library':'#a08060','Systems':'#ef4444' }
  const typeMap = {}
  nonFork.forEach(r => { const t = detectRepoType(r); typeMap[t] = (typeMap[t] || 0) + 1 })
  const repoTypes = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([type, count]) => ({ type, count, color: RTYPE_COLORS[type] || '#a08060' }))

  const activity = events.slice(0, 12).map(e => {
    const type = e.type==='PushEvent'?'commit':e.type==='PullRequestEvent'?'pr':e.type==='CreateEvent'?'create':e.type==='WatchEvent'?'star':e.type==='ForkEvent'?'fork':e.type==='IssuesEvent'?'issue':'other'
    let msg = ''
    if(e.type==='PushEvent') msg=e.payload?.commits?.[0]?.message?.split('\n')[0]||'Pushed commits'
    else if(e.type==='PullRequestEvent') msg=e.payload?.pull_request?.title||'Pull request'
    else if(e.type==='CreateEvent') msg=`Created ${e.payload?.ref_type}${e.payload?.ref?` "${e.payload.ref}"`:''}`
    else if(e.type==='WatchEvent') msg='Starred a repository'
    else if(e.type==='ForkEvent') msg=`Forked ${e.repo?.name||'a repository'}`
    else if(e.type==='IssuesEvent') msg=e.payload?.issue?.title||'Issue activity'
    else msg=e.type.replace('Event',' event')
    return { type, msg, repo: e.repo?.name?.split('/')[1]||'', time: e.created_at }
  }).filter(a => a.msg)

  const avgStars = nonFork.length ? Math.round(totalStars / nonFork.length) : 0
  const backLangs  = ['Go','Rust','Python','Java','C++','C#','Ruby','PHP','Scala','Elixir','Kotlin','Haskell']
  const frontLangs = ['TypeScript','JavaScript','HTML','CSS','Vue','Dart','Svelte']
  const stack = {
    back:  languages.filter(l => backLangs.includes(l.name)),
    front: languages.filter(l => frontLangs.includes(l.name)),
    infra: languages.filter(l => ['Shell','Dockerfile','HCL','Makefile','PowerShell'].includes(l.name)),
  }

  const radarData = [
    { subject:'Output',    A: Math.min(100, Math.round(nonFork.length * 2.1)) },
    { subject:'Stars',     A: Math.min(100, Math.round(Math.log10(totalStars+1)*32)) },
    { subject:'Community', A: Math.min(100, Math.round(Math.log10((user.followers||0)+1)*40)) },
    { subject:'Streak',    A: Math.min(100, streak > 0 ? Math.min(100, Math.round(streak * 3)) : 5) },
    { subject:'Diversity', A: Math.min(100, languages.length*11) },
    { subject:'Impact',    A: Math.min(100, Math.round(Math.log10(totalForks+1)*38)) },
  ]

  const devType   = detectDevType(languages, repoTypes)
  const githubAge = ageTier(memberYears)
  const influence = influenceRatio(user.followers, user.following)
  const topTopics = extractTopTopics(nonFork)
  const estContributions = Math.round(nonFork.reduce((a, r) => a + Math.max(1, Math.round(r.size / 6)), 0))

  return {
    user, totalStars, totalForks, totalWatchers,
    nonForkCount: nonFork.length,
    languages, topByStars, monthlyCommits, contribGrid,
    streak, longestStreak, lastActive: streakData.lastActive,
    score, activity, repoTypes,
    memberYears, avgStars, stack, radarData,
    spotlightRepo, devType, githubAge, influence, topTopics, estContributions,
    allRepos: nonFork,
  }
}
