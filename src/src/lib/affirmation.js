// affirmation.js — "Describe Me": a warm, specific, genuinely earned
// description of the developer, not empty flattery. Every line is tied to
// a real number already on their profile — the opposite tone of the Roast
// feature (encouraging instead of comedic-critical), same discipline
// (nothing invented, nothing compared against a fake population).
import { generateWithFallback } from './aiProviders.js'
import { calcIdentity } from './identity.js'

export function templateAffirmation(data) {
  const { user, nonForkCount, totalStars, streak, longestStreak, languages, memberYears } = data
  const identity = calcIdentity(data)
  const bestStreak = Math.max(streak || 0, longestStreak || 0)
  const lines = [`You're ${identity.title.replace(/^The /, 'a ')} — ${identity.why.charAt(0).toLowerCase()}${identity.why.slice(1)}`]

  if (nonForkCount >= 1) lines.push(`${nonForkCount} public ${nonForkCount === 1 ? 'project' : 'projects'} shipped and out in the world — most people never publish anything.`)
  if (totalStars >= 1) lines.push(`${totalStars.toLocaleString()} ${totalStars === 1 ? 'person has' : 'people have'} starred your work. That's real signal, not noise.`)
  if (bestStreak >= 7) lines.push(`A ${bestStreak}-day streak at best — you're someone who shows up, not just someone who has ideas.`)
  if (memberYears >= 2) lines.push(`${memberYears} years on GitHub. This isn't a phase — it's a practice.`)
  if ((languages?.length || 0) >= 3) lines.push(`Comfortable across ${languages.length} languages — range most developers don't build.`)

  return { text: lines.slice(0, 4).join(' '), aiGenerated: false, identity }
}

export async function generateAffirmation(data) {
  const identity = calcIdentity(data)
  const { user, nonForkCount, totalStars, streak, longestStreak, languages, memberYears, devType } = data
  const prompt = `Write a warm, genuine, specific 3-4 sentence description of this developer that would make them feel proud of what they've built. Not generic flattery — ground every sentence in the real numbers below. Confident, human tone, like a mentor who actually looked at their work. No corporate speak, no exclamation-point energy.

Name: ${user.name || user.login}
Archetype: ${identity.title}
Focus: ${devType?.label || 'Software Engineer'}
Public projects: ${nonForkCount}
Total stars: ${totalStars}
Best streak: ${Math.max(streak || 0, longestStreak || 0)} days
Years on GitHub: ${memberYears}
Top languages: ${languages?.slice(0, 3).map(l => l.name).join(', ') || 'varied'}`

  const res = await generateWithFallback(prompt)
  return res.ok ? { text: res.text.trim(), aiGenerated: true, identity } : { ...templateAffirmation(data), identity }
}
