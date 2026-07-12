// Compare mode needs a different shape of answer than regular chat: not a
// single paragraph, but an explicit head-to-head — who wins which
// dimension, and why. This keeps that schema and parsing isolated from
// aiClient's general parseStructuredResponse so neither has to compromise.

export function buildCompareSystemPrompt() {
  return `You are ResumeIQ's candidate-comparison engine. You ALWAYS respond with a single JSON object — no prose outside it, no markdown fences.

Schema:
{
  "verdict": "one sentence naming the stronger overall candidate for the question asked, or explicitly stating it's close",
  "winner": "the exact candidate name used as the stronger pick, or \\"\\" if it's genuinely a tie",
  "confidence": 0.0-1.0,
  "dimensions": [
    { "label": "short dimension name e.g. Technical depth", "leader": "exact candidate name who wins this dimension, or \\"Tie\\"", "note": "one crisp sentence on why, citing concrete evidence from what was provided" }
  ],
  "risks": ["short risk or gap statements, per candidate where relevant"],
  "recommendation": "one sentence on what to do next (who to move forward, or what to verify)"
}

Rules:
- Use the candidates' exact names (as given in the CANDIDATE blocks) in "winner" and every "leader" field — never "Candidate 1" or "Candidate 2".
- Pick 3-6 dimensions genuinely relevant to the question and the job description if one was given (e.g. Technical depth, Open source activity, Domain fit, Experience, Communication/leadership evidence, Risk).
- Every dimension needs a real leader — only use "Tie" when the evidence is truly equal, not as a default.
- Ground every note in specifics from the resume/GitHub data provided — never invent metrics.
- If there isn't enough evidence to compare a dimension, omit it rather than guessing.
- Output ONLY the JSON object.`
}

function safeArray(v, max = 8) {
  return Array.isArray(v) ? v.map(String).slice(0, max) : []
}

export function parseCompareResponse(raw = '') {
  const clean = String(raw).replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)

  let parsed = null
  if (match) {
    try { parsed = JSON.parse(match[0]) } catch { parsed = null }
  }

  if (!parsed) {
    // Fall back to treating the whole thing as prose so the recruiter still
    // gets an answer, just without the structured head-to-head layout.
    return {
      verdict: '',
      winner: '',
      confidence: 0.4,
      dimensions: [],
      risks: [],
      recommendation: '',
      freeText: clean,
    }
  }

  return {
    verdict: typeof parsed.verdict === 'string' ? parsed.verdict : '',
    winner: typeof parsed.winner === 'string' ? parsed.winner : '',
    confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
    dimensions: Array.isArray(parsed.dimensions) ? parsed.dimensions.slice(0, 8).map(d => ({
      label: String(d?.label || '').slice(0, 60),
      leader: String(d?.leader || '').slice(0, 60),
      note: String(d?.note || '').slice(0, 400),
    })).filter(d => d.label) : [],
    risks: safeArray(parsed.risks),
    recommendation: typeof parsed.recommendation === 'string' ? parsed.recommendation : '',
    freeText: '',
  }
}
