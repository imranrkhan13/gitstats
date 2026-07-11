// aiProviders.js — shared multi-provider LLM fallback chain.
//
// Same four providers, same env vars, same cascade order as Dashboard.jsx's
// existing "Roast Me" / "AI Summary" panel — extracted here so
// RepoShowcase.jsx's new AI Insights (Explain this repo, Suggest README
// improvements) can reuse it instead of duplicating the logic a second
// time. Dashboard.jsx's own AIPanel is untouched and keeps working exactly
// as it did before this file existed — this is purely additive.
//
// Reads VITE_GEMINI_API / VITE_GROK_API (a Groq key) / VITE_MISTRAL_API /
// VITE_COHERE_API from the environment. If none are configured, every call
// resolves { ok: false } and callers show "AI unavailable" rather than
// fabricating an answer — this file never invents a response.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function callGemini(prompt) {
  const key = import.meta.env.VITE_GEMINI_API
  if (!key) return { ok: false, status: 0, message: 'No Gemini key configured' }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 500 } }) }
  )
  if (!res.ok) { const err = await res.json().catch(() => ({})); return { ok: false, status: res.status, message: err?.error?.message || res.statusText } }
  const d = await res.json()
  const out = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  return out ? { ok: true, text: out } : { ok: false, status: 0, message: 'Empty response' }
}

async function callGrok(prompt) {
  const key = import.meta.env.VITE_GROK_API
  if (!key) return { ok: false, status: 0, message: 'No Grok key configured' }
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) { const err = await res.json().catch(() => ({})); return { ok: false, status: res.status, message: err?.error?.message || res.statusText } }
  const d = await res.json()
  const out = d.choices?.[0]?.message?.content?.trim()
  return out ? { ok: true, text: out } : { ok: false, status: 0, message: 'Empty response' }
}

async function callMistral(prompt) {
  const key = import.meta.env.VITE_MISTRAL_API
  if (!key) return { ok: false, status: 0, message: 'No Mistral key configured' }
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'mistral-small-latest', max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) { const err = await res.json().catch(() => ({})); return { ok: false, status: res.status, message: err?.error?.message || err?.message || res.statusText } }
  const d = await res.json()
  const out = d.choices?.[0]?.message?.content?.trim()
  return out ? { ok: true, text: out } : { ok: false, status: 0, message: 'Empty response' }
}

async function callCohere(prompt) {
  const key = import.meta.env.VITE_COHERE_API
  if (!key) return { ok: false, status: 0, message: 'No Cohere key configured' }
  const res = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'command-r', max_tokens: 500, message: prompt }),
  })
  if (!res.ok) { const err = await res.json().catch(() => ({})); return { ok: false, status: res.status, message: err?.message || res.statusText } }
  const d = await res.json()
  const out = d.text?.trim()
  return out ? { ok: true, text: out } : { ok: false, status: 0, message: 'Empty response' }
}

const PROVIDERS = [
  { name: 'Gemini', call: callGemini },
  { name: 'Grok', call: callGrok },
  { name: 'Mistral', call: callMistral },
  { name: 'Cohere', call: callCohere },
]

export async function generateWithFallback(prompt) {
  let lastError = ''
  for (const provider of PROVIDERS) {
    try {
      let result = await provider.call(prompt)
      if (!result.ok && result.status === 429) { await sleep(1500); result = await provider.call(prompt) }
      if (result.ok) return { ok: true, text: result.text, provider: provider.name }
      lastError = `${provider.name}: ${result.status || ''} ${result.message}`.trim()
    } catch (e) {
      lastError = `${provider.name}: ${e.message || 'Network error'}`
    }
  }
  return { ok: false, error: lastError || 'No AI providers configured' }
}
