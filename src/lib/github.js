// github.js — GitStatus data layer
// Changes vs original:
//  • Better streak: uses real dates with UTC-safe comparison, counts today OR yesterday
//  • Pulls PR count, Review count, Issue count from events
//  • Event type breakdown pie data
//  • Most active day-of-week & hour-of-day from events
//  • Repo creation timeline (sorted by pushed_at)
//  • Pinned-style "recently active" repos surfaced separately
//  • Commit messages extracted for word cloud data

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

// ── UTC-safe "today" and "yesterday" strings ─────────────────────────────────
function utcToday() {
  return new Date().toISOString().slice(0, 10)
}
function utcYesterday() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}
function daysBetween(a, b) {
  // Returns positive integer — number of calendar days between two "YYYY-MM-DD" strings
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}

// ── Real streak from events ──────────────────────────────────────────────────
function calcStreakFromEvents(events) {
  const ACTIVITY_TYPES = new Set([
    'PushEvent', 'PullRequestEvent', 'CreateEvent',
    'IssuesEvent', 'IssueCommentEvent', 'PullRequestReviewEvent',
    'PullRequestReviewCommentEvent', 'CommitCommentEvent',
  ])

  const activeDays = new Set()
  events.forEach(e => {
    if (ACTIVITY_TYPES.has(e.type) && e.created_at) {
      activeDays.add(e.created_at.slice(0, 10))
    }
  })

  const sorted = [...activeDays].sort((a, b) => b.localeCompare(a)) // newest first
  if (!sorted.length) return { streak: 0, longestStreak: 0, lastActive: null, activeDays: [] }

  const today = utcToday()
  const yesterday = utcYesterday()
  const mostRecent = sorted[0]

  // Streak is only "alive" if last activity was today or yesterday
  const streakAlive = mostRecent === today || mostRecent === yesterday

  // Count current streak backwards from mostRecent
  let streak = 0
  if (streakAlive) {
    // Walk backwards day-by-day from mostRecent
    const startDate = new Date(mostRecent + 'T00:00:00Z')
    for (let i = 0; i < 365; i++) {
      const ds = startDate.toISOString().slice(0, 10)
      if (activeDays.has(ds)) {
        streak++
        startDate.setUTCDate(startDate.getUTCDate() - 1)
      } else {
        break
      }
    }
  }

  // Longest streak over all known active days
  const allSorted = [...activeDays].sort()
  let longest = 0, cur = 0, prev = null
  allSorted.forEach(d => {
    if (!prev) {
      cur = 1
    } else {
      const diff = daysBetween(prev, d)
      cur = diff === 1 ? cur + 1 : 1
    }
    if (cur > longest) longest = cur
    prev = d
  })
  longest = Math.max(longest, streak)

  return { streak, longestStreak: longest, lastActive: sorted[0], activeDays: sorted }
}

