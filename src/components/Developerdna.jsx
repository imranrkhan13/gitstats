// DeveloperDNA.jsx
import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from '../styles/developerdna.module.css'

const clamp = n => Math.max(0, Math.min(100, Math.round(n)))
const log = n => Math.log2(Math.max(0, n) + 1)

// ─── SVG ICONS ───────────────────────────────────────────────────────────
const Icons = {
    Builder: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    ),
    Mentor: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="m22 21-3-3" />
            <path d="m19 18 3 3" />
        </svg>
    ),
    Explorer: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
    ),
    Consistency: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    Quality: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    ),
    Dna: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 15c6.667-6 13.333 0 20-6" />
            <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
            <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
            <path d="m17 6-2.5-2.5" />
            <path d="m14 8-1-1" />
            <path d="m7 18 2.5 2.5" />
            <path d="m3.5 14.5.5.5" />
            <path d="m20 9 .5.5" />
            <path d="m6.5 12.5 1 1" />
            <path d="m16.5 10.5 1 1" />
            <path d="m10 16 1.5 1.5" />
        </svg>
    ),
    Info: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    ),
    X: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    ),
}

// ─── TRAIT COMPUTATION ───────────────────────────────────────────────────
function computeTraits(data) {
    const {
        user, totalStars = 0, totalForks = 0, nonForkCount = 0,
        languages = [], repoTypes = [], topByStars = [], allRepos = [],
        longestStreak = 0, activeDays = [], eventStats,
    } = data

    const totalCommits = eventStats?.totalCommits || 0
    const reviews = eventStats?.reviewCount || 0
    const comments = eventStats?.commentCount || 0
    const followers = user?.followers || 0

    const builder = clamp(log(nonForkCount) * 13 + log(totalCommits) * 9)
    const mentor = clamp(log(followers) * 15 + reviews * 6 + comments * 2)
    const explorer = clamp(languages.length * 9 + (repoTypes?.length || 0) * 6.5)
    const activeDayCount = activeDays?.length || 0
    const consistency = clamp(longestStreak * 4.2 + activeDayCount * 1.3)
    const healthPool = allRepos?.length ? allRepos : topByStars
    const avgHealth = topByStars.length
        ? Math.round(topByStars.reduce((s, r) => s + (r.health || 0), 0) / topByStars.length)
        : 0
    const quality = clamp(log(totalStars) * 11 + log(totalForks) * 8 + avgHealth * 0.42)

    return [
        { key: 'builder', icon: Icons.Builder, label: 'Builder', value: builder, color: '#f59e0b' },
        { key: 'mentor', icon: Icons.Mentor, label: 'Mentor', value: mentor, color: '#8b5cf6' },
        { key: 'explorer', icon: Icons.Explorer, label: 'Explorer', value: explorer, color: '#0ea5e9' },
        { key: 'consistency', icon: Icons.Consistency, label: 'Consistency', value: consistency, color: '#ef4444' },
        { key: 'quality', icon: Icons.Quality, label: 'Quality', value: quality, color: '#22c55e' },
    ]
}

function getPersonality(traits) {
    const sorted = [...traits].sort((a, b) => b.value - a.value)
    const top = sorted[0]
    const second = sorted[1]

    const TYPES = {
        builder: { title: 'The Architect', desc: 'You build. You ship. You turn ideas into reality with relentless momentum.' },
        mentor: { title: 'The Guide', desc: 'You elevate others. Your reviews, comments, and presence lift the whole community.' },
        explorer: { title: 'The Pioneer', desc: 'You dive deep into new stacks and emerge with working prototypes others only dream of.' },
        consistency: { title: 'The Marathoner', desc: 'Day after day, you show up. Your commit graph is a testament to discipline.' },
        quality: { title: 'The Craftsman', desc: 'Every repo is polished. Every README matters. You ship things that last.' },
    }

    return {
        ...TYPES[top.key],
        subtitle: second ? `${top.label}-first with strong ${second.label}` : `${top.label}-driven developer`,
    }
}

