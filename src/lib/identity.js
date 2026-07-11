// identity.js — the one label GitStatus assigns a profile, replacing the old
// "rarity tier" (Common/Rare/Epic/.../Immortal) system entirely.
//
// Why the change: a rarity tier implies a trading-card game — cute for a
// side project, wrong for something a developer might put in front of a
// recruiter. An identity ("The Builder", "The Architect") is the same idea
// — a single memorable label — without the gaming connotation, and every
// option below is chosen from real signals already in the data, not rolled
// like a loot table.
//
// Every archetype has a plain-English "why" so the label is explainable,
// not just declared — this matters more once it's the headline of a shared
// story than it did as a corner ribbon on a collectible.

export function calcIdentity(data) {
  const { devType, totalStars, nonForkCount, streak, longestStreak, languages, memberYears, user } = data
  const bestStreak = Math.max(streak || 0, longestStreak || 0)
  const langCount = languages?.length || 0

  const candidates = [
    {
      id: 'ai-engineer',
      title: 'The AI Engineer',
      badge: 'AI Engineer',
      condition: devType?.label === 'AI/ML Engineer',
      why: `Most of the work leans into machine learning and AI tooling.`,
    },
    {
      id: 'open-source-mentor',
      title: 'The Open Source Mentor',
      badge: 'Open Source Builder',
      condition: totalStars >= 300 && (user?.followers || 0) >= 100,
      why: `${totalStars.toLocaleString()} stars and ${user?.followers || 0} followers — people are building on this and following along.`,
    },
    {
      id: 'architect',
      title: 'The Architect',
      badge: 'Full-Stack Architect',
      condition: devType?.label === 'Full-stack Engineer' && nonForkCount >= 15,
      why: `Full-stack range across ${nonForkCount} projects — comfortable designing the whole system, not just one layer.`,
    },
    {
      id: 'backend-architect',
      title: 'The Backend Architect',
      badge: 'Backend Architect',
      condition: devType?.label === 'Backend Engineer',
      why: `Server-side systems and APIs are where most of the work lives.`,
    },
    {
      id: 'frontend-wizard',
      title: 'The Frontend Wizard',
      badge: 'Frontend Wizard',
      condition: devType?.label === 'Frontend Engineer',
      why: `UI and component work is where most of the work lives.`,
    },
    {
      id: 'consistent-creator',
      title: 'The Consistent Creator',
      badge: 'Consistent Creator',
      condition: bestStreak >= 21,
      why: `A ${bestStreak}-day streak at best — this is someone who shows up.`,
    },
    {
      id: 'explorer',
      title: 'The Explorer',
      badge: 'Polyglot Explorer',
      condition: langCount >= 6,
      why: `Fluent across ${langCount} languages — curiosity shows up in the stack, not just the bio.`,
    },
    {
      id: 'builder',
      title: 'The Builder',
      badge: 'Builder',
      condition: nonForkCount >= 8,
      why: `${nonForkCount} public projects shipped. Still building.`,
    },
  ]

  const match = candidates.find(c => c.condition) || {
    id: 'rising-builder',
    title: 'The Rising Builder',
    badge: 'Rising Builder',
    why: `Early days on GitHub — the foundation is being laid.`,
  }
  return match
}
