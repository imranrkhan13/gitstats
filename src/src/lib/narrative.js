// narrative.js — turns raw numbers into sentences, used on the Profile Card
// and in share captions (e.g. "Built 47 public projects. Still building."
//
// Hard rule (matches the "no fake metrics" direction): every line here
// restates something the data actually shows, in plainer words. None of
// these compare the person against other users — GitStatus doesn't have a
// database of every profile it's ever scored, so a claim like "top 18% of
// developers" would be invented, not measured. Where more context genuinely
// helps, the context is about their OWN data (their language mix, their own
// streak history) — never a fabricated population comparison.
//
// This is template-based string generation running in the browser, not a
// live model call. Said so plainly rather than letting "storytelling" imply
// something it isn't.

export function buildStory(data) {
  const { user, nonForkCount, totalStars, streak, longestStreak, languages, memberYears, devType, spotlightRepo, reposByYear, repoTypes } = data
  const bestStreak = Math.max(streak || 0, longestStreak || 0)
  const topLang = languages?.[0]

  const peak = (reposByYear || []).reduce((best, y) => (y.count > (best?.count || 0) ? y : best), null)
  const topType = repoTypes?.[0]

  return {
    repos: nonForkCount >= 1
      ? `Built ${nonForkCount} public ${nonForkCount === 1 ? 'project' : 'projects'}.\nStill building.`
      : `Hasn't published a public project yet.\nThe first one's coming.`,

    reach: totalStars >= 1
      ? `${totalStars.toLocaleString()} ${totalStars === 1 ? 'person' : 'people'} starred the work.`
      : `Growing an open-source presence.`,

    community: (user?.followers || 0) >= 1
      ? `${user.followers.toLocaleString()} ${user.followers === 1 ? 'developer' : 'developers'} follow along.`
      : `Building in public — the audience comes next.`,

    consistency: bestStreak >= 7
      ? `A ${bestStreak}-day streak, at best.\nShowing up, one commit at a time.`
      : `Building at their own pace.\nNo pressure, no burnout.`,

    languages: topLang
      ? (languages.length > 1
        ? `Writes mostly ${topLang.name} — fluent across ${languages.length} languages in total.`
        : `${topLang.name}, through and through.`)
      : `Still finding their primary language.`,

    tenure: memberYears >= 1
      ? `${memberYears} ${memberYears === 1 ? 'year' : 'years'} on GitHub.`
      : `Just getting started on GitHub.`,

    spotlight: spotlightRepo
      ? {
          text: `Favorite project: ${spotlightRepo.name}${spotlightRepo.stars ? ` — ${spotlightRepo.stars.toLocaleString()} stars` : ''}.${spotlightRepo.desc ? `\n"${spotlightRepo.desc}"` : ''}`,
          repoName: spotlightRepo.name,
        }
      : null,

    devTypeLine: devType?.desc || 'A developer with a stack of their own.',

    peakYear: peak && peak.count >= 2
      ? `${peak.year} was the busiest — ${peak.count} new ${peak.count === 1 ? 'repo' : 'repos'} started that year.`
      : null,

    focusArea: topType && topType.count >= 2
      ? `Most of the time went into ${topType.type} — ${topType.count} ${topType.count === 1 ? 'project' : 'projects'} in that lane.`
      : null,

    // "Fastest growing repository" from the brief isn't included here — it needs
    // star-history-over-time data, which GitHub's API doesn't expose from a
    // profile fetch (would need paginating star events per repo). These three
    // are the ones honestly computable from data already on hand.
    biggestCodebase: (() => {
      const repos = data.topByStars || []
      const biggest = [...repos].sort((a, b) => (b.size || 0) - (a.size || 0))[0]
      return biggest && biggest.size > 0
        ? { text: `${biggest.name} is the biggest by repo size — ${Math.round(biggest.size / 1024) || 1}MB.`, repoName: biggest.name }
        : null
    })(),

    mostUnderrated: (() => {
      const repos = data.topByStars || []
      // "Underrated" = real engineering signal (health, computed from README/
      // topics/description/issues — already-fetched data, no extra calls) that
      // isn't matched by star count. Deliberately not the AI-fetched Engineering
      // Score here — that's per-repo and rate-limit-gated; this uses what's
      // already on hand for every repo in the profile.
      const candidates = repos.filter(r => (r.health || 0) >= 55 && r.stars <= 5)
      const best = candidates.sort((a, b) => (b.health || 0) - (a.health || 0))[0]
      return best ? { text: `${best.name} — solid by the numbers, quiet on stars (${best.stars}).`, repoName: best.name } : null
    })(),

    longestMaintained: (() => {
      const repos = data.topByStars || []
      const active = repos.filter(r => r.created && r.pushed)
      const longest = active.sort((a, b) => new Date(a.created) - new Date(b.created))[0]
      if (!longest) return null
      const years = Math.max(1, Math.round((Date.now() - new Date(longest.created)) / 31536000000))
      return years >= 2 ? { text: `${longest.name} has been maintained for ${years} years — still getting pushes.`, repoName: longest.name } : null
    })(),
  }
}
