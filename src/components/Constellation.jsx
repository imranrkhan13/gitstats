// Constellation.jsx — orbiting planets, deterministic galaxy, right panel
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { XIcon, DownloadIcon, CheckIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'

// ─── LANG COLORS ─────────────────────────────────────────────────────────
const LANG_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Scala: '#c22d40',
  Shell: '#89e051',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Jupyter: '#DA5B0B',
  Dockerfile: '#384d54',
  Unknown: '#a08060',
}

// ─── UTILS ───────────────────────────────────────────────────────────────
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function fallbackColor(name) {
  const hue = hashString(name) % 360
  return `hsl(${hue}, 80%, 60%)`
}

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < breakpoint : false)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return isMobile
}

function extractTechStack(description, lang) {
  if (!description) return lang ? [lang] : []
  const techs = []
  const patterns = [
    { regex: /\b(react|vue|angular|svelte|solid)\b/gi, name: m => m[0][0].toUpperCase() + m[0].slice(1) },
    { regex: /\b(node\.?js|express|fastify|nest)\b/gi, name: () => 'Node.js' },
    { regex: /\b(python|django|flask|fastapi)\b/gi, name: () => 'Python' },
    { regex: /\b(go|golang)\b/gi, name: () => 'Go' },
    { regex: /\b(rust|cargo)\b/gi, name: () => 'Rust' },
    { regex: /\b(tensorflow|pytorch|ml|ai)\b/gi, name: m => m[0].toUpperCase() },
    { regex: /\b(postgres|mysql|mongo|redis|sqlite)\b/gi, name: m => m[0][0].toUpperCase() + m[0].slice(1) },
    { regex: /\b(docker|kubernetes|k8s|aws|gcp|azure)\b/gi, name: m => m[0].toUpperCase() },
    { regex: /\b(typescript|ts)\b/gi, name: () => 'TypeScript' },
    { regex: /\b(javascript|js)\b/gi, name: () => 'JavaScript' },
    { regex: /\b(tailwind|bootstrap|sass|css)\b/gi, name: m => m[0][0].toUpperCase() + m[0].slice(1) },
    { regex: /\b(graphql|rest|api)\b/gi, name: m => m[0].toUpperCase() },
    { regex: /\b(next|nuxt|gatsby|astro)\b/gi, name: m => m[0][0].toUpperCase() + m[0].slice(1) },
    { regex: /\b(prisma|mongoose|sequelize|orm)\b/gi, name: m => m[0][0].toUpperCase() + m[0].slice(1) },
    { regex: /\b(jest|vitest|cypress|playwright)\b/gi, name: m => m[0][0].toUpperCase() + m[0].slice(1) },
    { regex: /\b(webpack|vite|rollup|esbuild)\b/gi, name: m => m[0][0].toUpperCase() + m[0].slice(1) },
  ]
  patterns.forEach(({ regex, name }) => {
    const matches = description.match(regex)
    if (matches) {
      const unique = [...new Set(matches.map(m => name([m])))]
      unique.forEach(t => { if (!techs.includes(t)) techs.push(t) })
    }
  })
  if (lang && !techs.some(t => t.toLowerCase() === lang.toLowerCase())) {
    techs.unshift(lang)
  }
  return techs.slice(0, 6)
}

// ─── ROBUST DATA EXTRACTORS ──────────────────────────────────────────────
function pickRepos(data) {
  if (!data) return []
  const arrays = [
    data?.allRepos,
    data?.repositories,
    data?.repos,
    data?.topByStars,
    Array.isArray(data) ? data : null,
  ].filter(Boolean).filter(arr => Array.isArray(arr) && arr.length)
  if (!arrays.length) return []

  const map = new Map()
  for (const arr of arrays) {
    for (const r of arr) {
      if (!r || typeof r !== 'object') continue
      const key = r.id || r.name || r.repo || r.title || `item-${map.size}`
      if (map.has(key)) {
        map.set(key, { ...map.get(key), ...r })
      } else {
        map.set(key, { ...r })
      }
    }
  }
  return Array.from(map.values())
}

function pickStars(r) {
  return r?.stargazers_count ?? r?.stars ?? r?.stargazers ?? 0
}

function pickForks(r) {
  return r?.forks_count ?? r?.forks ?? 0
}

