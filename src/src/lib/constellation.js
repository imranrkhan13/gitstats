// constellation.js — "Code Constellation": each repo becomes a star, sized
// by its real star count, colored by its real primary language, positioned
// by a seeded pseudo-random layout (seed = hash of username, so it's
// deterministic — the same profile always produces the same constellation,
// but no two profiles look alike). Stars sharing a language get a faint
// connecting line, so language clusters visually emerge on their own —
// nobody manually places anything, it falls out of the real data.
import { hashString } from './utils.js'
import { LANG_COLORS } from './constants.js'

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildConstellation(data) {
  const repos = (data.topByStars || []).slice(0, 18)
  const seed = hashString(data.user.login)
  const rand = mulberry32(seed)

  const stars = repos.map((r, i) => {
    const angle = rand() * Math.PI * 2
    const radius = 15 + rand() * 38 // spread from center, in % of viewbox
    return {
      id: r.name,
      x: 50 + Math.cos(angle) * radius * (0.5 + rand() * 0.5),
      y: 50 + Math.sin(angle) * radius * (0.5 + rand() * 0.5),
      r: Math.max(2.2, Math.min(9, Math.log10((r.stars || 0) + 1) * 3.4 + 2)),
      color: LANG_COLORS[r.lang] || '#a08060',
      lang: r.lang,
      name: r.name,
      stars: r.stars || 0,
      delay: i * 0.05 + rand() * 0.1,
    }
  })

  const connections = []
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      if (stars[i].lang && stars[i].lang === stars[j].lang) {
        connections.push({ from: stars[i], to: stars[j] })
      }
    }
  }

  const topTwoColors = [...new Set(stars.map(s => s.color))].slice(0, 2)

  return { stars, connections, bgColors: topTwoColors.length ? topTwoColors : ['#3d2010', '#1a0f06'] }
}