// ── Event stats — PR count, review count, issues opened ─────────────────────
function calcEventStats(events) {
  let pushCount = 0, prCount = 0, reviewCount = 0, issueCount = 0,
      createCount = 0, starCount = 0, forkCount = 0

  const dayOfWeekCounts = Array(7).fill(0)   // 0=Sun … 6=Sat
  const hourCounts      = Array(24).fill(0)  // 0-23 UTC
  const commitMessages  = []
  let totalCommits = 0

  events.forEach(e => {
    const d = e.created_at ? new Date(e.created_at) : null
    if (d) {
      dayOfWeekCounts[d.getUTCDay()]++
      hourCounts[d.getUTCHours()]++
    }
    switch (e.type) {
      case 'PushEvent':
        pushCount++
        totalCommits += e.payload?.size || 1
        ;(e.payload?.commits || []).slice(0, 2).forEach(c => {
          const msg = c.message?.split('\n')[0]?.trim()
          if (msg && msg.length > 3 && msg.length < 80) commitMessages.push(msg)
        })
        break
      case 'PullRequestEvent':    prCount++;     break
      case 'PullRequestReviewEvent': reviewCount++; break
      case 'IssuesEvent':         issueCount++;  break
      case 'CreateEvent':         createCount++; break
      case 'WatchEvent':          starCount++;   break
      case 'ForkEvent':           forkCount++;   break
    }
  })

  // Most active day-of-week
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const mostActiveDayIdx = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))
  const mostActiveDay = DAY_NAMES[mostActiveDayIdx]

  // Most active hour bucket
  const mostActiveHourIdx = hourCounts.indexOf(Math.max(...hourCounts))
  const mostActiveHour = mostActiveHourIdx < 6 ? 'Late night 🌙'
    : mostActiveHourIdx < 12 ? 'Morning ☀️'
    : mostActiveHourIdx < 17 ? 'Afternoon 🌤'
    : mostActiveHourIdx < 21 ? 'Evening 🌆'
    : 'Night 🌙'

  // Event breakdown for pie chart
  const eventBreakdown = [
    { name: 'Commits', value: pushCount,   color: 'var(--br2)' },
    { name: 'PRs',     value: prCount,     color: 'var(--blue)' },
    { name: 'Reviews', value: reviewCount, color: '#8b5cf6' },
    { name: 'Issues',  value: issueCount,  color: 'var(--red)' },
    { name: 'Created', value: createCount, color: 'var(--green)' },
    { name: 'Stars',   value: starCount,   color: 'var(--amber)' },
    { name: 'Forks',   value: forkCount,   color: 'var(--purple)' },
  ].filter(e => e.value > 0)

  // Day-of-week activity chart
  const dayActivity = DAY_NAMES.map((name, i) => ({ name, count: dayOfWeekCounts[i] }))

  return {
    pushCount, prCount, reviewCount, issueCount, createCount,
    starCount, forkCount, totalCommits,
    mostActiveDay, mostActiveHour,
    eventBreakdown, dayActivity, commitMessages,
  }
}

// ── Monthly commits from events ───────────────────────────────────────────────
function buildMonthlyCommits(events, rng) {
  const commitMap = {}
  events.forEach(e => {
    if (e.type === 'PushEvent' && e.created_at) {
      const month = e.created_at.slice(0, 7)
      commitMap[month] = (commitMap[month] || 0) + (e.payload?.size || 1)
    }
  })

  const labels = getMonthLabels(12)
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const key = d.toISOString().slice(0, 7)
    const real = commitMap[key]
    // Mark real vs estimated so UI can show a badge
    return {
      month: labels[i],
      commits: real !== undefined ? real : Math.round(4 + rng() * 40 + i * 0.8),
      isReal: real !== undefined,
    }
  })
}