function pickLang(r) {
  return r?.language || r?.lang || 'Unknown'
}

function pickYear(r) {
  const raw =
    r?.created_at ??
    r?.createdAt ??
    r?.year ??
    r?.pushed_at ??
    r?.pushedAt ??
    r?.created ??
    r?.date ??
    r?.updated_at ??
    r?.updatedAt ??
    ''
  if (!raw) return ''
  const str = raw.toString()
  if (/^\d{4}$/.test(str)) return str
  const isoMatch = str.match(/^(\d{4})/)
  if (isoMatch) return isoMatch[1]
  const anyMatch = str.match(/\d{4}/)
  return anyMatch ? anyMatch[0] : ''
}

function pickUrl(r) {
  return r?.html_url || r?.url || r?.link || r?.web_url || null
}

function pickDesc(r) {
  return r?.description ?? r?.desc ?? r?.about ?? r?.bio ?? null
}

function pickSize(r) {
  return r?.size ?? 0
}

function pickName(r) {
  return r?.name || r?.repo || r?.title || 'Unknown'
}

// ─── GALAXY BUILDER ──────────────────────────────────────────────────────
function buildConstellation(data) {
  const repos = pickRepos(data)
  if (!repos.length) {
    return { planets: [], orbitRings: [], stats: { count: 0, totalStars: 0, totalForks: 0 }, user: data?.user }
  }

  const seed = hashString(data?.user?.login || 'unknown')
  const rand = mulberry32(seed)

  const years = [...new Set(repos.map(r => pickYear(r)).filter(Boolean))].sort()

  // Group repos by year, then assign orbit rings
  const yearGroups = new Map()
  repos.forEach((r, i) => {
    const year = pickYear(r) || 'unknown'
    if (!yearGroups.has(year)) yearGroups.set(year, [])
    yearGroups.get(year).push({ ...r, _index: i })
  })

  const planets = []
  let ringIndex = 0

  // Sort years so oldest is outermost
  const sortedYears = [...yearGroups.keys()].sort()

  sortedYears.forEach(year => {
    const group = yearGroups.get(year)
    const baseRadius = 25 + ringIndex * 18

    group.forEach((r, i) => {
      const lang = pickLang(r)
      const color = LANG_COLORS[lang] || fallbackColor(pickName(r))
      const starCount = pickStars(r)
      const rSize = Math.max(1.5, Math.min(5, 1.5 + Math.log10(starCount + 1) * 1.4))

      // Spread planets in same year across the ring with angular spacing
      const angleStep = (Math.PI * 2) / Math.max(group.length, 1)
      const baseAngle = i * angleStep + rand() * 0.3

      planets.push({
        id: r?.id || `${pickName(r)}-${r._index}`,
        name: pickName(r),
        lang,
        color,
        stars: starCount,
        forks: pickForks(r),
        size: pickSize(r),
        description: pickDesc(r),
        year,
        url: pickUrl(r),
        r: rSize,
        orbitRadius: baseRadius + (i % 2) * 4, // slight radius variation
        baseAngle,
        speed: 0.15 + rand() * 0.25 + (1 / baseRadius) * 2,
        hasRing: starCount >= 5,
        moonCount: Math.min(pickForks(r), 3),
      })
    })

    ringIndex++
  })

  const orbitRings = [...new Set(planets.map(p => p.orbitRadius))].sort((a, b) => a - b)
  const stats = {
    count: planets.length,
    totalStars: planets.reduce((s, p) => s + p.stars, 0),
    totalForks: planets.reduce((s, p) => s + p.forks, 0),
  }

  return { planets, orbitRings, stats, user: data?.user }
}

