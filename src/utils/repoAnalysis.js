import { callAI, parseStructuredResponse } from './aiClient'
import { buildGitHubContext, parseGitHubInput } from './githubapi'
import { buildResumeContext } from './resumeParser'
import {
  getDeveloperDNA,
  getAchievements,
  getTimeline,
  getGithubSummary,
} from "../utils/repoAnalysis"
const GITHUB_API_BASE = 'https://api.github.com'
const MAX_FILE_BYTES = 100 * 1024
const MAX_CONTEXT_FILES = 8
const SESSION_PREFIX = 'resumeiq.repoIndex.'
const dna = getDeveloperDNA(profile, repos, events)

const achievements = getAchievements(profile, repos)

const timeline = getTimeline(profile, repos)

const summary = getGithubSummary(
  profile,
  repos,
  githubData.totalContributions || 0
)

const SKIP_DIRS = new Set([
  '.git',
  '.github/workflows',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.vercel',
  '.cache',
  'vendor',
  'target',
])

const TEXT_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'css', 'scss', 'sass', 'less',
  'html', 'md', 'mdx',
  'json', 'yml', 'yaml', 'toml', 'xml',
  'py', 'rb', 'go', 'rs', 'java', 'kt',
  'php', 'cs', 'cpp', 'c', 'h', 'hpp',
  'sh', 'bash', 'zsh', 'sql', 'graphql',
  'env', 'example', 'config',
])

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svgz',
  'pdf', 'zip', 'gz', 'tar', 'rar', '7z',
  'mp4', 'mp3', 'wav', 'ogg', 'mov',
  'woff', 'woff2', 'ttf', 'eot',
  'lockb', 'db', 'sqlite',
])

const FILE_TYPE_COLORS = {
  tsx: '#3178c6',
  ts: '#2563eb',
  jsx: '#f7df1e',
  js: '#f59e0b',
  css: '#7c3aed',
  scss: '#c026d3',
  json: '#16a34a',
  md: '#64748b',
  config: '#dc2626',
  api: '#0891b2',
  test: '#db2777',
  other: '#94a3b8',
}

function authHeaders() {
  const token = import.meta.env.VITE_GITHUB_TOKEN
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function githubFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = body?.message || `GitHub API error ${res.status}`
    if (res.status === 403) {
      throw new Error(`${message}. Add VITE_GITHUB_TOKEN for higher GitHub API limits.`)
    }
    throw new Error(message)
  }

  return res.json()
}

function cleanRepoName(repo = '') {
  return repo.replace(/\.git$/, '').replace(/\/$/, '')
}
export function getDeveloperDNA(user, repos, events = []) {
  const totalStars = repos.reduce((t, r) => t + r.stargazers_count, 0)
  const totalForks = repos.reduce((t, r) => t + r.forks_count, 0)

  const builder = Math.min(100, repos.length * 2)
  const collaborator = Math.min(100, totalForks * 4)
  const consistency = Math.min(100, events.length)
  const impact = Math.min(100, totalStars * 2)

  return [
    {
      icon: "🏗",
      label: "Builder",
      value: builder,
    },
    {
      icon: "🤝",
      label: "Collaborator",
      value: collaborator,
    },
    {
      icon: "🔥",
      label: "Consistency",
      value: consistency,
    },
    {
      icon: "⭐",
      label: "Impact",
      value: impact,
    },
  ]
}
export function getAchievements(user, repos) {
  const stars = repos.reduce((t, r) => t + r.stargazers_count, 0)

  return [
    {
      icon: "🚀",
      title: "First Repository",
      unlocked: repos.length >= 1,
    },
    {
      icon: "📦",
      title: "10 Repositories",
      unlocked: repos.length >= 10,
    },
    {
      icon: "⭐",
      title: "100 Stars",
      unlocked: stars >= 100,
    },
    {
      icon: "🔥",
      title: "50 Commits",
      unlocked: true,
    },
    {
      icon: "🌍",
      title: "Open Source",
      unlocked: repos.some(r => !r.private),
    },
    {
      icon: "💎",
      title: "Top Developer",
      unlocked: stars >= 250,
    },
  ]
}
export function getTimeline(user, repos) {
  const timeline = []

  timeline.push({
    title: "Joined GitHub",
    date: user.created_at,
  })

  if (repos.length) {
    const sorted = [...repos].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    )

    timeline.push({
      title: "First Repository",
      date: sorted[0].created_at,
    })
  }

  const stars = repos.reduce((t, r) => t + r.stargazers_count, 0)

  if (stars > 0) {
    timeline.push({
      title: `${stars} Stars Earned`,
      date: new Date().toISOString(),
    })
  }

  timeline.push({
    title: `${repos.length} Public Repositories`,
    date: new Date().toISOString(),
  })

  return timeline
} export function getGithubSummary(user, repos, contributions = 0) {

  return {

    contributions,

    repositories: repos.length,

    stars: repos.reduce((t, r) => t + r.stargazers_count, 0),

    forks: repos.reduce((t, r) => t + r.forks_count, 0),

    followers: user.followers,

    following: user.following,

  }

}