// ── Repo creation timeline ────────────────────────────────────────────────────
function buildRepoTimeline(repos) {
  return [...repos]
    .filter(r => r.created_at)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-20) // last 20
    .map(r => ({
      name: r.name,
      created: r.created_at.slice(0, 7),
      stars: r.stargazers_count || 0,
      lang: r.language || '—',
    }))
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

  // Recently active repos (different from top by stars)
  const recentlyActive = [...nonFork]
    .sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0))
    .slice(0, 6)
    .map(r => ({
      name: r.name, desc: r.description || '',
      stars: r.stargazers_count, forks: r.forks_count,
      lang: r.language || '—', updated: r.pushed_at || r.updated_at,
      url: r.html_url, type: detectRepoType(r),
      topics: r.topics || [], openIssues: r.open_issues_count || 0,
    }))

  const spotlightRepo = topByStars[0] || null

  const monthlyCommits = buildMonthlyCommits(events, rng)

  // Heatmap (seeded decorative — GitHub doesn't expose this via REST)
  const contribGrid = Array.from({ length: 52 * 7 }, (_, i) => {
    const w = Math.floor(i / 7), b = (w > 4 && w < 48) ? 0.18 : 0, r = rng()
    return r < 0.30 + b ? 0 : r < 0.52 + b ? 1 : r < 0.70 + b ? 2 : r < 0.86 + b ? 3 : 4
  })

  // Real streak
  const streakData = calcStreakFromEvents(events)
  const { streak, longestStreak } = streakData

  // Event stats
  const eventStats = calcEventStats(events)

  // Repo timeline
  const repoTimeline = buildRepoTimeline(nonFork)

  // Activity feed
  const activity = events.slice(0, 20).map(e => {
    const type = e.type === 'PushEvent' ? 'commit'
      : e.type === 'PullRequestEvent' ? 'pr'
      : e.type === 'PullRequestReviewEvent' ? 'review'
      : e.type === 'CreateEvent' ? 'create'
      : e.type === 'WatchEvent' ? 'star'
      : e.type === 'ForkEvent' ? 'fork'
      : e.type === 'IssuesEvent' ? 'issue'
      : 'other'
    let msg = ''
    if (e.type === 'PushEvent')
      msg = e.payload?.commits?.[0]?.message?.split('\n')[0] || 'Pushed commits'
    else if (e.type === 'PullRequestEvent')
      msg = `${e.payload?.action === 'opened' ? 'Opened PR' : e.payload?.action === 'merged' ? 'Merged PR' : 'PR activity'}: ${e.payload?.pull_request?.title || ''}`
    else if (e.type === 'PullRequestReviewEvent')
      msg = `Reviewed PR: ${e.payload?.pull_request?.title || ''}`
    else if (e.type === 'CreateEvent')
      msg = `Created ${e.payload?.ref_type}${e.payload?.ref ? ` "${e.payload.ref}"` : ''}`
    else if (e.type === 'WatchEvent')
      msg = `Starred ${e.repo?.name || 'a repository'}`
    else if (e.type === 'ForkEvent')
      msg = `Forked ${e.repo?.name || 'a repository'}`
    else if (e.type === 'IssuesEvent')
      msg = `${e.payload?.action === 'opened' ? 'Opened issue' : 'Issue activity'}: ${e.payload?.issue?.title || ''}`
    else if (e.type === 'IssueCommentEvent')
      msg = `Commented on issue: ${e.payload?.issue?.title || ''}`
    else
      msg = e.type.replace('Event', ' event')
    return { type, msg, repo: e.repo?.name?.split('/')[1] || '', time: e.created_at }
  }).filter(a => a.msg)

  const memberYears = Math.max(1, new Date().getFullYear() - new Date(user.created_at).getFullYear())
  const score = calcScore(nonFork.length, user.followers, totalStars, totalForks, memberYears, languages.length)

  const RTYPE_COLORS = { 'AI/ML':'#8b5cf6','DevOps':'#0ea5e9','Real-time':'#f59e0b','SaaS':'#22c55e','Tooling':'#f97316','Frontend':'#3b82f6','Library':'#a08060','Systems':'#ef4444' }
  const typeMap = {}
  nonFork.forEach(r => { const t = detectRepoType(r); typeMap[t] = (typeMap[t] || 0) + 1 })
  const repoTypes = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([type, count]) => ({ type, count, color: RTYPE_COLORS[type] || '#a08060' }))

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

  const devType        = detectDevType(languages, repoTypes)
  const githubAge      = ageTier(memberYears)
  const influence      = influenceRatio(user.followers, user.following)
  const topTopics      = extractTopTopics(nonFork)
  const estContributions = Math.round(nonFork.reduce((a, r) => a + Math.max(1, Math.round(r.size / 6)), 0))

  return {
    user, totalStars, totalForks, totalWatchers,
    nonForkCount: nonFork.length,
    languages, topByStars, recentlyActive,
    monthlyCommits, contribGrid,
    streak, longestStreak,
    lastActive: streakData.lastActive,
    activeDays: streakData.activeDays,
    score, activity, repoTypes,
    memberYears, avgStars, stack, radarData,
    spotlightRepo, devType, githubAge, influence, topTopics, estContributions,
    allRepos: nonFork,
    // NEW fields
    eventStats,      // { pushCount, prCount, reviewCount, issueCount, totalCommits, mostActiveDay, mostActiveHour, eventBreakdown, dayActivity }
    repoTimeline,    // [{ name, created, stars, lang }]
  }
}