// ─── SUN ─────────────────────────────────────────────────────────────────
function Sun({ login, score }) {
  const hue = score >= 80 ? 45 : score >= 50 ? 35 : 0
  const color = `hsl(${hue}, 90%, 60%)`

  return (
    <g>
      <motion.circle cx={0} cy={0} r={12} fill={color} opacity={0.08} filter="blur(10px)"
        animate={{ scale: [1, 1.6, 1], opacity: [0.06, 0.15, 0.06] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle cx={0} cy={0} r={7} fill={color} opacity={0.2} filter="blur(4px)"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <circle cx={0} cy={0} r={3.5} fill="#fff" />
      <circle cx={0} cy={0} r={2.5} fill={color} />
      <text x={0} y={-8} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="3" fontWeight="800" fontFamily="Inter,sans-serif">{login}</text>
    </g>
  )
}

// ─── ORBITING PLANET ─────────────────────────────────────────────────────
function OrbitingPlanet({ planet, isSelected, isDimmed, onHover, onLeave, onClick, time, viewScale }) {
  const { orbitRadius, baseAngle, speed, r, color, name, stars, forks } = planet

  const currentAngle = baseAngle + time * speed
  const x = Math.cos(currentAngle) * orbitRadius
  const y = Math.sin(currentAngle) * orbitRadius

  const hasRing = stars >= 5
  const moonCount = Math.min(forks, 3)

  // Hide label if too close to edge or too small
  const showLabel = viewScale > 0.4 || isSelected

  return (
    <motion.g
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => onHover({ ...planet, x, y })}
      onMouseLeave={onLeave}
      onClick={(e) => { e.stopPropagation(); onClick({ ...planet, x, y }) }}
      animate={{ opacity: isDimmed ? 0.15 : 1 }}
      transition={{ duration: 0.3 }}
    >
      {isSelected && (
        <motion.circle
          cx={x} cy={y} r={r + 4}
          fill="none"
          stroke={color}
          strokeWidth={0.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <circle cx={x} cy={y} r={r * 4} fill={color} opacity={0.04} filter={`blur(${r * 1.5}px)`} />
      <circle cx={x} cy={y} r={r} fill={color} style={{ filter: `drop-shadow(0 0 ${r * 1.5}px ${color}50)` }} />
      <ellipse cx={x - r * 0.3} cy={y - r * 0.3} rx={r * 0.4} ry={r * 0.3} fill="rgba(255,255,255,0.2)" />

      {hasRing && (
        <ellipse
          cx={x} cy={y} rx={r * 2.5} ry={r * 0.6}
          fill="none" stroke={color} strokeWidth={0.2} opacity={0.3}
          transform={`rotate(${currentAngle * 57.3 + 30} ${x} ${y})`}
        />
      )}

      {Array.from({ length: moonCount }, (_, i) => {
        const moonAngle = currentAngle * 3 + i * 2.1
        const dist = r + 2.5
        return (
          <circle
            key={i}
            cx={x + Math.cos(moonAngle) * dist}
            cy={y + Math.sin(moonAngle) * dist}
            r={0.3}
            fill="rgba(255,255,255,0.5)"
          />
        )
      })}

      {showLabel && (
        <g>
          <rect
            x={x - (Math.min(name.length, 12) * 1.2 + 1)}
            y={y - r - 6}
            width={Math.min(name.length, 12) * 2.4 + 2}
            height={3.2}
            rx={1.6}
            fill="rgba(0,0,0,0.7)"
          />
          <text
            x={x} y={y - r - 3.2}
            textAnchor="middle"
            fill={isSelected ? '#fff' : 'rgba(255,255,255,0.75)'}
            fontSize="2"
            fontWeight={isSelected ? 800 : 600}
            fontFamily="Inter,sans-serif"
          >
            {name.length > 12 ? name.slice(0, 10) + '..' : name}
          </text>
        </g>
      )}

      {stars > 0 && (
        <g transform={`translate(${x + r + 2.5}, ${y})`}>
          <circle r={2} fill="rgba(0,0,0,0.6)" />
          <text textAnchor="middle" dy="0.6" fill="#fbbf24" fontSize="1.6" fontWeight="800">{stars}</text>
        </g>
      )}
    </motion.g>
  )
}

// ─── DESCRIPTION PANEL ───────────────────────────────────────────────────
function DescriptionPanel({ planet, onClose }) {
  if (!planet) {
    return (
      <div style={{
        padding: 32,
        borderRadius: 20,
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        textAlign: 'center',
        minHeight: 200,
      }}>
        <div style={{ fontSize: 36 }}>🪐</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
          Click a planet to explore
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          Each repo orbits at its own speed
        </div>
      </div>
    )
  }

  const techStack = extractTechStack(planet.description, planet.lang)
  const sizeDisplay = planet.size
    ? planet.size > 1024
      ? `${(planet.size / 1024).toFixed(1)}MB`
      : `${planet.size}KB`
    : '—'

  return (
    <motion.div
      key={planet.id}
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{
        padding: 24,
        borderRadius: 20,
        background: 'rgba(8, 6, 4, 0.95)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${planet.color}20`,
        boxShadow: `0 0 50px ${planet.color}08`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${planet.color}, ${planet.color}66)`,
          boxShadow: `0 0 28px ${planet.color}40, inset -4px -4px 10px rgba(0,0,0,0.3)`,
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {planet.name}
          </div>
          <div style={{ fontSize: 12, color: planet.color, fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {planet.lang || 'Unknown'}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <XIcon size={14} color="rgba(255,255,255,0.6)" />
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        <StatBox label="Stars" value={planet.stars} color="#fbbf24" />
        <StatBox label="Forks" value={planet.forks || 0} color="#a78bfa" />
        <StatBox label="Size" value={sizeDisplay} color="#60a5fa" />
        <StatBox label="Year" value={planet.year || '—'} color="#34d399" />
      </div>

      {techStack.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Built with
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {techStack.map((tech, i) => (
              <span key={i} style={{
                padding: '6px 12px',
                borderRadius: 10,
                background: `${planet.color}12`,
                border: `1px solid ${planet.color}22`,
                color: planet.color,
                fontSize: 12,
                fontWeight: 700,
              }}>
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{
        padding: 16,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          About
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          {planet.description || 'No description provided. This planet remains a mystery.'}
        </div>
      </div>

      {planet.url && (
        <a
          href={planet.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            marginTop: 16,
            padding: '12px 0',
            borderRadius: 12,
            background: `${planet.color}10`,
            border: `1px solid ${planet.color}18`,
            color: planet.color,
            fontSize: 13,
            fontWeight: 800,
            textAlign: 'center',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.target.style.background = `${planet.color}22`; e.target.style.transform = 'translateY(-1px)' }}
          onMouseLeave={(e) => { e.target.style.background = `${planet.color}10`; e.target.style.transform = '' }}
        >
          View on GitHub →
        </a>
      )}
    </motion.div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color }}>{value}</div>
    </div>
  )
}

// ─── ZOOM/PAN CONTROLS ───────────────────────────────────────────────────
function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 5,
    }}>
      <button onClick={onZoomIn} style={zoomBtnStyle}>+</button>
      <button onClick={onReset} style={zoomBtnStyle}>⟲</button>
      <button onClick={onZoomOut} style={zoomBtnStyle}>−</button>
    </div>
  )
}

const zoomBtnStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  fontSize: 18,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(8px)',
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────
export function Constellation({ data, onClose }) {
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [saved, setSaved] = useState(false)
  const [time, setTime] = useState(0)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const cardRef = useRef(null)
  const svgRef = useRef(null)
  const isMobile = useIsMobile()

  // Animation loop
  useEffect(() => {
    let frame
    const tick = () => {
      setTime(t => t + 0.003)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const { planets, orbitRings, stats } = useMemo(() => buildConstellation(data), [data])

  const handlePlanetClick = useCallback((planet) => {
    setSelected(prev => (prev?.id === planet.id ? null : planet))
  }, [])

  const handleBackgroundClick = useCallback(() => {
    setSelected(null)
  }, [])

  // Zoom/pan handlers
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(s => Math.max(0.3, Math.min(3, s * delta)))
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.target.tagName === 'circle' || e.target.tagName === 'ellipse' || e.target.tagName === 'text') return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }, [pan])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const zoomIn = () => setScale(s => Math.min(3, s * 1.3))
  const zoomOut = () => setScale(s => Math.max(0.3, s / 1.3))
  const resetView = () => { setScale(1); setPan({ x: 0, y: 0 }) }

  const download = async () => {
    const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: '#050302', logging: false })
    const a = document.createElement('a')
    a.download = `gitstatus-galaxy-${data?.user?.login || 'user'}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Calculate viewBox based on planet count
  const maxRadius = Math.max(...orbitRings, 100)
  const viewBoxSize = Math.max(200, maxRadius * 2 + 40)
  const viewBox = `${-viewBoxSize / 2} ${-viewBoxSize / 2} ${viewBoxSize} ${viewBoxSize}`

  const panelContent = (
    <>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        {selected ? 'Planet Details' : 'Explore'}
      </div>

      <DescriptionPanel planet={selected} onClose={isMobile ? () => setSelected(null) : undefined} />

      <div style={{
        padding: 16,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          All Planets ({planets.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
          {planets.map(p => (
            <button
              key={p.id}
              onClick={() => handlePlanetClick(p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 10,
                background: selected?.id === p.id ? `${p.color}10` : 'transparent',
                border: `1px solid ${selected?.id === p.id ? `${p.color}20` : 'rgba(255,255,255,0.04)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
                flexShrink: 0,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: `0 0 8px ${p.color}40` }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: selected?.id === p.id ? '#fff' : 'rgba(255,255,255,0.5)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.name}
              </span>
              <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, flexShrink: 0 }}>{p.stars}★</span>
            </button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={download}
        whileHover={{ scale: 1.02 }}
        style={{
          marginTop: 'auto',
          height: 44,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {saved ? <><CheckIcon size={14} color="#4ade80" /> Saved</> : <><DownloadIcon size={14} /> Save Galaxy</>}
      </motion.button>
    </>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        backgroundColor: '#050302',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
            {BRAND.appName}
          </div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#fff', marginTop: 2 }}>
            @{data?.user?.login || 'user'}'s Galaxy
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20 }}>
          <div style={{ display: 'flex', gap: isMobile ? 10 : 16 }}>
            <TopStat value={stats.count} label="planets" />
            <TopStat value={stats.totalStars} label="stars" />
            <TopStat value={stats.totalForks} label="forks" />
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <XIcon size={18} color="rgba(255,255,255,0.5)" />
          </motion.button>
        </div>
      </div>

      {/* Main: Galaxy + Description */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        {/* Galaxy */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: isMobile ? 8 : 20,
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <div
            ref={cardRef}
            onClick={handleBackgroundClick}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: isMobile ? '100%' : 900,
              maxHeight: isMobile ? 400 : '100%',
              position: 'relative',
              borderRadius: 28,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              background: '#050302',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            <svg
              ref={svgRef}
              viewBox={viewBox}
              style={{
                width: '100%',
                height: '100%',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              {/* Background stars */}
              {Array.from({ length: 120 }, (_, i) => {
                const spread = viewBoxSize * 0.7
                const sx = ((hashString((data?.user?.login || '') + i) % 1000) / 1000 - 0.5) * spread
                const sy = ((hashString((data?.user?.login || '') + i + 1) % 1000) / 1000 - 0.5) * spread
                return (
                  <motion.circle
                    key={`bg-${i}`}
                    cx={sx}
                    cy={sy}
                    r={0.3 + ((i * 7) % 5) / 10}
                    fill="#fff"
                    animate={{ opacity: [0, 0.5, 0.15, 0.35, 0] }}
                    transition={{ delay: (i * 3) % 7, duration: 4 + (i % 5), repeat: Infinity }}
                  />
                )
              })}

              {/* Orbit paths */}
              {orbitRings.map((r, i) => (
                <circle
                  key={i}
                  cx={0} cy={0} r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth={0.4}
                  strokeDasharray="2 6"
                />
              ))}

              {/* Sun */}
              <Sun login={data?.user?.login || 'user'} score={data?.score || 50} />

              {/* Planets */}
              {planets.map(p => (
                <OrbitingPlanet
                  key={p.id}
                  planet={p}
                  isSelected={selected?.id === p.id}
                  isDimmed={selected && selected.id !== p.id}
                  onHover={setHovered}
                  onLeave={() => setHovered(null)}
                  onClick={handlePlanetClick}
                  time={time}
                  viewScale={scale}
                />
              ))}
            </svg>

            <ZoomControls
              scale={scale}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onReset={resetView}
            />

            <AnimatePresence>
              {hovered && !selected && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    bottom: 18,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 10,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#fff',
                    pointerEvents: 'none',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  Click to explore · Scroll to zoom · Drag to pan
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right panel / Mobile bottom sheet */}
        {isMobile ? (
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  maxHeight: '65vh',
                  background: '#050302',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '24px 24px 0 0',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
                }}
              >
                {panelContent}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div style={{
            width: 340,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            overflowY: 'auto',
            flexShrink: 0,
          }}>
            {panelContent}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function TopStat({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
    </div>
  )
}