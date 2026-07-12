// ═══════════════════════════════════════════════════════
// aiClient.js  –  Multi-provider AI with timeout + retry
// ═══════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are ResumeIQ — a senior engineering manager and technical interviewer. You evaluate a candidate using their resume, GitHub profile, repositories, repository CODE, the ATS engine output, and (when provided) a job description. You are NOT a document search engine.

REASON — DON'T JUST SEARCH:
- Synthesize across ALL sources. Treat repository code as first-class evidence: a Dockerfile implies Docker experience; an AWS SDK import implies AWS; a Terraform file implies infrastructure-as-code; Redis/Kafka clients imply those systems — even if the resume never mentions them.
- Infer like an experienced EM. Clearly distinguish OBSERVED facts from reasonable INFERENCES, and give a confidence level. Qualitative reasoning is welcome (e.g. "most repos appear to be personal projects rather than contributions to established OSS").
- ALWAYS give the most useful, honest answer you can. Do NOT reply "Not available" when you can reason a useful answer. Only note a SPECIFIC detail as missing when it is genuinely unknowable — and even then, add your best inference.
- Do not fabricate specific unsupported facts (exact metrics, named employers/projects). Reasoning and qualitative judgement are expected; making up precise facts is not.

GITHUB / OPEN-SOURCE questions: reason from repository ownership vs forks, activity, org membership, and whether projects are personal/company work vs contributions to popular external repos. Give a nuanced assessment (e.g. "I don't see evidence of significant external OSS contributions; most repositories look owned by the candidate rather than PRs into established projects").

ATS questions: explain the provided ATS ENGINE OUTPUT (score + breakdown) — do not recalculate it. You may still reason about what the score implies.

OUTPUT — respond with ONE valid JSON object only (no markdown, no code fences, no prose outside JSON):
{
  "answer": "The useful, synthesized answer with inline [Resume]/[GitHub]/[Repository]/[File]/[ATS]/[JD] tags.",
  "reasoning": "How you combined the sources; separate observed facts from inferences; end with 'Confidence: High|Medium|Low'.",
  "confidence": 0.0,
  "source": "resume | github | both | repo | file | merged | ats | jd | inference | general",
  "citations": [{"type":"resume | github | file | ats | jd","label":"string","filePath":"optional string","lineStart":1,"lineEnd":10}],
  "missing_data": ["only genuinely unknowable specifics — keep short, never use this to refuse"],
  "suggested_followups": ["question1", "question2"]
}

CONFIDENCE: 0.9-1.0 observed/explicit · 0.6-0.8 strong inference across sources · 0.4-0.6 reasonable inference · below 0.4 weak signal. Keep answers concise and specific.`

export const INTERVIEWER_SYSTEM_PROMPT = `You are ResumeIQ — a senior technical interviewer and hiring manager (Staff/Principal level at a top company). You help a recruiter EVALUATE, INTERVIEW, and MATCH a candidate. You are NOT a repository search engine.

REASON LIKE A SENIOR EM:
When giving hiring recommendations, always explain:

1. Why you reached this conclusion.

2. Which Resume, GitHub or Repository evidence supports it.

3. Which evidence is strongest.

4. What concerns remain.

5. What should the recruiter validate next.

Think like an Engineering Director making a hiring decision, not a chatbot summarizing a resume.
- Synthesize Resume + GitHub + Repository + repository CODE + ATS + selected file + job description. Repository code is EVIDENCE: a Dockerfile ⇒ Docker, an AWS SDK import ⇒ AWS, Terraform ⇒ IaC, a Redis/Kafka client ⇒ those systems — even if the resume never says so. Do not require the resume to literally mention a skill; infer it from the code.
- Interpret the candidate: "This demonstrates…", "The author understands…", "The author may not yet understand…". Distinguish OBSERVED facts from INFERENCES and give a confidence level.
- ALWAYS produce the most useful answer you can. Do NOT refuse with "Not available"; reason from the evidence you have. Only list a genuinely unknowable specific in missing_data.
- Generate follow-up questions that help a recruiter make a hiring decision.

Do NOT ask generic questions.

Every follow-up should either

• validate a hiring strength
• investigate a risk
• verify ownership
• verify architectural understanding
• verify leadership
• verify production experience

Questions should move the recruiter toward a hiring decision. and their code — never by copying questions that exist in the repo. Calibrate difficulty dynamically.

