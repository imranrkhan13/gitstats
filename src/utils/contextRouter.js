// ─────────────────────────────────────────────────────────────
// contextRouter.js — decide WHICH knowledge sources each question needs.
// The selected repository must NOT dominate every question.
// Pure + framework-free so it is easy to test.
// ─────────────────────────────────────────────────────────────

export function looksLikeJobDescription(text = '') {
  if (text.length < 300) return false
  const kw = /(responsibilities|requirements|what you'?ll do|qualifications|compensation|full[- ]time|on[- ]?site|we'?re looking for|benefits|equity|base|bonus|years of experience|must have)/gi
  return (text.match(kw) || []).length >= 3
}

const RE = {
  fit: /\b(should (he|she|they|we) (be )?hire|hire (him|her|them)|fit for (this|the|a)|qualified for|is (he|she|they|the candidate) qualified|good fit|match (this|the|against) (jd|job|role)|for this (jd|job|role|position))\b/,
  overall: /\b(would you hire|should (i|we) hire|how (good|strong)|is (he|she|they) (a )?(good|strong|senior|junior)|what level|seniority|overall|rate (this|the) (candidate|engineer)|red flags?|green flags?)\b/,
  interview: /\b(interview question|what should i ask|what would you ask|questions? to ask|coding task|give (him|her|them|the candidate) a task|behavio(u)?ral)\b/,
  ats: /\b(ats|resume score|scoring breakdown)\b/,
  file: /\b(this file|this code|this function|this component|explain (the )?(file|code|function|component)|any bugs?|refactor|code smell|improve this|security (issue|risk) (in|of) (this|the) (file|code)|performance (issue|of) (this|the) (file|code))\b/,
  github: /\b(github|open[- ]?source|contribution|coding style|commit activity|all (his|her|their|the) repos|repositories overall|his profile|github profile|languages? (does|do) (he|she|they) use|how active)\b/,
  repo: /\b(this repo|this repository|the repo|architecture|dependenc(y|ies)|tech stack|scale this|how good is (this|the) repo|explain (this|the|cuebench)|folder structure|entry point|code quality of (this|the) repo)\b/,
  candidate: /\b(summari[sz]e (the )?candidate|career (progression|path)|years? of experience|education|degree|leadership|communication|strengths?|weakness(es)?|background|about (the )?(candidate|resume)|who is (he|she|they))\b/,
  compare: /\bcompare\b/,
}

// friendly labels for the "Sources used" header
function sources(keys, state) {
  const { candidate, githubData, repoIndex, selectedFilePath, repoCount } = state
  const out = []
  if (keys.includes('resume') && candidate) out.push('Resume')
  if (keys.includes('github') && githubData) out.push('GitHub Profile')
  if (keys.includes('repositories') && githubData) out.push(`${repoCount || githubData.publicRepos || 0} Repositories`)
  if (keys.includes('repository') && repoIndex) out.push(`Selected Repository (${repoIndex.repo})`)
  if (keys.includes('file') && selectedFilePath) out.push(`Selected File (${selectedFilePath.split('/').pop()})`)
  if (keys.includes('ats') && candidate?.ats) out.push('ATS Engine')
  if (keys.includes('jd') && state.jobDescription) out.push('Job Description')
  return out
}

const SCOPE = {
  overall_evaluation: { label: 'Overall Candidate', tone: 'overall' },
  candidate_summary: { label: 'Candidate', tone: 'candidate' },
  github_summary: { label: 'GitHub', tone: 'github' },
  repo_summary: { label: 'Repository', tone: 'repo' },
  file_analysis: { label: 'File', tone: 'file' },
  jd_match: { label: 'Job Match', tone: 'jd' },
  ats: { label: 'ATS', tone: 'ats' },
  interview_questions: { label: 'Interview', tone: 'interview' },
  general: { label: 'Cross-source', tone: 'cross' },
}

export function routeContext(question, state = {}) {
  const q = (question || '').toLowerCase()
  const { githubData, repoIndex, selectedFilePath } = state
  const repos = (githubData?.repositories || []).map(r => r.name)
  const named = repos.filter(n => n.length > 2 && q.includes(n.toLowerCase()))
  const jd = state.jobDescription
  const isJd = looksLikeJobDescription(question)

  const mk = (intent, contexts, extra = {}) => ({
    intent,
    contexts,
    repository: extra.repository ?? (contexts.includes('repository') ? repoIndex?.repo || null : null),
    namedRepos: named,
    file: contexts.includes('file') ? selectedFilePath : null,
    needFile: !!extra.needFile,
    interviewer: !!extra.interviewer,
    scope: SCOPE[intent] || SCOPE.general,
    sources: sources(contexts, { ...state, repoCount: repos.length }),
  })

  // Job description / role fit → EVERYTHING (never just selected repo)
  if (isJd || RE.fit.test(q)) {
    return mk('jd_match', ['resume', 'github', 'repositories', 'repository', 'ats', 'jd'], { interviewer: true })
  }

  // Overall hire/level evaluation → everything available
  if (RE.overall.test(q)) {
    const ctx = ['resume', 'github', 'repositories', 'ats']
    if (repoIndex) ctx.push('repository')
    if (selectedFilePath) ctx.push('file')
    return mk('overall_evaluation', ctx, { interviewer: true })
  }

  // Interview questions / tasks — scope to the file if the question is about it, else repo+candidate
  if (RE.interview.test(q)) {
    if (selectedFilePath && (RE.file.test(q) || /this file|this code|this component/.test(q))) {
      return mk('interview_questions', ['repository', 'file', 'github'], { interviewer: true })
    }
    const ctx = ['github', 'resume']
    if (repoIndex) ctx.unshift('repository')
    return mk('interview_questions', ctx, { interviewer: true })
  }

  // ATS
  if (RE.ats.test(q)) return mk('ats', ['ats', 'resume', 'github'])

  // File-specific
  if (RE.file.test(q)) {
    if (!selectedFilePath) return mk('file_analysis', [], { needFile: true })
    return mk('file_analysis', ['repository', 'file'])
  }

  // GitHub / whole-account questions — IGNORE the selected repository
  if (RE.github.test(q) && !named.length) {
    return mk('github_summary', ['github', 'repositories'])
  }

  // Repository (named repo, "this repo", architecture, etc.)
  if (named.length || RE.repo.test(q) || RE.compare.test(q)) {
    return mk('repo_summary', ['repository', 'github'], { repository: named[0] || repoIndex?.repo || null })
  }

  // Resume / candidate
  if (RE.candidate.test(q)) return mk('candidate_summary', ['resume', 'github'])

  // Default: candidate-centric cross-source — NOT dominated by the selected repo
  // If a file is selected, always use it as the default context.
  if (selectedFilePath) {
    return mk('file', ['repository'])
  }

  return mk('general', ['resume', 'github'])
}

export function scopeTone(intent) {
  return (SCOPE[intent] || SCOPE.general).tone
}
