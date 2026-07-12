// ═══════════════════════════════════════════════════════
// resumeParser.js  –  Enterprise ATS Resume Parser v3
// ═══════════════════════════════════════════════════════

// ── Skill taxonomy with display names ──
const SKILL_TAXONOMY = {
  Languages:   ['JavaScript','TypeScript','Python','Java','Go','Rust','C++','C#','PHP','Ruby','Swift','Kotlin','Scala','R','Dart','Bash'],
  Frontend:    ['React','Vue','Angular','Next.js','Nuxt.js','Svelte','HTML','CSS','Tailwind','SASS','Bootstrap','Redux','Zustand','Webpack','Vite','PWA','WebRTC'],
  Backend:     ['Node.js','Express','NestJS','Django','FastAPI','Flask','Spring','Spring Boot','Laravel','Rails','ASP.NET','gRPC','REST','GraphQL','Microservices'],
  Databases:   ['PostgreSQL','MySQL','MongoDB','Redis','SQLite','DynamoDB','Cassandra','Elasticsearch','Firebase','Prisma','TypeORM','Sequelize'],
  'Cloud/DevOps': ['AWS','GCP','Azure','Docker','Kubernetes','Terraform','CI/CD','GitHub Actions','Jenkins','Nginx','Linux','Ansible','Helm','Prometheus','Grafana','Datadog'],
  'Data/AI':   ['TensorFlow','PyTorch','Scikit-learn','Pandas','NumPy','Kafka','Spark','Airflow','dbt','Snowflake','BigQuery','LangChain','OpenAI','Hugging Face'],
  Tools:       ['Git','GitHub','GitLab','Jira','Figma','Sketch','Agile','Scrum','TDD','Jest','Cypress','Playwright'],
}

const ALL_SKILLS = Object.entries(SKILL_TAXONOMY).flatMap(([cat, skills]) =>
  skills.map(s => ({ name: s, category: cat }))
)

// ── Section header patterns ──
const SECTION_MAP = {
  experience:     /^(work\s*)?experience$|^employment(\s+(history|record))?$|^(professional\s+)?(background|career)/i,
  education:      /^education(al)?(\s+(background|history))?$|^academic|^degrees?$|^qualifications?$/i,
  skills:         /^(technical\s+)?skills?$|^competenc|^tech\s+stack$|^technologies$/i,
  certifications: /^certifications?$|^licenses?$|^credentials?$|^awards?$/i,
  projects:       /^projects?$|^portfolio$|^open\s+source$/i,
  summary:        /^(professional\s+)?(summary|profile|objective|about(\s+me)?)$/i,
}

function cleanText(raw = '') {
  return raw
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\t/g, ' ')
    .replace(/[•▪●◦‣]/g, '-')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function detectSections(lines) {
  const sections = { header: [], experience: [], education: [], skills: [], certifications: [], projects: [], summary: [] }
  let current = 'header'
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.length < 55) {
      let matched = false
      for (const [key, re] of Object.entries(SECTION_MAP)) {
        if (re.test(trimmed)) { current = key; matched = true; break }
      }
      if (matched) continue
    }
    sections[current].push(line)
  }
  return Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.join('\n')]))
}

// ── Name extraction ──
const NAME_BLOCKLIST = new Set([
  'summary','experience','education','skills','projects','certifications','profile',
  'engineer','developer','designer','manager','analyst','india','mumbai','delhi',
  'resume','curriculum','vitae','linkedin','github','phone','email','address',
])

