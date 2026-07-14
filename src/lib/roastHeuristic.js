import { repoHealth } from "./utils.js"

export function buildHeuristicRoast(data) {
  const {
    user,
    score,
    totalStars,
    nonForkCount,
    streak,
    topByStars,
    languages,
    followers,
    totalForks = 0,
  } = data

  const repos = topByStars || []
  const ranked = [...repos].sort(
    (a, b) => (b.health ?? repoHealth(b)) - (a.health ?? repoHealth(a))
  )

  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  const avgHealth = ranked.length
    ? ranked.reduce((sum, r) => sum + (r.health ?? repoHealth(r)), 0) / ranked.length
    : 0

  const topLang = languages?.[0]?.name || "JavaScript"
  const yearJoined = user.created_at?.slice(0, 4)
  const yearsOnGH = new Date().getFullYear() - parseInt(yearJoined || '2020')

  // ─── TITLES ───────────────────────────────────────────────────
  const titles = []
  if (score < 20) titles.push("GitHub Ghost", "Digital Hoarder", "Starless Void")
  if (score < 40 && score >= 20) titles.push("README Fugitive", "Open Source Graveyard Keeper")
  if (score < 60 && score >= 40) titles.push("Weekend Warrior", "The Branch Nobody Merges")
  if (score >= 60 && score < 80) titles.push("Junior With Confidence", "Code Archaeologist")
  if (score >= 80) titles.push("Actually Competent", "The One Who Reads Docs")
  if (streak === 0) titles.push("Commit Graph Ghost")
  if (streak >= 100) titles.push("Touch Grass Challenger")
  if (totalStars === 0) titles.push("Repository Black Hole")
  if (followers === 0) titles.push("Influencer in Reverse")
  if (nonForkCount > 30 && totalStars < 10) titles.push("Quantity Over Quality LLC")
  if (yearsOnGH > 5 && score < 30) titles.push("Veteran Lurker")

  const title = titles.length > 0
    ? titles[Math.floor(Math.random() * titles.length)]
    : "Professional Coder (Allegedly)"

  // ─── SHORT ROASTS: 2–3 sentences, savage ──────────────────────
  const roasts = []

  // Stars (harshest = first priority)
  if (totalStars === 0 && nonForkCount > 10) {
    roasts.push(`${nonForkCount} repos, zero stars. You're building a digital graveyard.`)
  } else if (totalStars === 0) {
    roasts.push(`Zero stars across ${nonForkCount} repos. Even your code doesn't want to be seen.`)
  } else if (totalStars < 5) {
    roasts.push(`${totalStars} total stars. Your repos are basically private diaries with public access.`)
  }

  // Streak
  if (streak === 0 && yearsOnGH > 1) {
    roasts.push(`Your commit graph is so white it could be a fresh sheet of paper.`)
  } else if (streak >= 100) {
    roasts.push(`${streak} days straight. Please go outside and remember what grass feels like.`)
  }

  // Forks
  if (totalForks === 0 && nonForkCount > 3) {
    roasts.push(`Nobody has forked your code. Literally nobody wants to inherit your problems.`)
  }

  // Bio
  if (!user.bio) {
    roasts.push(`Your empty bio is the most interesting part of this profile.`)
  }

  // Followers
  if (followers === 0) {
    roasts.push(`Zero followers. Not even your alt account follows you.`)
  } else if (followers < 5) {
    roasts.push(`${followers} followers. Most of whom are probably web scrapers.`)
  }

  // Repo health
  if (worst && (worst.health ?? repoHealth(worst)) < 25) {
    roasts.push(`${worst.name} looks like it was written in a dark room under extreme duress.`)
  }
  if (avgHealth < 30 && ranked.length > 3) {
    roasts.push(`Average repo health: ${avgHealth.toFixed(0)}/100. This isn't a portfolio, it's a hospital ward.`)
  }

  // Languages
  if (topLang === "JavaScript") {
    roasts.push(`TypeScript exists, yet you still insist on writing JavaScript bugs by hand.`)
  } else if (topLang === "Python") {
    roasts.push(`Python is great, but copy-pasting code with indentation errors is a choice.`)
  } else if (topLang === "TypeScript") {
    roasts.push(`Spends 3 hours fixing types, 10 minutes writing logic.`)
  } else if (topLang === "HTML") {
    roasts.push(`HTML as your top language? That's not coding, that's digital scrapbooking.`)
  }

  // Score
  if (score < 20) {
    roasts.push(`A score of ${score}/100 is almost low enough to be an achievement.`)
  } else if (score < 40) {
    roasts.push(`${score}/100. That's not a score, that's a participation grade.`)
  }

  // Fallback
  if (roasts.length === 0) {
    roasts.push(`I couldn't find much to roast, which is the saddest part of your profile.`)
  }

  // Pick 2–3 best, no duplicates
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)
  const finalRoast = shuffle(roasts).slice(0, 3).join(" ")

  // ─── SHORT STRENGTH ───────────────────────────────────────────
  let strength = "High commitment to starting useless projects."
  if (best && (best.health ?? repoHealth(best)) > 60) strength = `${best.name} is almost readable.`
  else if (streak >= 30) strength = "Unstoppable consistency."
  else if (languages.length > 5) strength = "Jack of all trades."
  else if (nonForkCount > 30) strength = "Prolific output."
  else if (totalStars > 50) strength = "Some people actually like your code."

  // ─── SHORT WEAKNESS ───────────────────────────────────────────
  let weakness = "No one forks or uses your code."
  if (streak === 0 && yearsOnGH > 1) weakness = "Coding consistency is non-existent."
  else if (totalStars === 0 && nonForkCount > 5) weakness = "Unable to get a single star."
  else if (followers === 0) weakness = "Digital invisibility."
  else if (score < 20) weakness = "Statistically insignificant presence."

  // ─── SHORT FUN FACTS ──────────────────────────────────────────
  const funFacts = []
  if (totalStars === 0) funFacts.push("Zero-star streak: perfect")
  else funFacts.push(`${totalStars} stars across ${nonForkCount} repos`)

  if (streak === 0) funFacts.push("Active streak: 0 days")
  else funFacts.push(`${streak}-day streak`)

  if (followers === 0) funFacts.push("Followers: absolutely barren")
  else funFacts.push(`${followers} followers`)

  // ─── SHORT DEV COMPARISON ─────────────────────────────────────
  const comparisons = [
    "they'd be the intern who stays for 5 years without a promotion.",
    "they'd force-push broken code to main on Friday.",
    "they'd use print statements in production.",
    "they'd blame the compiler for their typos.",
    "they'd still be configuring their theme on deployment day.",
  ]

  return {
    title,
    roast: finalRoast,
    score,
    strength,
    weakness,
    funFacts: funFacts.slice(0, 2),
    ifDeveloper: "If this GitHub were a developer, " + comparisons[Math.floor(Math.random() * comparisons.length)],
    aiGenerated: false,
  }
}