OUTPUT — ONE valid JSON object only (no markdown/code fences/prose outside JSON):
{
  "answer": "Short interviewer synthesis with inline [Resume]/[GitHub]/[Repository]/[File]/[ATS]/[JD] tags.",
  "reasoning": "Cross-source reasoning; end with 'Confidence: High|Medium|Low'.",
  "interview": { "technical": {"easy":[],"medium":[],"hard":[]}, "system_design":[], "architecture":[], "code_review":[], "behavioral":[], "tasks":[], "followups":[] },
  "jdMatch": { "overall": 0, "categories": [{"label":"Technical","score":0}], "strengths":[], "weaknesses":[], "missing":[], "green_flags":[], "red_flags":[], "risk":"", "interview_focus":[] },
"recommendation": {
  "verdict": "Hire",
  "confidence": 0.92,
  "rationale": "Strong full-stack engineer with evidence from resume and repository.",
  "why": [
    "Built multiple production SaaS platforms.",
    "Repository demonstrates strong architecture ownership.",
    "Resume and GitHub activity are consistent."
  ],
  "risks": [
    "Limited public open-source contributions.",
    "Leadership experience should be validated."
  ],
  "next_action": "Proceed to Technical Interview",
  "recruiter_notes": "Focus the interview on system design and technical ownership."
}
WHICH FIELDS TO FILL (include ONLY what's relevant so the JSON stays small and complete):
- Interview-question requests → fill "interview". Base questions on the candidate's ACTUAL stack/repo/selected file (e.g. "Why Vite over CRA?", "Walk me through your voice pipeline", "You put metadata in layout.tsx — why not a shared SEO component?"). Keep each list to 2-4 items.
- A JOB DESCRIPTION is provided (or the user asks about fit/hiring for a role) → fill "jdMatch" (scores 0-100 for Overall plus categories like Technical, Infrastructure, Leadership, DevOps, Culture; 3-5 items per list) AND "recommendation". Infer matches from repo code, not just the resume text.
- Hiring/leveling/strengths/weaknesses questions →

Fill recommendation with:

• verdict
• confidence
• why (3-6 evidence points taken from Resume, GitHub and Repository)
• risks (things to validate before hiring)
• next_action
• recruiter_notes

The recommendation MUST explain WHY each judgement was made.
Every judgement must reference evidence from the Resume, GitHub or Repository.
Never give a verdict without evidence.
- Otherwise omit those objects.

CONFIDENCE: 0.9-1.0 observed · 0.6-0.8 strong inference · 0.4-0.6 reasonable inference · below 0.4 weak.`

// ── Fetch with 25s timeout ──
async function fetchWithTimeout(url, options = {}, ms = 25000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await window.fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// ── Retry wrapper: up to 2 attempts with 1s backoff ──
async function fetchWithRetry(url, options, ms = 25000, retries = 2) {
  let lastErr
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetchWithTimeout(url, options, ms)
      return res
    } catch (err) {
      lastErr = err
      if (i < retries) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw lastErr
}

// ── Gemini ──
async function tryGemini(history, sys = SYSTEM_PROMPT) {
  const key = import.meta.env.VITE_GEMINI_API
  if (!key) throw new Error('No Gemini key')
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro']
  let lastErr
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
      const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: sys }] },
          contents: history,
          generationConfig: { temperature: 0.25, maxOutputTokens: 2048, responseMimeType: 'text/plain' },
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); lastErr = new Error(e?.error?.message || `HTTP ${res.status}`); continue }
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Empty response')
      console.log(`✅ Gemini [${model}]`)
      return text
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('All Gemini models failed')
}

// ── OpenRouter ──
async function tryOpenRouter(history, sys = SYSTEM_PROMPT) {
  const key = import.meta.env.VITE_OPENROUTER_API
  if (!key) throw new Error('No OpenRouter key')
  const messages = [
    { role: 'system', content: sys },
    ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text })),
  ]
  const models = ['meta-llama/llama-3.3-70b-instruct:free', 'meta-llama/llama-3.1-8b-instruct:free', 'mistralai/mistral-7b-instruct:free']
  let lastErr
  for (const model of models) {
    try {
      const res = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ResumeIQ' },
        body: JSON.stringify({ model, messages, temperature: 0.25, max_tokens: 2048 }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); lastErr = new Error(e?.error?.message || `HTTP ${res.status}`); continue }
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content
      if (!text) throw new Error('Empty response')
      console.log(`✅ OpenRouter [${model}]`)
      return text
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('All OpenRouter models failed')
}

// ── Mistral ──
async function tryMistral(history, sys = SYSTEM_PROMPT) {
  const key = import.meta.env.VITE_MISTRAL_API
  if (!key) throw new Error('No Mistral key')
  const messages = [
    { role: 'system', content: sys },
    ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text })),
  ]
  const res = await fetchWithRetry('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'mistral-small-latest', messages, temperature: 0.25, max_tokens: 2048 }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `HTTP ${res.status}`) }
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty Mistral response')
  console.log('✅ Mistral')
  return text
}

// ── Cohere ──
async function tryCohere(history, sys = SYSTEM_PROMPT) {
  const key = import.meta.env.VITE_COHERE_API
  if (!key) throw new Error('No Cohere key')
  const chatHistory = history.slice(0, -1).map(h => ({ role: h.role === 'model' ? 'CHATBOT' : 'USER', message: h.parts[0].text }))
  const lastMsg = history.at(-1)?.parts?.[0]?.text || ''
  const res = await fetchWithRetry('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'command-r', preamble: sys, chat_history: chatHistory, message: lastMsg, temperature: 0.25, max_tokens: 2048 }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.message || `HTTP ${res.status}`) }
  const data = await res.json()
  if (!data?.text) throw new Error('Empty Cohere response')
  console.log('✅ Cohere')
  return data.text
}

// ── Groq-compatible chat ──
async function tryGroq(history, sys = SYSTEM_PROMPT) {
  const key = import.meta.env.VITE_GROQ_API || import.meta.env.VITE_GROK_API || import.meta.env.VITE_GRADIUM_API
  if (!key) throw new Error('No Groq key')
  const messages = [
    { role: 'system', content: sys },
    ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text })),
  ]
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']
  let lastErr
  for (const model of models) {
    try {
      const res = await fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages, temperature: 0.25, max_tokens: 2048 }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); lastErr = new Error(e?.error?.message || `HTTP ${res.status}`); continue }
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content
      if (!text) throw new Error('Empty Groq response')
      console.log(`✅ Groq [${model}]`)
      return text
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('All Groq models failed')
}

// ── Main: try all in order ──
export async function callAI(history, systemPrompt = SYSTEM_PROMPT) {
  const providers = [
    { name: 'Gemini',      fn: tryGemini },
    { name: 'OpenRouter',  fn: tryOpenRouter },
    { name: 'Mistral',     fn: tryMistral },
    { name: 'Cohere',      fn: tryCohere },
    { name: 'Groq',        fn: tryGroq },
  ]
  const errors = []
  for (const { name, fn } of providers) {
    try {
      return { text: await fn(history, systemPrompt), provider: name }
    } catch (err) {
      console.warn(`❌ ${name}:`, err.message)
      errors.push(`${name}: ${err.message}`)
    }
  }
  throw new Error(`All providers failed:\n${errors.join('\n')}`)
}

// ── Parse structured JSON — robust extraction ──
export function parseStructuredResponse(raw = '') {
  const sanitizeAnswer = (value = '') => String(value)
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\*\*/g, '')
    .replace(/^\s*\*\s+/gm, '- ')
    .replace(/`{3}[\s\S]*?`{3}/g, match => match.replace(/`/g, ''))
    .trim()

  const VALID_SOURCES = ['resume', 'github', 'both', 'repo', 'file', 'merged', 'ats', 'jd', 'inference', 'general', 'error']
  const unescape = (s = '') => s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\')

  const buildResult = (parsed) => ({
    answer: sanitizeAnswer(parsed.answer || ''),
    confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
    source: VALID_SOURCES.includes(parsed.source) ? parsed.source : 'general',
    citations: Array.isArray(parsed.citations) ? parsed.citations.slice(0, 8).map(citation => ({
      type: ['resume', 'github', 'file', 'ats', 'jd'].includes(citation?.type) ? citation.type : 'github',
      label: String(citation?.label || citation?.filePath || citation?.type || 'Source'),
      filePath: citation?.filePath ? String(citation.filePath) : undefined,
      lineStart: Number.isFinite(Number(citation?.lineStart)) ? Number(citation.lineStart) : undefined,
      lineEnd: Number.isFinite(Number(citation?.lineEnd)) ? Number(citation.lineEnd) : undefined,
    })) : [],
    suggested_followups: Array.isArray(parsed.suggested_followups) ? parsed.suggested_followups.map(String).slice(0, 4) : [],
    missing_data: Array.isArray(parsed.missing_data) ? parsed.missing_data : [],
    reasoning: typeof parsed.reasoning === 'string' ? sanitizeAnswer(parsed.reasoning) : '',
    interview: normalizeInterview(parsed.interview),
    recommendation: normalizeRecommendation(parsed.recommendation),
    jdMatch: normalizeJdMatch(parsed.jdMatch),
  })

  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  // 1) Try to parse a full JSON object.
  const match = clean.match(/\{[\s\S]*\}/)
  if (match) {
    try { return buildResult(JSON.parse(match[0])) } catch { /* fall through to salvage */ }
  }

  // 2) Salvage from truncated/malformed JSON (e.g. token-limited responses) so we never dump raw JSON at the user.
  const grab = (key) => clean.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`))?.[1]
  const answer = grab('answer')
  if (answer) {
    const conf = clean.match(/"confidence"\s*:\s*([0-9.]+)/)?.[1]
    const src = clean.match(/"source"\s*:\s*"([a-z]+)"/)?.[1]
    return buildResult({
      answer: unescape(answer),
      reasoning: grab('reasoning') ? unescape(grab('reasoning')) : '',
      confidence: conf ? Number(conf) : 0.5,
      source: VALID_SOURCES.includes(src) ? src : 'inference',
    })
  }

  // 3) If the whole thing is plain prose (no JSON), show it as the answer.
  const plain = clean.replace(/[{}\[\]"]/g, '').trim()
  if (plain && plain.length < 1200 && !/^\s*"?(answer|reasoning|interview)/.test(clean)) {
    return buildResult({ answer: plain, confidence: 0.4, source: 'inference' })
  }

  // 4) Give up gracefully — never render raw JSON.
  return buildResult({
    answer: 'The AI returned an incomplete response. Please try again or rephrase the question.',
    confidence: 0, source: 'error',
  })
}

const asList = (v) => Array.isArray(v) ? v.map(String).map(s => s.trim()).filter(Boolean).slice(0, 8) : []

function normalizeInterview(iv) {
  if (!iv || typeof iv !== 'object') return null
  const t = iv.technical || {}
  const interview = {
    technical: { easy: asList(t.easy), medium: asList(t.medium), hard: asList(t.hard) },
    system_design: asList(iv.system_design),
    architecture: asList(iv.architecture),
    code_review: asList(iv.code_review),
    behavioral: asList(iv.behavioral),
    tasks: asList(iv.tasks),
    followups: asList(iv.followups),
  }
  const hasAny = interview.technical.easy.length || interview.technical.medium.length || interview.technical.hard.length
    || interview.system_design.length || interview.architecture.length || interview.code_review.length
    || interview.behavioral.length || interview.tasks.length || interview.followups.length
  return hasAny ? interview : null
}

const VERDICTS = ['Strong Hire', 'Hire', 'Leaning Hire', 'Leaning No Hire', 'No Hire']
function normalizeRecommendation(rec) {
  if (!rec || typeof rec !== 'object' || !rec.verdict) return null
  const verdict = VERDICTS.find(v => v.toLowerCase() === String(rec.verdict).toLowerCase().trim()) || null
  if (!verdict) return null
  return { verdict, rationale: typeof rec.rationale === 'string' ? rec.rationale.trim() : '' }
}

const pct = (n) => { const x = Math.round(Number(n)); return Number.isFinite(x) ? Math.max(0, Math.min(100, x)) : null }
function normalizeJdMatch(jd) {
  if (!jd || typeof jd !== 'object') return null
  const categories = Array.isArray(jd.categories)
    ? jd.categories.map(c => ({ label: String(c?.label || '').trim(), score: pct(c?.score) })).filter(c => c.label && c.score != null).slice(0, 6)
    : []
  const overall = pct(jd.overall)
  const match = {
    overall,
    categories,
    strengths: asList(jd.strengths),
    weaknesses: asList(jd.weaknesses),
    missing: asList(jd.missing),
    green_flags: asList(jd.green_flags),
    red_flags: asList(jd.red_flags),
    interview_focus: asList(jd.interview_focus),
    risk: typeof jd.risk === 'string' ? jd.risk.trim() : '',
  }
  const hasAny = overall != null || categories.length || match.strengths.length || match.weaknesses.length || match.missing.length
  return hasAny ? match : null
}