function extractName(lines) {
  for (const raw of lines.slice(0, 10)) {
    const clean = raw.replace(/[|•▪●,]/g, ' ').replace(/\s+/g, ' ').trim()
    if (clean.length < 3 || clean.length > 45) continue
    if (/\d|@|http|www|\.|,/.test(clean)) continue
    const words = clean.split(' ').filter(Boolean)
    if (words.length < 2 || words.length > 4) continue
    if (!words.every(w => /^[A-Z][a-zA-Z'-]{1,}$/.test(w))) continue
    if (words.some(w => NAME_BLOCKLIST.has(w.toLowerCase()))) continue
    return clean
  }
  // Fallback: find "Name: ..." label
  const full = lines.join('\n')
  const m = full.match(/(?:^|\n)\s*(?:name|full\s*name)\s*[:\-]\s*([A-Z][a-z]+(?: [A-Z][a-z]+){1,3})/im)
  return m ? m[1].trim() : 'Unknown'
}

// ── Contact ──
function extractContact(text) {
  const email    = text.match(/\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/)?.[0] ?? null
  const phoneRaw = text.match(/(?:\+?\d{1,3}[\s.\-]?)?(?:\(?\d{2,4}\)?[\s.\-]?)(?:\d{2,4}[\s.\-]?){2,4}\d{2,4}/)?.[0] ?? null
  const phone    = phoneRaw ? phoneRaw.replace(/\s+/g, ' ').trim() : null
  const linkedin = text.match(/(?:linkedin\.com\/in\/)([\w\-_%]+)/i)
  const github   = text.match(/(?:github\.com\/)([\w\-_%]+)/i)
  return {
    email,
    phone,
    linkedin: linkedin ? `linkedin.com/in/${linkedin[1]}` : null,
    github:   github   ? `github.com/${github[1]}`        : null,
  }
}

// ── Role ──
const ROLE_PATTERNS = [
  /(?:title|position|role|designation)\s*[:\-]\s*([^\n,]{5,60})/i,
  /\b((?:senior|junior|lead|staff|principal|associate|head\s+of|vp\s+of)\s+)?(?:full[\s\-]?stack|frontend|backend|software|data|ml|devops|cloud|mobile|ios|android|platform|sre)\s+(?:engineer|developer|architect|scientist|analyst|manager)\b/i,
  /\b(product|engineering|technical|delivery)\s+manager\b/i,
  /\b(ui\/ux|ux|ui)\s+(designer|engineer)\b/i,
]

function extractRole(text, summarySection = '') {
  const search = [summarySection, text.slice(0, 1000)].join('\n')
  for (const re of ROLE_PATTERNS) {
    const m = search.match(re)
    if (m) return (m[1] || m[0]).trim().replace(/\s+/g, ' ').slice(0, 60)
  }
  return 'Software Professional'
}

// ── Experience ──
const MONTH = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)/i
const DATE_RANGE = new RegExp(
  `(?:${MONTH.source}\\s+)?((?:19|20)\\d{2})\\s*[-–—to]+\\s*(?:${MONTH.source}\\s+)?((?:19|20)\\d{2}|Present|Current|Now|Till\\s*[Dd]ate)`,
  'gi'
)

function extractExperience(text, expSection = '') {
  const now = new Date().getFullYear()
  const search = expSection || text

  // First try explicit "X years" mention
  const explicit = [...search.matchAll(/(\d+)\+?\s+years?\s+(?:of\s+)?(?:experience|exp)/gi)]
  if (explicit.length) {
    const max = Math.max(...explicit.map(m => parseInt(m[1], 10)))
    if (max > 0 && max < 40) return { expYears: max, jobCount: explicit.length, entries: [] }
  }

  const ranges = []
  for (const m of search.matchAll(DATE_RANGE)) {
    const start = parseInt(m[1], 10)
    const endRaw = m[2]
    const end = /present|current|now|till/i.test(endRaw) ? now : parseInt(endRaw, 10)
    if (start >= 1985 && start <= now) ranges.push({ start, end: end || now })
  }
  DATE_RANGE.lastIndex = 0

  if (!ranges.length) {
    // Fallback: just find all years and use span
    const years = (text.match(/\b(19|20)\d{2}\b/g) || []).map(Number).filter(y => y >= 1990 && y <= now)
    const min = years.length ? Math.min(...years) : null
    return { expYears: min ? Math.min(now - min, 35) : null, jobCount: 0, entries: [] }
  }

  // Sum non-overlapping ranges
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  let total = 0, cursor = sorted[0].start
  for (const r of sorted) {
    const s = Math.max(r.start, cursor)
    if (r.end > s) { total += r.end - s; cursor = r.end }
  }

  return {
    expYears: total || Math.min(now - sorted[0].start, 35),
    jobCount: sorted.length,
    entries:  sorted.map(r => ({ startYear: r.start, endYear: r.end })),
  }
}

// ── Education ──
const DEGREE_RE = /\b(Ph\.?D|Doctorate|M\.?Tech|M\.?S\.?|M\.?Sc|MSc|Masters?|MBA|M\.?E\.?|B\.?Tech|B\.?E\.?|B\.?S\.?|B\.?Sc|Bachelors?|B\.?A\.?|Associate|Diploma)[^\n]{0,100}/i

function extractEducation(text, eduSection = '') {
  const search = eduSection || text
  const matches = [...search.matchAll(new RegExp(DEGREE_RE.source, 'gi'))].map(m => m[0].trim().slice(0, 120))
  const primary = matches[0] || null
  let degreeLevel = 0
  if (/phd|ph\.d|doctor/i.test(search))              degreeLevel = 4
  else if (/m\.tech|mtech|m\.s|msc|master|mba/i.test(search)) degreeLevel = 3
  else if (/b\.tech|btech|b\.e|bsc|bachelor/i.test(search))   degreeLevel = 2
  else if (/associate|diploma/i.test(search))         degreeLevel = 1
  return { primary, all: matches.slice(0, 4), degreeLevel }
}

// ── Skills ──
function extractSkills(text, skillsSection = '') {
  const searchText = [skillsSection, text].filter(Boolean).join('\n')
  const byCategory = {}
  const seen = new Set()

  for (const { name, category } of ALL_SKILLS) {
    const escaped = name.replace(/[.+()[\]{}*?^$|\\]/g, '\\$&')
    const re = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i')
    if (re.test(searchText)) {
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      if (!byCategory[category]) byCategory[category] = []
      byCategory[category].push(name)
    }
  }

  const all = Object.values(byCategory).flat()
  return { all, byCategory, count: all.length }
}

// ── Certifications ──
const CERT_PATTERNS = [
  /AWS\s+Certified[\w\s]*/gi,
  /Google\s+(?:Cloud\s+)?(?:Professional|Associate)\s+[\w\s]+(?:Engineer|Architect|Developer)/gi,
  /Microsoft\s+Certified(?:\s*:\s*[\w\s]+)?/gi,
  /Azure\s+[\w\s]+(?:Fundamentals|Engineer|Architect|Developer)/gi,
  /CKA|CKAD|CKS\b/g,
  /PMP\b|PMI-[\w]+/g,
  /Certified\s+Scrum\s+(?:Master|Product\s+Owner)/gi,
  /CISSP|CISM|CEH|CompTIA[\s+]\w+/gi,
  /Oracle\s+Certified[\w\s]*/gi,
  /Salesforce\s+Certified[\w\s]*/gi,
]

function extractCertifications(text, certSection = '') {
  const search = certSection || text
  const found = new Set()
  for (const re of CERT_PATTERNS) {
    for (const m of search.matchAll(re)) {
      const c = m[0].trim().replace(/\s+/g, ' ')
      if (c.length > 3) found.add(c)
    }
  }
  return [...found].slice(0, 8)
}

// ── Core expertise tags ──
function extractExpertise(skills = []) {
  const s = new Set(skills.map(x => x.toLowerCase()))
  const tags = []
  if (['react','vue','angular','next.js','svelte'].some(x => s.has(x)))              tags.push('Frontend Engineering')
  if (['node.js','express','django','fastapi','spring','nestjs'].some(x => s.has(x))) tags.push('Backend APIs')
  if (['docker','kubernetes','aws','gcp','azure','ci/cd'].some(x => s.has(x)))        tags.push('Cloud & DevOps')
  if (['postgresql','mongodb','mysql','redis','dynamodb'].some(x => s.has(x)))        tags.push('Database Systems')
  if (['tensorflow','pytorch','scikit-learn','pandas'].some(x => s.has(x)))           tags.push('Data & AI/ML')
  if (['react','node.js'].every(x => s.has(x)) || s.has('full-stack') || s.has('fullstack')) tags.push('Full Stack')
  if (['figma','sketch','ui','ux'].some(x => s.has(x)))                               tags.push('UI/UX Design')
  return tags
}

// ── ATS Score ──
function calcScore({ contact, skills, experience, education, certifications }) {
  const breakdown = {
    contact:  Math.min(10, (contact.email ? 3 : 0) + (contact.phone ? 2 : 0) + (contact.linkedin ? 3 : 0) + (contact.github ? 2 : 0)),
    skills:   Math.min(35, skills.count * 2),
    experience: experience.expYears >= 10 ? 25 : experience.expYears >= 7 ? 22 : experience.expYears >= 5 ? 18 : experience.expYears >= 3 ? 13 : experience.expYears >= 1 ? 8 : 2,
    education:  [0, 5, 10, 13, 15][education.degreeLevel] ?? 0,
    certs:    Math.min(10, certifications.length * 3),
    content:  Math.min(5, (experience.jobCount >= 2 ? 3 : 1) + (education.primary ? 2 : 0)),
  }
  const total = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0))
  return {
    total,
    breakdown,
    label: total >= 80 ? 'Excellent' : total >= 65 ? 'Strong' : total >= 50 ? 'Good' : total >= 35 ? 'Fair' : 'Needs Work',
  }
}

