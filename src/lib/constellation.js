// constellation.js — Orbital Galaxy
// Every repo becomes a planet revolving around the user's name (the sun).
// Layout is fully deterministic: seed = hash(username), so the same profile
// always produces the exact same orbits, speeds, and colors.

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

function fallbackColor(name) {
  const hue = hashString(name) % 360
  return `hsl(${hue}, 80%, 60%)`
}

export function buildConstellation(data) {
  const repos = (data.topByStars || data.repos || []).slice(0, 30)
  if (!repos.length) {
    return { planets: [], orbitRings: [], stats: {}, user: data.user }
  }

  const seed = hashString(data.user.login)
  const rand = mulberry32(seed)

  // Build year rings deterministically
  const years = [...new Set(
    repos.map(r => (r.created_at || r.year || '').toString().slice(0, 4)).filter(Boolean)
  )].sort()

  const planets = repos.map((r, i) => {
    const year = (r.created_at || r.year || '').toString().slice(0, 4)
    const yearIndex = years.indexOf(year)

    // Orbit radius: year ring + deterministic scatter so same-year repos don't stack perfectly
    const orbitRadius = 18 + (yearIndex >= 0 ? yearIndex : 0) * 12 + ((i * 7) % 3) * 3

    // Language color with name-based fallback
    const lang = r.language || r.lang || 'Unknown'
    const color = LANG_COLORS[lang] || fallbackColor(r.name)

    // Orbital speed: inner rings move faster
    const speed = 0.2 + rand() * 0.4 + (1 / orbitRadius) * 1.5

    // Planet radius by real stars (log-scaled so one mega-repo doesn't own the canvas)
    const starCount = r.stargazers_count || r.stars || 0
    const rSize = Math.max(1.2, Math.min(4.5, 1 + Math.log10(starCount + 1) * 1.2))

    return {
      id: r.id || `${r.name}-${i}`,
      name: r.name,
      lang,
      color,
      stars: starCount,
      forks: r.forks_count || r.forks || 0,
      size: r.size,
      description: r.description,
      year,
      url: r.html_url || r.url,
      // Geometry
      r: rSize,
      orbitRadius,
      baseAngle: (i / Math.max(repos.length, 1)) * Math.PI * 2 + rand() * 0.5,
      speed,
      // Visual extras
      hasRing: starCount >= 5,
      moonCount: Math.min(r.forks_count || r.forks || 0, 3),
    }
  })

  // Extract unique orbit rings for drawing dashed paths behind planets
  const orbitRings = [...new Set(planets.map(p => p.orbitRadius))].sort((a, b) => a - b)

  const stats = {
    count: planets.length,
    totalStars: planets.reduce((s, p) => s + p.stars, 0),
    totalForks: planets.reduce((s, p) => s + p.forks, 0),
  }

  return { planets, orbitRings, stats, user: data.user }
}