export function parseRepositoryInput(input) {
  const parsed = parseGitHubInput(input)
  if (!parsed?.repo) {
    throw new Error('Enter a GitHub repository as owner/repo or github.com/owner/repo for file-level analysis.')
  }
  return { owner: parsed.username, repo: cleanRepoName(parsed.repo) }
}

function getExtension(path = '') {
  const file = path.split('/').pop() || ''
  if (file.startsWith('.env')) return 'env'
  if (/^(vite|next|nuxt|tailwind|postcss|eslint|prettier|tsconfig|package|webpack|rollup|babel)\b/i.test(file)) {
    return 'config'
  }
  const ext = file.includes('.') ? file.split('.').pop().toLowerCase() : ''
  return ext || 'other'
}

export function fileType(path = '') {
  const ext = getExtension(path)
  const file = path.toLowerCase()
  if (/(\.test\.|\.spec\.|__tests__|\/tests?\/)/.test(file)) return 'test'
  if (/(\/api\/|\/routes?\/|route\.)/.test(file)) return 'api'
  if (ext === 'config') return 'config'
  return ext
}

export function fileColor(path = '') {
  return FILE_TYPE_COLORS[fileType(path)] || FILE_TYPE_COLORS[getExtension(path)] || FILE_TYPE_COLORS.other
}

function shouldSkipPath(path) {
  const lower = path.toLowerCase()
  return [...SKIP_DIRS].some(dir => lower === dir || lower.startsWith(`${dir}/`) || lower.includes(`/${dir}/`))
}

function isTextFile(path, size = 0) {
  if (size > MAX_FILE_BYTES || shouldSkipPath(path)) return false
  const ext = getExtension(path)
  if (BINARY_EXTENSIONS.has(ext)) return false
  if (TEXT_EXTENSIONS.has(ext)) return true
  return !ext && /(^|\/)(dockerfile|makefile|license|readme)$/i.test(path)
}

function decodeBase64(content = '') {
  const cleaned = content.replace(/\s/g, '')
  try {
    const binary = atob(cleaned)
    const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0))
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return ''
  }
}

function limitConcurrency(items, limit, worker) {
  const results = new Array(items.length)
  let next = 0

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await worker(items[index], index)
    }
  })

  return Promise.all(runners).then(() => results)
}

function extractImports(content = '') {
  const imports = new Set()
  const patterns = [
    /import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /export\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /@import\s+['"]([^'"]+)['"]/g,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(content))) {
      imports.add(match[1])
    }
  }

  return [...imports]
}

function extractExports(content = '') {
  const exports = new Set()
  const patterns = [
    /export\s+(?:default\s+)?function\s+([A-Za-z0-9_$]+)/g,
    /export\s+(?:default\s+)?class\s+([A-Za-z0-9_$]+)/g,
    /export\s+const\s+([A-Za-z0-9_$]+)/g,
    /export\s+let\s+([A-Za-z0-9_$]+)/g,
    /export\s+var\s+([A-Za-z0-9_$]+)/g,
    /export\s*\{([^}]+)\}/g,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(content))) {
      if (match[1]?.includes(',')) {
        match[1].split(',').forEach(part => {
          const name = part.trim().split(/\s+as\s+/i)[0]?.trim()
          if (name) exports.add(name)
        })
      } else if (match[1]) {
        exports.add(match[1])
      }
    }
  }

  if (/export\s+default\b/.test(content)) exports.add('default')
  return [...exports].slice(0, 12)
}