// ─── HOW IT WORKS MODAL ──────────────────────────────────────────────────
function HowItWorksModal({ data, traits, onClose }) {
    const {
        user, totalStars = 0, totalForks = 0, nonForkCount = 0,
        languages = [], repoTypes = [], topByStars = [], allRepos = [],
        longestStreak = 0, activeDays = [], eventStats,
    } = data

    const totalCommits = eventStats?.totalCommits || 0
    const reviews = eventStats?.reviewCount || 0
    const comments = eventStats?.commentCount || 0
    const followers = user?.followers || 0
    const activeDayCount = activeDays?.length || 0

    const avgHealth = topByStars.length
        ? Math.round(topByStars.reduce((s, r) => s + (r.health || 0), 0) / topByStars.length)
        : 0

    // Compute intermediate values for display
    const builderRaw = log(nonForkCount) * 13 + log(totalCommits) * 9
    const mentorRaw = log(followers) * 15 + reviews * 6 + comments * 2
    const explorerRaw = languages.length * 9 + (repoTypes?.length || 0) * 6.5
    const consistencyRaw = longestStreak * 4.2 + activeDayCount * 1.3
    const qualityRaw = log(totalStars) * 11 + log(totalForks) * 8 + avgHealth * 0.42

    const traitDetails = [
        {
            key: 'builder',
            dotColor: '#f59e0b',
            name: 'Builder',
            range: '0–100 pts',
            formula: 'log₂(repos + 1) × 13 + log₂(commits + 1) × 9',
            rawValue: builderRaw,
            clampedValue: traits.find(t => t.key === 'builder')?.value || 0,
            inputs: [
                { label: 'Original repos', value: nonForkCount },
                { label: 'Total commits (90d)', value: totalCommits },
            ],
            desc: 'Measures shipping velocity. More repos and commits = higher score.',
        },
        {
            key: 'mentor',
            dotColor: '#8b5cf6',
            name: 'Mentor',
            range: '0–100 pts',
            formula: 'log₂(followers + 1) × 15 + reviews × 6 + comments × 2',
            rawValue: mentorRaw,
            clampedValue: traits.find(t => t.key === 'mentor')?.value || 0,
            inputs: [
                { label: 'Followers', value: followers },
                { label: 'PR reviews (90d)', value: reviews },
                { label: 'Comments (90d)', value: comments },
            ],
            desc: 'Measures community impact. Followers, PR reviews, and discussions.',
        },
        {
            key: 'explorer',
            dotColor: '#0ea5e9',
            name: 'Explorer',
            range: '0–100 pts',
            formula: 'languages × 9 + repoTypes × 6.5',
            rawValue: explorerRaw,
            clampedValue: traits.find(t => t.key === 'explorer')?.value || 0,
            inputs: [
                { label: 'Languages used', value: languages.length },
                { label: 'Repo categories', value: repoTypes?.length || 0 },
            ],
            desc: 'Measures tech diversity. More languages and repo types = broader range.',
        },
        {
            key: 'consistency',
            dotColor: '#ef4444',
            name: 'Consistency',
            range: '0–100 pts',
            formula: 'longestStreak × 4.2 + activeDays × 1.3',
            rawValue: consistencyRaw,
            clampedValue: traits.find(t => t.key === 'consistency')?.value || 0,
            inputs: [
                { label: 'Longest streak (days)', value: longestStreak },
                { label: 'Active days (90d)', value: activeDayCount },
            ],
            desc: 'Measures discipline. Streak length and number of active days.',
        },
        {
            key: 'quality',
            dotColor: '#22c55e',
            name: 'Quality',
            range: '0–100 pts',
            formula: 'log₂(stars + 1) × 11 + log₂(forks + 1) × 8 + avgHealth × 0.42',
            rawValue: qualityRaw,
            clampedValue: traits.find(t => t.key === 'quality')?.value || 0,
            inputs: [
                { label: 'Total stars', value: totalStars },
                { label: 'Total forks', value: totalForks },
                { label: 'Avg repo health', value: avgHealth },
            ],
            desc: 'Measures repo health. Stars, forks, and average repository health score.',
        },
    ]

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    // Close on Escape
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onClose])

    return (
        <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <div>
                        <h2 className={styles.modalTitle}>How Developer DNA works</h2>
                        <p className={styles.modalSubtitle}>
                            Everything is transparent — here's exactly what we calculate and how.
                        </p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        {Icons.X}
                    </button>
                </div>

                <div className={styles.section}>
                    <div className={styles.scoreHeader}>
                        <span className={styles.scoreHeaderTitle}>DNA Score (0–100 per trait)</span>
                    </div>
                    <p className={styles.scoreIntro}>
                        A <strong>deterministic formula</strong> — same GitHub profile always gets the same score.
                        No randomness. Five dimensions, each log-scaled where noted to avoid outliers dominating.
                        All values are clamped 0–100.
                    </p>

                    <div className={styles.formulaList}>
                        {traitDetails.map(item => (
                            <div key={item.key} className={styles.formulaItem}>
                                <div className={styles.formulaHead}>
                                    <span
                                        className={styles.formulaDot}
                                        style={{ backgroundColor: item.dotColor }}
                                    />
                                    <span className={styles.formulaName}>{item.name}</span>
                                    <span className={styles.formulaRange}>{item.range}</span>
                                </div>
                                <div className={styles.formulaMathRow}>
                                    <code className={styles.formulaCode}>{item.formula}</code>
                                    <span className={styles.formulaResult}>
                                        = <strong>{Math.round(item.rawValue * 10) / 10}</strong>
                                        {item.rawValue !== item.clampedValue && ` → clamped to ${item.clampedValue}`}
                                    </span>
                                </div>
                                <div className={styles.formulaInputs}>
                                    {item.inputs.map(inp => (
                                        <span key={inp.label} className={styles.inputChip}>
                                            {inp.label}: <strong>{inp.value.toLocaleString()}</strong>
                                        </span>
                                    ))}
                                </div>
                                <div className={styles.formulaDesc}>{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Data Sources</h3>
                    <div className={styles.faqList}>
                        <div className={styles.faqItem}>
                            <div className={styles.faqQuestion}>
                                <span className={styles.formulaDot} style={{ backgroundColor: '#f97316' }} />
                                Where does the data come from?
                            </div>
                            <div className={styles.faqAnswer}>
                                GitHub's public REST API. Repositories and profile from <code>/users/:login</code> and <code>/users/:login/repos</code>.
                                Activity (commits, reviews, comments, streaks) from <code>/users/:login/events/public</code> — we fetch up to 100 recent events, covering roughly the last 90 days.
                            </div>
                        </div>
                        <div className={styles.faqItem}>
                            <div className={styles.faqQuestion}>
                                <span className={styles.formulaDot} style={{ backgroundColor: '#f97316' }} />
                                What counts as a streak day?
                            </div>
                            <div className={styles.faqAnswer}>
                                Any day with a Push, Pull Request, Issue, Create, or Code Review event in your public GitHub activity.
                            </div>
                        </div>
                        <div className={styles.faqItem}>
                            <div className={styles.faqQuestion}>
                                <span className={styles.formulaDot} style={{ backgroundColor: '#f97316' }} />
                                How is repo health calculated?
                            </div>
                            <div className={styles.faqAnswer}>
                                Each repository gets an engineering health score (0–100) based on README quality, test files, CI config, license, dependency lockfiles, recency of pushes, and tagged releases. Only your top 8 repos by stars are averaged for the Quality trait.
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ─── RADAR CHART ─────────────────────────────────────────────────────────
function RadarChart({ traits, size = 180 }) {
    const center = size / 2
    const radius = size * 0.38
    const angleStep = (Math.PI * 2) / traits.length
    const levels = [0.2, 0.4, 0.6, 0.8, 1]

    const points = traits.map((t, i) => {
        const angle = i * angleStep - Math.PI / 2
        const r = (t.value / 100) * radius
        return [center + Math.cos(angle) * r, center + Math.sin(angle) * r]
    })

    const polygonPoints = points.map(p => p.join(',')).join(' ')

    return (
        <svg className={styles.radarSvg} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {levels.map(level => {
                const r = radius * level
                const gridPoints = traits.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2
                    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r].join(',')
                }).join(' ')
                return <polygon key={level} points={gridPoints} className={styles.radarGrid} opacity={0.3} />
            })}

            {traits.map((_, i) => {
                const angle = i * angleStep - Math.PI / 2
                const x = center + Math.cos(angle) * radius
                const y = center + Math.sin(angle) * radius
                return <line key={i} x1={center} y1={center} x2={x} y2={y} className={styles.radarAxis} opacity={0.2} />
            })}

            <polygon points={polygonPoints} className={styles.radarShape} />

            {points.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={3} className={styles.radarPoint} />
            ))}

            {traits.map((t, i) => {
                const angle = i * angleStep - Math.PI / 2
                const labelR = radius + 16
                const x = center + Math.cos(angle) * labelR
                const y = center + Math.sin(angle) * labelR
                return (
                    <text key={i} x={x} y={y} className={styles.radarLabel}>
                        {t.label.slice(0, 3)}
                    </text>
                )
            })}
        </svg>
    )
}

