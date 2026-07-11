// aiCopy.js — the AI-generated 2-sentence bio (Personal Card) and the
// "AI Verdict" paragraph (Comparison Card). Both use the same
// multi-provider cascade as the rest of the app's AI features
// (lib/aiProviders.js). If no provider is configured or all fail, callers
// get a template sentence instead — built from real data, but NOT labeled
// as AI-generated, since it isn't. Never silently mislabels one as the other.
import { generateWithFallback } from './aiProviders.js'

export function templateBio(data) {
  const { devType, languages, nonForkCount } = data
  const langs = languages?.slice(0, 3).map(l => l.name).join(', ')
  const base = devType?.desc || 'Builds software with a stack of their own.'
  return langs ? `${base} Most active in ${langs}.` : `${base} ${nonForkCount} public projects and counting.`
}

export async function generateBio(data) {
  const { user, devType, languages, nonForkCount, totalStars, streak } = data
  const prompt = `Write a punchy, specific 2-sentence professional bio for this developer, the kind you'd see on a premium share card. No fluff, no "passionate about." Base it only on the real data below.

Name: ${user.name || user.login}
Primary focus: ${devType?.label || 'Software Engineer'}
Top languages: ${languages?.slice(0, 4).map(l => l.name).join(', ') || 'unknown'}
Public projects: ${nonForkCount}, Stars: ${totalStars}, Current streak: ${streak} days`
  const res = await generateWithFallback(prompt)
  return res.ok ? { text: res.text.trim(), aiGenerated: true } : { text: templateBio(data), aiGenerated: false }
}

export function templateVerdict(data1, data2, winner, wins1, wins2) {
  if (winner === 'tie') return `${data1.user.login} and ${data2.user.login} are evenly matched — no clear edge across the tracked metrics.`
  const w = winner === 'user1' ? data1 : data2
  const l = winner === 'user1' ? data2 : data1
  const lead = Math.max(wins1, wins2), trail = Math.min(wins1, wins2)
  return `${w.user.login} takes it, ${lead}-${trail}. ${l.user.login} still holds their own — this is closer than the score suggests.`
}

export async function generateVerdict(data1, data2, metrics, winner, wins1, wins2) {
  const summarize = (d) => `${d.user.login}: ${d.nonForkCount} repos, ${d.totalStars} stars, ${d.user.followers} followers, ${d.streak}d streak, ${d.languages?.length || 0} languages`
  const prompt = `Write a 2-sentence, good-natured "verdict" comparing these two GitHub developers, like a sports commentator — confident but fair, specific numbers, no fabricated claims beyond what's given.

${summarize(data1)}
${summarize(data2)}
Winner by category count: ${winner === 'tie' ? 'tie' : (winner === 'user1' ? data1.user.login : data2.user.login)} (${Math.max(wins1, wins2)}-${Math.min(wins1, wins2)})`
  const res = await generateWithFallback(prompt)
  return res.ok ? { text: res.text.trim(), aiGenerated: true } : { text: templateVerdict(data1, data2, winner, wins1, wins2), aiGenerated: false }
}