function normalizePath(path) {
  const parts = []
  for (const part of path.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}

function dirname(path) {
  const idx = path.lastIndexOf('/')
  return idx === -1 ? '' : path.slice(0, idx)
}

function resolveImport(fromPath, specifier, fileSet) {
  if (!specifier?.startsWith('.')) return null

  const base = normalizePath(`${dirname(fromPath)}/${specifier}`)
  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mjs`,
    `${base}.cjs`,
    `${base}.json`,
    `${base}.css`,
    `${base}/index.js`,
    `${base}/index.jsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ]

  return candidates.find(candidate => fileSet.has(candidate)) || null
}

function nestingDepth(content = '') {
  let depth = 0
  let max = 0
  for (const char of content) {
    if (char === '{') max = Math.max(max, ++depth)
    if (char === '}') depth = Math.max(0, depth - 1)
  }
  return max
}

function summarizeFile(file, dependencies = [], dependents = []) {
  const type = fileType(file.path)
  const lines = file.content.split('\n')
  const exports = file.exports || []
  const firstComment = lines
    .map(line => line.trim())
    .find(line => /^(\/\/|#|\/\*|\*)\s*[A-Za-z]/.test(line))
    ?.replace(/^(\/\/|#|\/\*|\*)\s*/, '')

  const role =
    type === 'tsx' || type === 'jsx'
      ? 'React UI component'
      : type === 'api'
        ? 'API or routing module'
        : type === 'css' || type === 'scss'
          ? 'styling module'
          : type === 'config' || ['json', 'yml', 'yaml', 'toml'].includes(type)
            ? 'configuration file'
            : type === 'test'
              ? 'test coverage file'
              : 'source module'

  const signals = []
  if (exports.length) signals.push(`exports ${exports.slice(0, 5).join(', ')}`)
  if (dependencies.length) signals.push(`depends on ${dependencies.slice(0, 4).join(', ')}`)
  if (dependents.length) signals.push(`used by ${dependents.slice(0, 3).join(', ')}`)
  if (nestingDepth(file.content) >= 5) signals.push('contains nested control flow')

  return {
    headline: firstComment || `${file.path} is a ${role}.`,
    role,
    keyExports: exports,
    dependencies,
    dependents,
    lineCount: lines.length,
    size: file.size,
    complexity: {
      imports: file.imports?.length || 0,
      exports: exports.length,
      nesting: nestingDepth(file.content),
    },
    summary: [
      `${file.path} is a ${role}.`,
      signals.length ? `Key signals: ${signals.join('; ')}.` : 'No major import/export signals were detected.',
      `It has ${lines.length} lines and ${dependencies.length} direct file dependencies.`,
    ].join(' '),
  }
}

export function generateInterviewQuestions(fileDetail) {
  if (!fileDetail) return []
  const type = fileType(fileDetail.path)
  const questions = []
  const lineCount = fileDetail.summary?.lineCount || fileDetail.content?.split('\n').length || 0
  const deps = fileDetail.dependencies?.length || 0
  const nesting = fileDetail.summary?.complexity?.nesting || 0

  if (type === 'tsx' || type === 'jsx') {
    questions.push('How would you reduce unnecessary re-renders in this component?')
    questions.push('Which props or state transitions would you test first?')
    questions.push('What accessibility concerns should be checked in this UI?')
  } else if (type === 'api') {
    questions.push('Where should validation and error handling be strengthened in this route?')
    questions.push('How would you protect this endpoint from unauthorized access?')
    questions.push('What edge cases should the API response contract cover?')
  } else if (type === 'config' || ['json', 'yml', 'yaml', 'toml'].includes(type)) {
    questions.push('What security or environment assumptions are encoded in this config?')
    questions.push('How would this configuration change between local and production?')
    questions.push('Which settings could create deployment or dependency risk?')
  } else if (type === 'css' || type === 'scss') {
    questions.push('How would you keep these styles responsive across mobile and desktop?')
    questions.push('Which selectors could become hard to maintain as the UI grows?')
    questions.push('How would you test visual regressions for this stylesheet?')
  } else if (type === 'test') {
    questions.push('Which behavior is covered well here, and what important path is missing?')
    questions.push('How would you make these tests less brittle?')
    questions.push('What fixtures or mocks would improve confidence?')
  } else {
    questions.push('What edge cases would you test in this module?')
    questions.push('How would you make this code easier to reason about or reuse?')
    questions.push('What is the time or space complexity of the main logic here?')
  }

  if (lineCount > 180) questions.push('How would you split this file without losing cohesion?')
  if (deps > 6) questions.push('Which dependencies are essential, and which could be inverted or removed?')
  if (nesting >= 5) questions.push('How would you simplify the deepest nested logic?')

  return [...new Set(questions)].slice(0, 5)
}

function createLinePreview(content = '', maxLines = 90) {
  return content
    .split('\n')
    .slice(0, maxLines)
    .map((line, idx) => `${idx + 1}: ${line}`)
    .join('\n')
}

function scoreFileForQuestion(file, question) {
  const q = question.toLowerCase()
  const terms = q.split(/[^a-z0-9_]+/).filter(term => term.length > 2)
  const haystack = `${file.path} ${file.summary?.summary || ''} ${file.imports?.join(' ') || ''} ${file.exports?.join(' ') || ''}`.toLowerCase()
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 2 : 0), 0)
    + (/(auth|login|session|token)/.test(q) && /(auth|login|session|token)/.test(haystack) ? 6 : 0)
    + (/(style|responsive|mobile|css)/.test(q) && /(css|style|responsive|mobile|tsx|jsx)/.test(haystack) ? 4 : 0)
    + (/(api|endpoint|route|server)/.test(q) && /(api|route|server|endpoint)/.test(haystack) ? 4 : 0)
}

function selectRelevantFiles(repoIndex, question, mode, filePath) {
  if (!repoIndex?.files?.length) return []

  if (filePath) {
    const selected = repoIndex.filesByPath[filePath]
    if (!selected) return []
    const direct = new Set([
      ...(selected.summary?.dependencies || []),
      ...(selected.summary?.dependents || []).slice(0, 3),
    ])
    return [selected, ...[...direct].map(path => repoIndex.filesByPath[path]).filter(Boolean)].slice(0, MAX_CONTEXT_FILES)
  }

  return [...repoIndex.files]
    .map(file => ({ file, score: scoreFileForQuestion(file, question) }))
    .sort((a, b) => b.score - a.score || b.file.summary.lineCount - a.file.summary.lineCount)
    .slice(0, MAX_CONTEXT_FILES)
    .map(item => item.file)
}

export function buildRepoContext(repoIndex, question, mode = 'merged', filePath = null) {
  if (!repoIndex) return null
  const relevantFiles = selectRelevantFiles(repoIndex, question, mode, filePath)
  const overview = [
    `Repository: ${repoIndex.owner}/${repoIndex.repo}`,
    `Indexed files: ${repoIndex.files.length}`,
    `Dependency edges: ${repoIndex.graph.edges.length}`,
    repoIndex.skipped?.length ? `Skipped large/binary files: ${repoIndex.skipped.length}` : null,
  ].filter(Boolean).join('\n')

  const summaries = relevantFiles.map(file => {
    const summary = file.summary
    return [
      `FILE: ${file.path}`,
      `Lines: 1-${summary.lineCount}`,
      `Summary: ${summary.summary}`,
      summary.keyExports?.length ? `Exports: ${summary.keyExports.join(', ')}` : null,
      summary.dependencies?.length ? `Dependencies: ${summary.dependencies.join(', ')}` : null,
      `Preview with line numbers:\n${createLinePreview(file.content)}`,
    ].filter(Boolean).join('\n')
  }).join('\n\n---\n\n')

  return `${overview}\n\n${summaries}`
}

export async function repoChat({ question, mode = 'merged', filePath = null, repoIndex, resumeText = '', candidate = null, githubData = null }) {
  const resumeContext = candidate
    ? buildResumeContext(candidate)
    : resumeText
      ? `Raw Resume\n${resumeText.slice(0, 4000)}`
      : null
  const githubContext = githubData ? buildGitHubContext(githubData) : null
  const repoContext = repoIndex ? buildRepoContext(repoIndex, question, mode, filePath) : null

  const instructions = [
    'You are ResumeIQ, a senior engineering manager and technical interviewer — NOT a document search engine.',
    'Reason and synthesize across the resume, GitHub, repository, and repository CODE. Treat code as evidence: a Dockerfile implies Docker, an AWS SDK import implies AWS, Terraform implies IaC — even if the resume never says so.',
    'ALWAYS give the most useful, honest answer you can. Do NOT reply "Not available"; reason from the evidence. Only list a genuinely unknowable specific in missing_data.',
    'Distinguish observed facts from reasonable inferences and give a confidence level. Do not fabricate precise unsupported facts (exact metrics, named employers).',
    'If a file is selected, scope the answer to that file (purpose, bugs, code smells, improvements, security, performance, interview questions) using its code.',
    'Reference sources inline: [Repository], [File], [Resume], or [GitHub]. Cite file paths/line ranges in the citations array where relevant.',
    'No markdown tables, code fences, or decorative markdown outside the JSON. Short paragraphs or numbered points.',
    'Confidence: 0.9-1.0 observed, 0.6-0.8 strong inference, 0.4-0.6 reasonable inference, below 0.4 weak.',
    'Return only one JSON object.',
    'JSON schema: {"answer":"string","reasoning":"how you combined sources; end with Confidence: High|Medium|Low","confidence":0.0,"source":"resume|github|both|repo|file|merged|general","citations":[{"type":"file|resume|github","label":"string","filePath":"optional string","lineStart":1,"lineEnd":10}],"missing_data":["only genuinely unknowable specifics"],"suggested_followups":["question"]}',
  ]

  const context = []
  if (mode === 'merged') {
    if (resumeContext) context.push(`=== RESUME ===\n${resumeContext}`)
    if (githubContext) context.push(`=== GITHUB PROFILE ===\n${githubContext}`)
    if (repoContext) context.push(`=== REPOSITORY INDEX ===\n${repoContext}`)
  } else if (mode === 'repo') {
    if (repoContext) context.push(`=== REPOSITORY INDEX ===\n${repoContext}`)
  } else if (mode === 'file') {
    if (repoContext) context.push(`=== SELECTED FILE AND DIRECT DEPENDENCIES ===\n${repoContext}`)
  }

  if (!context.length) context.push('No matching context is loaded.')

  const prompt = `${instructions.join('\n')}\n\n${context.join('\n\n')}\n\n=== QUESTION ===\n${question}`
  const result = await callAI([{ role: 'user', parts: [{ text: prompt }] }])
  return { ...parseStructuredResponse(result.text), provider: result.provider }
}

function buildGraph(files) {
  const fileSet = new Set(files.map(file => file.path))
  const edges = []

  for (const file of files) {
    file.imports = extractImports(file.content)
    file.exports = extractExports(file.content)

    for (const specifier of file.imports) {
      const target = resolveImport(file.path, specifier, fileSet)
      if (target) edges.push({ source: file.path, target, specifier })
    }
  }

  const dependenciesByFile = {}
  const dependentsByFile = {}
  for (const file of files) {
    dependenciesByFile[file.path] = []
    dependentsByFile[file.path] = []
  }
  for (const edge of edges) {
    dependenciesByFile[edge.source]?.push(edge.target)
    dependentsByFile[edge.target]?.push(edge.source)
  }

  for (const file of files) {
    file.summary = summarizeFile(file, dependenciesByFile[file.path] || [], dependentsByFile[file.path] || [])
    file.questions = generateInterviewQuestions(file)
  }

  return {
    nodes: files.map(file => ({
      id: file.path,
      label: file.path.split('/').pop(),
      path: file.path,
      type: fileType(file.path),
      color: fileColor(file.path),
      size: Math.max(4, Math.min(16, Math.sqrt(file.summary.lineCount || 1) + 3)),
    })),
    edges,
  }
}

function makeSessionId(owner, repo, branch, sha) {
  return `${owner}/${repo}@${branch}:${sha}`.toLowerCase()
}

function restoreCached(sessionId) {
  const cached = sessionStorage.getItem(`${SESSION_PREFIX}${sessionId}`)
  if (!cached) return null
  try {
    const parsed = JSON.parse(cached)
    parsed.filesByPath = Object.fromEntries(parsed.files.map(file => [file.path, file]))
    return parsed
  } catch {
    return null
  }
}

function cacheIndex(sessionId, repoIndex) {
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(repoIndex))
  } catch {
    // Session storage is best-effort; the in-memory state still works.
  }
}

