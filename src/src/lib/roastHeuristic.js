// roastHeuristic.js — the no-API-key-needed fallback for the profile Roast.
// Used when no VITE_*_API key is configured, or every AI provider fails —
// same "degrade, don't break" pattern as the rest of the app. Every field
// here is built from data that's actually on the profile — the "worst repo"
// really is whichever real repo scored lowest on repoHealth(), not a
// randomly picked insult.
import { repoHealth } from './utils.js'
import { fmt } from './utils.js'

export function buildHeuristicRoast(data) {
  const { user, score, totalStars, nonForkCount, streak, topByStars, languages } = data
  const repos = topByStars || []
  const ranked = [...repos].sort((a, b) => (b.health ?? repoHealth(b)) - (a.health ?? repoHealth(a)))
  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  const topLang = languages?.[0]?.name

  const title = score >= 80 ? 'The Overachiever' : score >= 60 ? 'The Steady Shipper' : score >= 40 ? 'The Weekend Committer' : 'The Repo Collector'

  const roastLines = []
  if (!user.bio) roastLines.push(`No bio. Mysterious, or just never got around to it — hard to tell which.`)
  if (nonForkCount > 0 && totalStars === 0) roastLines.push(`${nonForkCount} repos, zero stars. The code works, apparently nobody's watching.`)
  if (streak === 0) roastLines.push(`Current streak: 0 days. The grass touched, at least.`)
  if (worst && (worst.health ?? 0) < 30) roastLines.push(`${worst.name} exists. That's the nicest thing that can be said about it.`)
  if (!roastLines.length) roastLines.push(`Honestly? Hard to find much to roast here. Annoyingly solid.`)

  return {
    title,
    roast: roastLines.join(' '),
    score,
    strength: best
      ? `${best.name} — ${fmt(best.stars)} stars and an actual README. Real craftsmanship, occasionally.`
      : `Showing up and pushing code at all, which is more than most bios claim.`,
    weakness: worst
      ? `${worst.name} — health score ${worst.health ?? repoHealth(worst)}/100. It's not thriving.`
      : `Nothing glaring — mildly disappointing for roast purposes.`,
    funFacts: [
      topLang ? `Writes mostly ${topLang}.` : `Language of choice: unclear, and that's saying something.`,
      `${nonForkCount} public ${nonForkCount === 1 ? 'repo' : 'repos'}, ${fmt(totalStars)} stars total.`,
    ],
    bestRepo: best?.name || null,
    worstRepo: worst?.name || null,
    ifDeveloper: score >= 70
      ? `If this GitHub were a developer, it'd already have the job.`
      : `If this GitHub were a developer, it'd be great in an interview and quiet on the team Slack.`,
    aiGenerated: false,
  }
}
