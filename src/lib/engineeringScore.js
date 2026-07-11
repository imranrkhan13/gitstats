// engineeringScore.js — a real, explainable "how healthy is this repo"
// score. Every point is tied to a signal actually fetched from GitHub's
// public REST API; every bullet in `reasons` says exactly why. Nothing here
// is estimated or invented — where a real signal isn't available, the
// caller shows "Source analysis unavailable," not a guess.
//
// IMPORTANT — rate limits, said plainly: GitHub's unauthenticated API caps
// out at 60 requests/hour *per IP* (shared across everyone using the app
// from that network, not per-user). This function makes 4 extra calls
// (README, root contents, contributors, releases) — deliberately only
// called when someone actually opens a specific repo's Deep Review, not for
// every repo in a profile up front. Ranking "every repository" by this
// score the moment a profile loads would burn the rate limit on the first
// visit for anyone with more than ~10 repos. See NOTES.md for what this
// means for "rank every repo by engineering quality."

const GH = 'https://api.github.com'

export async function fetchEngineeringSignals(owner, repo) {
  const [metaRes, readmeRes, contentsRes, contributorsRes, releasesRes] = await Promise.all([
    fetch(`${GH}/repos/${owner}/${repo}`),
    fetch(`${GH}/repos/${owner}/${repo}/readme`).catch(() => null),
    fetch(`${GH}/repos/${owner}/${repo}/contents/`).catch(() => null),
    fetch(`${GH}/repos/${owner}/${repo}/contributors?per_page=100&anon=true`).catch(() => null),
    fetch(`${GH}/repos/${owner}/${repo}/releases?per_page=100`).catch(() => null),
  ])
  if (!metaRes.ok) throw new Error(`Could not load ${owner}/${repo}`)
  const meta = await metaRes.json()

  let readme = null
  if (readmeRes?.ok) {
    const r = await readmeRes.json()
    try {
      const decoded = atob(r.content.replace(/\n/g, ''))
      readme = { length: decoded.length, hasImages: /!\[|<img/i.test(decoded) }
    } catch { readme = { length: 0, hasImages: false } }
  }

  let files = []
  if (contentsRes?.ok) {
    const list = await contentsRes.json()
    if (Array.isArray(list)) files = list.map(f => f.name.toLowerCase())
  }

  let contributorCount = null
  if (contributorsRes?.ok) {
    const list = await contributorsRes.json()
    if (Array.isArray(list)) contributorCount = list.length // capped at 100 by per_page; real count could be higher
  }

  let releaseCount = 0
  if (releasesRes?.ok) {
    const list = await releasesRes.json()
    if (Array.isArray(list)) releaseCount = list.length
  }

  const daysSincePush = meta.pushed_at ? Math.floor((Date.now() - new Date(meta.pushed_at)) / 86400000) : null

  return {
    name: meta.name,
    license: meta.license?.name || null,
    openIssues: meta.open_issues_count,
    size: meta.size, // KB, from GitHub — a real (if rough) proxy for codebase size
    daysSincePush,
    createdAt: meta.created_at,
    hasReadme: !!readme,
    readmeLength: readme?.length || 0,
    readmeHasImages: readme?.hasImages || false,
    hasTests: files.some(f => f.includes('test') || f.includes('spec') || f === '__tests__'),
    hasCI: files.some(f => f === '.github' || f === '.circleci' || f === '.gitlab-ci.yml' || f === '.travis.yml'),
    hasDocs: files.some(f => f === 'docs' || f === 'documentation'),
    hasDependencyManifest: files.some(f => ['package.json', 'requirements.txt', 'cargo.toml', 'go.mod', 'gemfile', 'pom.xml', 'build.gradle'].includes(f)),
    hasLockfile: files.some(f => ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'poetry.lock', 'cargo.lock'].includes(f)),
    hasDockerfile: files.some(f => f.startsWith('dockerfile')),
    rootFiles: files,
    contributorCount, // null if the call failed — never shown as 0 in that case
    releaseCount,
  }
}

export function calcEngineeringScore(s) {
  const reasons = []
  let score = 0

  if (s.hasReadme && s.readmeLength > 500) { score += 15; reasons.push({ ok: true, text: 'Substantial README (500+ characters)' }) }
  else if (s.hasReadme) { score += 6; reasons.push({ ok: false, text: 'README exists but is thin (under 500 characters)' }) }
  else { reasons.push({ ok: false, text: 'No README found' }) }
  if (s.readmeHasImages) { score += 8; reasons.push({ ok: true, text: 'README includes screenshots or diagrams' }) }

  if (s.hasTests) { score += 15; reasons.push({ ok: true, text: 'Has a test directory or test files' }) }
  else { reasons.push({ ok: false, text: 'No test files detected at the root level' }) }

  if (s.hasCI) { score += 15; reasons.push({ ok: true, text: 'CI configuration present (GitHub Actions / CircleCI / etc.)' }) }
  else { reasons.push({ ok: false, text: 'No CI configuration detected' }) }

  if (s.hasDependencyManifest) { score += 8; reasons.push({ ok: true, text: 'Dependencies declared in a manifest file' })
    if (s.hasLockfile) { score += 5; reasons.push({ ok: true, text: 'Lockfile present — reproducible installs' }) }
    else { reasons.push({ ok: false, text: 'No lockfile — dependency versions could drift' }) }
  }

  if (s.license) { score += 10; reasons.push({ ok: true, text: `Licensed (${s.license})` }) }
  else { reasons.push({ ok: false, text: 'No license file' }) }

  if (s.daysSincePush != null) {
    if (s.daysSincePush <= 90) { score += 12; reasons.push({ ok: true, text: 'Pushed to within the last 90 days' }) }
    else if (s.daysSincePush <= 365) { score += 6; reasons.push({ ok: false, text: 'Last push was 3–12 months ago' }) }
    else { reasons.push({ ok: false, text: `No commits in over a year (last push ${Math.floor(s.daysSincePush / 365)}y ago)` }) }
  }

  if (s.releaseCount > 0) { score += 8; reasons.push({ ok: true, text: `${s.releaseCount} tagged ${s.releaseCount === 1 ? 'release' : 'releases'}` }) }
  else { reasons.push({ ok: false, text: 'No tagged releases' }) }

  if (s.hasDocs) { score += 4; reasons.push({ ok: true, text: 'Dedicated documentation folder' }) }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons }
}