export async function indexRepository(input) {
  const { owner, repo, branch: requestedBranch } = typeof input === 'string' ? parseRepositoryInput(input) : input
  const repoMeta = await githubFetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`)
  const branches = await githubFetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches?per_page=100`).catch(() => [])
  const branch = requestedBranch || repoMeta.default_branch
  const tree = await githubFetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)
  const sessionId = makeSessionId(owner, repo, branch, tree.sha)
  const cached = restoreCached(sessionId)
  if (cached) return cached

  const allFiles = (tree.tree || [])
    .filter(item => item.type === 'blob')
    .map(item => ({
      path: item.path,
      size: item.size || 0,
      sha: item.sha,
      url: item.url,
      extension: getExtension(item.path),
      fetchable: isTextFile(item.path, item.size || 0),
    }))

  const fetchable = allFiles
    .filter(file => file.fetchable)
    .sort((a, b) => a.size - b.size)

  const fetched = await limitConcurrency(fetchable, 5, async file => {
    try {
      const data = await githubFetch(file.url)
      const content = decodeBase64(data.content || '')
      return content
        ? { ...file, content }
        : { ...file, fetchError: 'Empty or undecodable content' }
    } catch (err) {
      return { ...file, fetchError: err.message || 'Could not fetch file' }
    }
  })

  const files = fetched.filter(file => file.content)
  const skipped = [
    ...allFiles.filter(file => !file.fetchable).map(file => ({
      path: file.path,
      size: file.size,
      reason: file.size > MAX_FILE_BYTES ? 'larger than 100KB' : 'binary, generated, or ignored path',
    })),
    ...fetched.filter(file => file.fetchError).map(file => ({
      path: file.path,
      size: file.size,
      reason: file.fetchError,
    })),
  ]

  const graph = buildGraph(files)
  const repoIndex = {
    sessionId,
    owner,
    repo,
    branch,
    branches: Array.isArray(branches) ? branches.map(item => ({
      name: item.name,
      sha: item.commit?.sha,
    })) : [],
    htmlUrl: repoMeta.html_url,
    defaultBranch: branch,
    indexedAt: new Date().toISOString(),
    files,
    allFiles,
    skipped,
    graph,
    filesByPath: Object.fromEntries(files.map(file => [file.path, file])),
  }

  cacheIndex(sessionId, repoIndex)
  return repoIndex
}

