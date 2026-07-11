// badges.js — small achievement pills for the share card. Every one has a
// real threshold behind it (same discipline as the rest of the app) —
// picked to match the vocabulary from the brief, but never invented.
export function getBadges(data) {
  const { nonForkCount, totalStars, streak, longestStreak, devType, memberYears, languages } = data
  const bestStreak = Math.max(streak || 0, longestStreak || 0)
  const badges = []

  if (bestStreak >= 14) badges.push({ emoji: '🔥', label: 'Consistent Coder' })
  if (devType?.label === 'AI/ML Engineer') badges.push({ emoji: '🚀', label: 'AI Builder' })
  if (totalStars >= 50) badges.push({ emoji: '📦', label: 'Open Source' })
  if (memberYears >= 5) badges.push({ emoji: '⭐', label: 'Early Adopter' })
  if (nonForkCount >= 50) badges.push({ emoji: '💯', label: '50+ Projects' })
  if (devType?.label === 'Full-stack Engineer') badges.push({ emoji: '👨‍💻', label: 'Full Stack' })
  if ((languages?.length || 0) >= 5) badges.push({ emoji: '🌐', label: 'Polyglot' })

  return badges.slice(0, 4)
}