// ─── TRAIT BAR ───────────────────────────────────────────────────────────
function TraitBar({ trait, delay }) {
    const [width, setWidth] = useState(0)
    useEffect(() => {
        const t = setTimeout(() => setWidth(trait.value), 200 + delay)
        return () => clearTimeout(t)
    }, [trait.value, delay])

    return (
        <div className={styles.traitRow}>
            <div className={styles.traitHead}>
                <span className={styles.traitIcon} style={{ color: trait.color }}>
                    {trait.icon}
                </span>
                <span className={styles.traitLabel}>{trait.label}</span>
                <span className={styles.traitValue} style={{ color: trait.color }}>
                    {trait.value}%
                </span>
            </div>
            <div className={styles.track}>
                <div className={`${styles.fill} ${styles['fill_' + trait.key]}`} style={{ width: `${width}%` }} />
            </div>
        </div>
    )
}

const DERIVED_FROM = ['commits', 'pull requests', 'repository quality', 'documentation', 'issue activity', 'reviews']

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────
export function DeveloperDNA({ data }) {
    const [showModal, setShowModal] = useState(false)
    const traits = computeTraits(data)
    const personality = getPersonality(traits)
    const totalScore = Math.round(traits.reduce((s, t) => s + t.value, 0) / traits.length)

    const ref = useRef(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
            { threshold: 0.15 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    return (
        <>
            <div ref={ref} className={`${styles.card} ${inView ? styles.inView : ''}`}>
                <div className={styles.header}>
                    <div className={styles.titleWrap}>
                        <h3 className={styles.title}>
                            <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 8, color: 'var(--br2)' }}>
                                {Icons.Dna}
                            </span>
                            Developer DNA
                        </h3>
                        <button
                            className={styles.infoBtn}
                            onClick={() => setShowModal(true)}
                            title="How is this calculated?"
                        >
                            {Icons.Info}
                        </button>
                    </div>
                    <span className={styles.dnaBadge}>{totalScore} Overall</span>
                </div>

                <div className={styles.main}>
                    <div className={styles.radarWrap}>
                        <RadarChart traits={traits} />
                        <div className={styles.totalScore}>
                            <div className={styles.scoreNumber}>{totalScore}</div>
                            <div className={styles.scoreLabel}>DNA Score</div>
                        </div>
                    </div>

                    <div className={styles.traits}>
                        {traits.map((t, i) => (
                            <TraitBar key={t.key} trait={t} delay={i * 90} />
                        ))}
                    </div>
                </div>

                <div className={styles.personality}>
                    <div className={styles.personalityType}>{personality.subtitle}</div>
                    <div className={styles.personalityTitle}>{personality.title}</div>
                    <div className={styles.personalityDesc}>{personality.desc}</div>
                </div>

                <div className={styles.derivedFrom}>
                    <div className={styles.derivedLabel}>Derived From</div>
                    <div className={styles.derivedChips}>
                        {DERIVED_FROM.map(d => (
                            <span key={d} className={styles.chip}>
                                <span className={styles.checkmark}>✓</span>{d}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <HowItWorksModal
                        data={data}
                        traits={traits}
                        onClose={() => setShowModal(false)}
                    />
            )}
            </AnimatePresence>
        </>
    )
}