// ── MAIN ──
export function parseResume(rawText = '') {
  const text  = cleanText(rawText)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const secs  = detectSections(lines)

  const name    = extractName(lines)
  const contact = extractContact(text)
  const role    = extractRole(text, secs.summary)
  const exp     = extractExperience(text, secs.experience)
  const edu     = extractEducation(text, secs.education)
  const skills  = extractSkills(text, secs.skills)
  const certs   = extractCertifications(text, secs.certifications)
  const expertise = extractExpertise(skills.all)

  const ats = calcScore({ contact, skills, experience: exp, education: edu, certifications: certs })

  return {
    name,
    initials: name.split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || 'XX',
    role,
    contact,
    email:    contact.email,
    phone:    contact.phone,
    linkedin: contact.linkedin,
    github:   contact.github,
    expYears: exp.expYears,
    jobCount: Math.max(exp.jobCount, exp.entries.length, 1),
    education: edu.primary,
    educationAll: edu.all,
    degreeLevel: edu.degreeLevel,
    skills: skills.all,
    skillsByCategory: skills.byCategory,
    certifications: certs,
    expertise,
    ats,
    score: ats.total,
    parsedAt: Date.now(),
  }
}

// ── Build rich context string for the LLM ──
export function buildResumeContext(p) {
  if (!p) return 'No resume uploaded.'
  const lines = [
    '=== CANDIDATE RESUME DATA ===',
    `Name:         ${p.name}`,
    `Current Role: ${p.role}`,
    '',
    '--- CONTACT ---',
    `Email:    ${p.email    || 'Not found'}`,
    `Phone:    ${p.phone    || 'Not found'}`,
    `LinkedIn: ${p.linkedin || 'Not found'}`,
    `GitHub:   ${p.github   || 'Not found'}`,
    '',
    '--- EXPERIENCE ---',
    `Total Years: ${p.expYears ?? 'Unknown'}`,
    `Job Count:   ${p.jobCount}`,
    '',
    '--- EDUCATION ---',
    `Primary: ${p.education || 'Not mentioned'}`,
    ...(p.educationAll?.slice(1).map(e => `  • ${e}`) || []),
    '',
    `--- SKILLS (${p.skills.length} detected) ---`,
    ...Object.entries(p.skillsByCategory || {}).map(([cat, sks]) => `  ${cat}: ${sks.join(', ')}`),
    '',
    '--- CERTIFICATIONS ---',
    ...(p.certifications?.length ? p.certifications.map(c => `  • ${c}`) : ['  None detected']),
    '',
    '--- ATS ENGINE OUTPUT (authoritative — do NOT recalculate or invent values) ---',
    JSON.stringify({
      score: p.ats?.total ?? p.score ?? null,
      label: p.ats?.label ?? null,
      breakdown: p.ats?.breakdown ?? null,
    }, null, 2),
    'Note: The ATS engine did NOT return a "missing skills" list, recommendations, or a target job description. Do not invent them.',
  ]
  return lines.join('\n')
}
