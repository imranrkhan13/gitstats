// github.js — GitStatus · 100% real data only
import { LANG_COLORS } from './constants.js'
import {
  detectRepoType, calcScore, detectDevType, ageTier,
  influenceRatio, extractTopTopics, repoHealth
} from './utils.js'
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN

const headers = {
  Accept: "application/vnd.github+json",
  ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
}

function utcToday() { return new Date().toISOString().slice(0, 10) }
function utcYesterday() { const d = new Date(); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10) }
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000) }
function fmtMonth(isoDate) {
  const d = new Date(isoDate + 'T00:00:00Z')
  return d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }) +
    ` '${String(d.getUTCFullYear()).slice(2)}`
}

export function sanitizeUsername(input) {
  if (!input) return ''
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?github\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '')
    .split(/[\/?#]/)[0]
    .trim()
}

// ── GraphQL: real contribution data (yearly commits + daily calendar) ─────────
async function fetchContributionsGraphQL(username) {
  if (!TOKEN) return null

  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString()
  const lastYearStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()

  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        thisYear: contributionsCollection {
          totalCommitContributions
          contributionCalendar {
            weeks { contributionDays { date contributionCount } }
          }
        }
        lastYear: contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          contributionCalendar {
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }
  `

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { login: username, from: lastYearStart, to: now.toISOString() }
      })
    })
    if (!res.ok) return null
    const json = await res.json()
    if (json.errors) return null

    const user = json.data?.user
    if (!user) return null

    const flatten = (collection) => {
      const days = []
      collection?.contributionCalendar?.weeks?.forEach(w => {
        w?.contributionDays?.forEach(d => {
          if (d?.date) days.push({ date: d.date, count: d.contributionCount || 0 })
        })
      })
      return days.sort((a, b) => a.date.localeCompare(b.date))
    }

    return {
      commitsThisYear: user.thisYear?.totalCommitContributions || 0,
      totalCommits: user.lastYear?.totalCommitContributions || 0,
      contributions: flatten(user.lastYear)
    }
  } catch {
    return null
  }
}

// ── Streak from daily contributions (GraphQL = truth) ───────────────────────
function calcStreakFromContributions(contributions) {
  if (!contributions?.length) return { streak: 0, longestStreak: 0, currentStreakCommits: 0, bestStreakCommits: 0 }

  const counts = contributions.map(d => d.count || 0)

  // Current streak from end
  let streak = 0, currentStreakCommits = 0
  for (let i = counts.length - 1; i >= 0; i--) {
    if (counts[i] > 0) { streak++; currentStreakCommits += counts[i] }
    else break
  }

  // Best streak
  let longestStreak = 0, bestStreakCommits = 0
  let curLen = 0, curCommits = 0
  for (const c of counts) {
    if (c > 0) { curLen++; curCommits += c }
    else { curLen = 0; curCommits = 0 }
    if (curLen > longestStreak) { longestStreak = curLen; bestStreakCommits = curCommits }
  }

  return { streak, longestStreak, currentStreakCommits, bestStreakCommits }
}

// ── Fallback streak from events ──────────────────────────────────────────────
function calcStreakFromEvents(events) {
  const TYPES = new Set([
    'PushEvent', 'PullRequestEvent', 'CreateEvent', 'IssuesEvent',
    'IssueCommentEvent', 'PullRequestReviewEvent', 'PullRequestReviewCommentEvent', 'CommitCommentEvent',
  ])
  const activeDays = new Set()
  events.forEach(e => { if (TYPES.has(e.type) && e.created_at) activeDays.add(e.created_at.slice(0, 10)) })

  const sorted = [...activeDays].sort((a, b) => b.localeCompare(a))
  if (!sorted.length) return { streak: 0, longestStreak: 0, lastActive: null, activeDays: [] }

  const today = utcToday()
  const yesterday = utcYesterday()
  const mostRecent = sorted[0]
  const alive = mostRecent === today || mostRecent === yesterday

  let streak = 0
  if (alive) {
    const cur = new Date(mostRecent + 'T00:00:00Z')
    for (let i = 0; i < 365; i++) {
      if (activeDays.has(cur.toISOString().slice(0, 10))) { streak++; cur.setUTCDate(cur.getUTCDate() - 1) }
      else break
    }
  }

  const allSorted = [...activeDays].sort()
  let longest = 0, cur2 = 0, prev = null
  allSorted.forEach(d => {
    cur2 = (!prev || daysBetween(prev, d) !== 1) ? 1 : cur2 + 1
    if (cur2 > longest) longest = cur2
    prev = d
  })

  return { streak, longestStreak: Math.max(longest, streak), lastActive: sorted[0], activeDays: sorted }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
export async function fetchGitHub(rawUsername) {
  const username = sanitizeUsername(rawUsername)
  if (!username) throw new Error('Enter a GitHub username')

  const [uRes, rRes, evRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers }),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, { headers }),
    fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, { headers }),
  ])

  if (!uRes.ok) {
    if (uRes.status === 404) throw new Error('User not found on GitHub')
    if (uRes.status === 403) throw new Error('GitHub API rate limit — wait 60 seconds and try again')
    throw new Error(`GitHub returned ${uRes.status}`)
  }

  const [user, repos, events] = await Promise.all([
    uRes.json(), rRes.json(), evRes.json()
  ])

  // Fetch real yearly contribution data via GraphQL
  const contribData = await fetchContributionsGraphQL(username)

  return processData(
    user,
    Array.isArray(repos) ? repos : [],
    Array.isArray(events) ? events : [],
    contribData
  )
}

// ── Event stats (real, ~90d window) ──────────────────────────────────────────
function calcEventStats(events) {
  let pushCount = 0, prCount = 0, reviewCount = 0, issueCount = 0,
    createCount = 0, starCount = 0, forkCount = 0, commentCount = 0
  const dowCounts = Array(7).fill(0)
  const hourCounts = Array(24).fill(0)
  let totalCommits = 0

  events.forEach(e => {
    const d = e.created_at ? new Date(e.created_at) : null
    if (d) { dowCounts[d.getUTCDay()]++; hourCounts[d.getUTCHours()]++ }
    switch (e.type) {
      case 'PushEvent':
        pushCount++
        totalCommits += e.payload?.size || 1
        break
      case 'PullRequestEvent': prCount++; break
      case 'PullRequestReviewEvent': reviewCount++; break
      case 'IssuesEvent': issueCount++; break
      case 'CreateEvent': createCount++; break
      case 'WatchEvent': starCount++; break
      case 'ForkEvent': forkCount++; break
      case 'IssueCommentEvent':
      case 'CommitCommentEvent':
      case 'PullRequestReviewCommentEvent': commentCount++; break
    }
  })

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const peakDayIdx = dowCounts.indexOf(Math.max(...dowCounts))
  const peakHourIdx = hourCounts.indexOf(Math.max(...hourCounts))

  const mostActiveDay = dowCounts.some(c => c > 0) ? DAY_NAMES[peakDayIdx] : null
  const mostActiveHour = hourCounts.some(c => c > 0)
    ? (peakHourIdx < 6 ? 'Late Night'
      : peakHourIdx < 12 ? 'Morning'
        : peakHourIdx < 17 ? 'Afternoon'
          : peakHourIdx < 21 ? 'Evening'
            : 'Night')
    : null

  const collab = prCount + reviewCount + issueCount + commentCount
  const developerStyle =
    pushCount === 0 && collab === 0 ? null :
      pushCount > collab * 2.5 ? 'Builder' :
        collab > pushCount * 1.5 ? 'Collaborator' : 'Balanced'

  const eventBreakdown = [
    { name: 'Pushes', value: pushCount, color: 'var(--br2)' },
    { name: 'PRs', value: prCount, color: 'var(--blue)' },
    { name: 'Reviews', value: reviewCount, color: '#8b5cf6' },
    { name: 'Issues', value: issueCount, color: 'var(--red)' },
    { name: 'Comments', value: commentCount, color: '#22c55e' },
    { name: 'Created', value: createCount, color: '#f59e0b' },
    { name: 'Starred', value: starCount, color: '#d97706' },
    { name: 'Forked', value: forkCount, color: '#a97bff' },
  ].filter(e => e.value > 0)

  const dayActivity = DAY_NAMES.map((name, i) => ({ name, count: dowCounts[i] }))
  const totalEvents = events.length

  const weekdayCount = dowCounts[1] + dowCounts[2] + dowCounts[3] + dowCounts[4] + dowCounts[5]
  const weekendCount = dowCounts[0] + dowCounts[6]
  const weekendPct = (weekdayCount + weekendCount) > 0 ? Math.round((weekendCount / (weekdayCount + weekendCount)) * 100) : null

  return {
    pushCount, prCount, reviewCount, issueCount, createCount,
    starCount, forkCount, commentCount,
    totalCommits, totalEvents,
    mostActiveDay, mostActiveHour, developerStyle,
    eventBreakdown, dayActivity,
    peakHour: hourCounts.some(c => c > 0) ? peakHourIdx : null,
    weekendPct,
  }
}

// ── Monthly commits — REAL events only, no gap-filling ───────────────────────
function buildMonthlyCommits(events) {
  const commitMap = {}
  events.forEach(e => {
    if (e.type === 'PushEvent' && e.created_at) {
      const key = e.created_at.slice(0, 7)
      commitMap[key] = (commitMap[key] || 0) + (e.payload?.size || 1)
    }
  })
  if (!Object.keys(commitMap).length) return []
  return Object.entries(commitMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, commits]) => ({ month: fmtMonth(key + '-01'), commits, key }))
}

// ── Daily contributions fallback (from REST events) ─────────────────────────
function buildDailyContributions(events) {
  const dayMap = {}
  events.forEach(e => {
    if (e.type === 'PushEvent' && e.created_at) {
      const date = e.created_at.slice(0, 10)
      dayMap[date] = (dayMap[date] || 0) + (e.payload?.size || 1)
    }
  })
  return Object.entries(dayMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))
}

// ── Language stats by repo size (bytes) ──────────────────────────────────────
function buildLanguages(repos) {
  const byBytes = {}, byCount = {}
  repos.forEach(r => {
    if (!r.language) return
    byBytes[r.language] = (byBytes[r.language] || 0) + (r.size || 1)
    byCount[r.language] = (byCount[r.language] || 0) + 1
  })
  const total = Object.values(byBytes).reduce((a, b) => a + b, 0) || 1
  return Object.entries(byBytes)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, bytes]) => ({
      name, bytes, count: byCount[name] || 0,
      pct: Math.round(bytes / total * 100),
      color: LANG_COLORS[name] || '#a08060',
    }))
}

// ── Stars by language ─────────────────────────────────────────────────────────
function buildStarsByLang(repos) {
  const map = {}
  repos.forEach(r => {
    if (r.language) map[r.language] = (map[r.language] || 0) + (r.stargazers_count || 0)
  })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([lang, stars]) => ({ lang, stars, color: LANG_COLORS[lang] || '#a08060' }))
}

// ── Repos created per year ────────────────────────────────────────────────────
function buildReposByYear(repos) {
  const map = {}
  repos.forEach(r => {
    if (r.created_at) { const yr = r.created_at.slice(0, 4); map[yr] = (map[yr] || 0) + 1 }
  })
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([year, count]) => ({ year, count }))
}

// ── processData ───────────────────────────────────────────────────────────────
export function processData(user, repos, events, contribData = null) {
  const nonFork = repos.filter(r => !r.fork)
  let totalStars = 0, totalForks = 0, totalWatchers = 0

  nonFork.forEach(r => {
    totalStars += r.stargazers_count || 0
    totalForks += r.forks_count || 0
    totalWatchers += r.watchers_count || 0
  })

  const languages = buildLanguages(nonFork)
  const topLangByStars = buildStarsByLang(nonFork)
  const reposByYear = buildReposByYear(nonFork)

  const topByStars = [...nonFork]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)).slice(0, 8)
    .map(r => ({
      name: r.name, desc: r.description || '',
      stars: r.stargazers_count || 0, forks: r.forks_count || 0,
      lang: r.language || '—', updated: r.updated_at, pushed: r.pushed_at,
      url: r.html_url, type: detectRepoType(r),
      topics: r.topics || [], openIssues: r.open_issues_count || 0,
      watchers: r.watchers_count || 0, size: r.size || 0,
      license: r.license?.spdx_id || null,
      isArchived: r.archived || false,
      created: r.created_at,
      homepage: r.homepage || null,
      health: 0,
    }))
  topByStars.forEach(r => { r.health = repoHealth(r) })

  const recentlyActive = [...nonFork]
    .sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0)).slice(0, 8)
    .map(r => ({
      name: r.name, desc: r.description || '',
      stars: r.stargazers_count || 0, forks: r.forks_count || 0,
      lang: r.language || '—', updated: r.pushed_at || r.updated_at,
      url: r.html_url, type: detectRepoType(r),
      topics: r.topics || [], openIssues: r.open_issues_count || 0,
      isArchived: r.archived || false,
    }))

  const spotlightRepo = topByStars[0] || null
  const monthlyCommits = buildMonthlyCommits(events)
  const eventStats = calcEventStats(events)

  // Use GraphQL data when available (real yearly data)
  const dailyContributions = contribData?.contributions || buildDailyContributions(events)
  const totalCommits = contribData?.totalCommits || eventStats.totalCommits
  const commitsThisYear = contribData?.commitsThisYear || eventStats.totalCommits

  // Single source of truth for streaks — from GraphQL contributions when available
  const streakFromContrib = calcStreakFromContributions(dailyContributions)
  const streakFromEvents = calcStreakFromEvents(events)

  const streak = contribData ? streakFromContrib.streak : streakFromEvents.streak
  const longestStreak = contribData ? streakFromContrib.longestStreak : streakFromEvents.longestStreak
  const lastActive = streakFromEvents.lastActive
  const activeDays = streakFromEvents.activeDays

  const commitStreakData = {
    currentStreakCommits: streakFromContrib.currentStreakCommits,
    bestStreakCommits: streakFromContrib.bestStreakCommits
  }

  const activity = events.slice(0, 25).map(e => {
    const type =
      e.type === 'PushEvent' ? 'commit' :
        e.type === 'PullRequestEvent' ? 'pr' :
          e.type === 'PullRequestReviewEvent' ? 'review' :
            e.type === 'CreateEvent' ? 'create' :
              e.type === 'WatchEvent' ? 'star' :
                e.type === 'ForkEvent' ? 'fork' :
                  e.type === 'IssuesEvent' ? 'issue' :
                    (e.type === 'IssueCommentEvent' || e.type === 'CommitCommentEvent' || e.type === 'PullRequestReviewCommentEvent') ? 'comment' :
                      'other'

    let msg = '', detail = ''
    if (e.type === 'PushEvent') {
      const commits = e.payload?.commits || []
      msg = commits[0]?.message?.split('\n')[0] || 'Pushed commits'
      detail = commits.length > 1 ? `+${commits.length - 1} more` : ''
    } else if (e.type === 'PullRequestEvent') {
      const pr = e.payload?.pull_request
      const action = e.payload?.action
      msg = `${action === 'closed' && pr?.merged ? 'Merged' : action === 'opened' ? 'Opened' : action === 'closed' ? 'Closed' : 'Updated'} PR: ${pr?.title || ''}`
      detail = pr ? `#${pr.number}` : ''
    } else if (e.type === 'PullRequestReviewEvent') {
      msg = `Reviewed PR: ${e.payload?.pull_request?.title || ''}`
      detail = `#${e.payload?.pull_request?.number || ''}`
    } else if (e.type === 'CreateEvent') {
      msg = `Created ${e.payload?.ref_type}${e.payload?.ref ? ` "${e.payload.ref}"` : ''}`
    } else if (e.type === 'WatchEvent') {
      msg = `Starred ${e.repo?.name || 'a repository'}`
    } else if (e.type === 'ForkEvent') {
      msg = `Forked ${e.repo?.name || 'a repository'}`
    } else if (e.type === 'IssuesEvent') {
      const issue = e.payload?.issue
      msg = `${e.payload?.action === 'opened' ? 'Opened' : 'Updated'} issue: ${issue?.title || ''}`
      detail = issue ? `#${issue.number}` : ''
    } else if (e.type === 'IssueCommentEvent') {
      msg = `Commented on: ${e.payload?.issue?.title || 'an issue'}`
    } else if (e.type === 'CommitCommentEvent') {
      msg = 'Left a commit comment'
    } else {
      msg = e.type.replace('Event', ' event')
    }
    return { type, msg, detail, repo: e.repo?.name || '', repoShort: e.repo?.name?.split('/')[1] || '', time: e.created_at }
  }).filter(a => a.msg)

  const memberYears = Math.max(1, new Date().getFullYear() - new Date(user.created_at).getFullYear())
  const memberMonths = Math.round((Date.now() - new Date(user.created_at)) / 2592000000)
  const score = calcScore(nonFork.length, user.followers, totalStars, totalForks, memberYears, languages.length)

  const RTYPE_COLORS = { 'AI/ML': '#8b5cf6', 'DevOps': '#0ea5e9', 'Real-time': '#f59e0b', 'SaaS': '#22c55e', 'Tooling': '#f97316', 'Frontend': '#3b82f6', 'Library': '#a08060', 'Systems': '#ef4444' }
  const typeMap = {}
  nonFork.forEach(r => { const t = detectRepoType(r); typeMap[t] = (typeMap[t] || 0) + 1 })
  const repoTypes = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([type, count]) => ({ type, count, color: RTYPE_COLORS[type] || '#a08060' }))

  const avgStars = nonFork.length ? Math.round(totalStars / nonFork.length) : 0
  const backLangs = ['Go', 'Rust', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Scala', 'Elixir', 'Kotlin', 'Haskell']
  const frontLangs = ['TypeScript', 'JavaScript', 'HTML', 'CSS', 'Vue', 'Dart', 'Svelte']
  const stack = {
    back: languages.filter(l => backLangs.includes(l.name)),
    front: languages.filter(l => frontLangs.includes(l.name)),
    infra: languages.filter(l => ['Shell', 'Dockerfile', 'HCL', 'Makefile', 'PowerShell'].includes(l.name)),
  }

  const radarData = [
    { subject: 'Output', A: Math.min(100, Math.round(nonFork.length * 2.1)) },
    { subject: 'Stars', A: Math.min(100, Math.round(Math.log10(totalStars + 1) * 32)) },
    { subject: 'Community', A: Math.min(100, Math.round(Math.log10((user.followers || 0) + 1) * 40)) },
    { subject: 'Streak', A: Math.min(100, streak > 0 ? Math.min(100, Math.round(streak * 3)) : 0) },
    { subject: 'Diversity', A: Math.min(100, languages.length * 11) },
    { subject: 'Impact', A: Math.min(100, Math.round(Math.log10(totalForks + 1) * 38)) },
  ]

  const devType = detectDevType(languages, repoTypes)
  const githubAge = ageTier(memberYears)
  const influence = influenceRatio(user.followers, user.following)
  const topTopics = extractTopTopics(nonFork)

  const archivedCount = nonFork.filter(r => r.archived).length
  const activeRepoCount = nonFork.length - archivedCount

  return {
    user, totalStars, totalForks, totalWatchers,
    nonForkCount: nonFork.length, activeRepoCount, archivedCount,
    languages, topLangByStars, reposByYear,
    topByStars, recentlyActive, spotlightRepo,
    monthlyCommits,
    streak, longestStreak,
    lastActive,
    activeDays,
    score, activity, repoTypes,
    memberYears, memberMonths, avgStars,
    stack, radarData,
    devType, githubAge, influence, topTopics,
    allRepos: nonFork,
    eventStats,
    contributions: dailyContributions,
    totalCommits,
    commitsThisYear,
  totalPRs: eventStats.prCount,
    totalIssues: eventStats.issueCount,
    commitStreakData,
  }
}