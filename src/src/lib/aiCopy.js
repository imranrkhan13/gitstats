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
  if (winner === 'tie') return `${data1.user.login} and ${data2.user.login} are dead even — nobody's winning bragging rights today, but nobody's losing them either.`
  const w = winner === 'user1' ? data1 : data2
  const l = winner === 'user1' ? data2 : data1
  const lead = Math.max(wins1, wins2), trail = Math.min(wins1, wins2)
  const starGap = Math.abs((w.totalStars || 0) - (l.totalStars || 0))
  const followerGap = Math.abs((w.user.followers || 0) - (l.user.followers || 0))
  const jab = starGap > 20
    ? `${l.user.login}'s repos are out here collecting dust — ${starGap.toLocaleString()} fewer stars than ${w.user.login}.`
    : followerGap > 20
    ? `${w.user.login} has ${followerGap.toLocaleString()} more people watching than ${l.user.login}'s current audience of "mostly bots, probably."`
    : `Both of them are close enough that this basically came down to who blinked first.`
  return `${w.user.login} takes it, ${lead}-${trail}. ${jab} Still, ${l.user.login} isn't getting swept — this is closer than the scoreboard makes it look.`
}

export async function generateVerdict(data1, data2, metrics, winner, wins1, wins2) {
  const summarize = (d) => `${d.user.login}: ${d.nonForkCount} repos, ${d.totalStars} stars, ${d.user.followers} followers, ${d.streak}d streak, ${d.languages?.length || 0} languages`
  const prompt = `Write a 2-3 sentence "verdict" comparing these two GitHub developers — funny, a little roasty, like a sports commentator who's also mildly savage, but never actually mean. Take a real, specific jab at whoever's behind using the real numbers (e.g. star gap, follower gap, streak gap) — the kind of joke a friend would make, not an insult. End on a note that's still fair to both. No fabricated claims beyond the numbers given.

${summarize(data1)}
${summarize(data2)}
Winner by category count: ${winner === 'tie' ? 'tie' : (winner === 'user1' ? data1.user.login : data2.user.login)} (${Math.max(wins1, wins2)}-${Math.min(wins1, wins2)})`
  const res = await generateWithFallback(prompt)
  return res.ok ? { text: res.text.trim(), aiGenerated: true } : { text: templateVerdict(data1, data2, winner, wins1, wins2), aiGenerated: false }
}