export function getRepoFile(repoIndex, filePath) {
  if (!repoIndex || !filePath) return null
  const file = repoIndex.filesByPath?.[filePath]
  if (!file) return null
  return {
    ...file,
    dependencies: file.summary?.dependencies || [],
    dependents: file.summary?.dependents || [],
    questions: file.questions?.length ? file.questions : generateInterviewQuestions(file),
  }
}

function firstSentence(text = '') {
  const clean = text.replace(/[#*`>_\-]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  const m = clean.match(/^.{20,160}?[.!?](\s|$)/)
  return (m ? m[0] : clean.slice(0, 160)).trim()
}

const STACK_SIGNALS = [
  ['React', /\breact\b/], ['Next.js', /\bnext\b|next\.config/], ['Vue', /\bvue\b/], ['Svelte', /svelte/],
  ['Vite', /\bvite\b/], ['Tailwind', /tailwind/], ['Express', /express/], ['Node.js', /node|express|package\.json/],
  ['TypeScript', /\.tsx?\b|typescript/], ['Django', /django/], ['Flask', /flask/], ['FastAPI', /fastapi/],
  ['Docker', /dockerfile|docker-compose/], ['Kubernetes', /kubernetes|k8s|kind:\s/], ['Terraform', /\.tf\b|terraform/],
  ['AWS', /aws-sdk|\baws\b|s3|dynamodb|lambda/], ['GCP', /gcloud|google-cloud/], ['Redis', /redis/],
  ['PostgreSQL', /postgres|\bpg\b/], ['MySQL', /mysql/], ['MongoDB', /mongo/], ['GraphQL', /graphql/],
  ['Kafka', /kafka/], ['Prometheus', /prometheus/], ['GitHub Actions', /\.github\/workflows/],
]

export function repoSummary(repoIndex, githubData) {
  if (!repoIndex) return null
  const files = repoIndex.files || []
  const paths = files.map(f => f.path.toLowerCase())
  const imports = files.flatMap(f => f.imports || []).join(' ')
  const pkg = files.find(f => /(^|\/)package\.json$/i.test(f.path))?.content || ''
  const hay = `${paths.join(' ')} ${imports} ${pkg}`.toLowerCase()

  const loc = files.reduce((s, f) => s + (f.summary?.lineCount || (f.content ? f.content.split('\n').length : 0)), 0)
  const stack = STACK_SIGNALS.filter(([, re]) => re.test(hay)).map(([n]) => n)

  const folderCount = {}
  files.forEach(f => { const top = f.path.includes('/') ? f.path.split('/')[0] : '(root)'; folderCount[top] = (folderCount[top] || 0) + 1 })
  const largestFolders = Object.entries(folderCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))

  const entry = files.map(f => f.path).find(p => /(^|\/)(src\/)?(main|index|app)\.(t|j)sx?$/i.test(p))
    || files.map(f => f.path).find(p => /(^|\/)(index\.html|main\.py|app\.py|server\.js)$/i.test(p)) || null
  const tests = files.filter(f => /(\.test\.|\.spec\.|__tests__|\/tests?\/)/i.test(f.path)).length
  const hasDocker = /dockerfile|docker-compose/.test(hay)
  const hasCI = paths.some(p => /\.github\/workflows/.test(p))
  const hasEnv = paths.some(p => /(^|\/)\.env/.test(p))
  const edges = repoIndex.graph?.edges?.length || 0
  const readme = githubData?.targetRepo?.readme || githubData?.readmePreview || ''

  const maturity = (readme.length > 500 ? 1 : 0) + (tests ? 1 : 0) + (hasCI ? 1 : 0) + (edges > files.length ? 1 : 0)
  return {
    name: `${repoIndex.owner}/${repoIndex.repo}`,
    purpose: githubData?.targetRepo?.description || firstSentence(readme) || `${repoIndex.repo} repository`,
    stack,
    loc,
    files: files.length,
    entry,
    largestFolders,
    complexity: loc > 8000 ? 'High' : loc > 2500 ? 'Moderate' : 'Low',
    testing: tests === 0 ? 'No test files detected' : `${tests} test file${tests > 1 ? 's' : ''}`,
    deployment: [hasDocker && 'Docker', hasCI && 'CI (GitHub Actions)'].filter(Boolean).join(' · ') || 'No deployment config detected',
    security: hasEnv ? 'Contains env/config files — verify no secrets are committed' : 'No obvious secret files detected',
    maturity: ['Early', 'Developing', 'Solid', 'Mature', 'Mature'][maturity] || 'Early',
  }
}

export function repoInterviewQuestions(repoIndex, githubData) {
  const s = repoSummary(repoIndex, githubData)
  if (!s) return []
  const has = (x) => s.stack.includes(x)
  const q = [`Walk me through the overall architecture of ${repoIndex.repo}.`]
  if (has('Vite')) q.push('Why did you choose Vite over Create React App?')
  if (has('Next.js')) q.push('How do you decide between Server and Client Components in this codebase?')
  else if (has('React')) q.push('How do you avoid unnecessary re-renders in this app?')
  if (has('Docker')) q.push('Walk me through how this project is containerised and deployed.')
  if (s.stack.some(x => ['AWS', 'Terraform', 'Kubernetes', 'GCP'].includes(x))) q.push('How is the infrastructure provisioned and scaled?')
  if (has('Redis') || has('PostgreSQL') || has('MongoDB')) q.push('How is data modelled and cached here, and what are the trade-offs?')
  q.push('What would you refactor first in this repository, and why?')
  q.push('Where are the main performance bottlenecks and how would you address them?')
  q.push('How would you scale this system for 10x traffic?')
  return [...new Set(q)].slice(0, 7)
}

export function repoStats(repoIndex) {
  if (!repoIndex) return null
  const byType = repoIndex.files.reduce((acc, file) => {
    const type = fileType(file.path)
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})
  return {
    files: repoIndex.files.length,
    allFiles: repoIndex.allFiles.length,
    skipped: repoIndex.skipped.length,
    edges: repoIndex.graph.edges.length,
    byType,
  }
}

