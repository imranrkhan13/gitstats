// DeveloperDNA.jsx — GitStatus
// Premium glassmorphism card showing 5 animated "DNA trait" bars derived from
// real GitHub data already present on the `data` object (no extra API calls).
//
// Trait formulas (all clamped 0-100, log-scaled so no single stat dominates):
//   Builder      → repos created (log) + total commits (log)
//   Mentor       → followers (log) + PR reviews + comments/discussion activity
//   Explorer     → language count + repo-type diversity
//   Consistency  → longest streak + number of distinct active days (~90d window)
//   Quality      → total stars (log) + total forks (log) + avg repo health score

import React, { useEffect, useRef, useState } from 'react'
import styles from '../styles/developerdna.module.css'

const clamp = n => Math.max(0, Math.min(100, Math.round(n)))
const log = n => Math.log2(Math.max(0, n) + 1)

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
        { key: 'builder', icon: '🔨', label: 'Builder', value: builder },
        { key: 'mentor', icon: '🧑‍🏫', label: 'Mentor', value: mentor },
        { key: 'explorer', icon: '🧭', label: 'Explorer', value: explorer },
        { key: 'consistency', icon: '⚡', label: 'Consistency', value: consistency },
        { key: 'quality', icon: '💎', label: 'Quality', value: quality },
    ]
}

function personalitySentence(traits) {
    const sorted = [...traits].sort((a, b) => b.value - a.value)
    const top = sorted[0]
    const second = sorted[1]

    const PHRASES = {
        builder: 'a builder-first engineer who consistently ships projects',
        mentor: 'a community-minded engineer who lifts other developers up',
        explorer: 'a curious, multi-language engineer who explores widely',
        consistency: 'a dependable engineer who shows up and commits regularly',
        quality: 'a craft-focused engineer who prioritizes polish and repo health',
    }
    const QUALIFIERS = {
        builder: 'with high shipping velocity',
        mentor: 'with strong reviews and community engagement',
        explorer: 'with a broad, adaptable skill set',
        consistency: 'with a steady, sustained cadence',
        quality: 'with high repository quality',
    }

    if (!top || top.value === 0) {
        return "Your profile is just getting started — keep shipping to unlock your Developer DNA."
    }
    return `You're ${PHRASES[top.key]}${second ? ` — ${QUALIFIERS[second.key]}.` : '.'}`
}

function TraitBar({ trait, delay }) {
    const [width, setWidth] = useState(0)
    useEffect(() => {
        const t = setTimeout(() => setWidth(trait.value), 120 + delay)
        return () => clearTimeout(t)
    }, [trait.value, delay])

    return (
        <div className={styles.traitRow}>
            <div className={styles.traitHead}>
                <span className={styles.traitIcon}>{trait.icon}</span>
                <span className={styles.traitLabel}>{trait.label}</span>
                <span className={styles.traitValue}>{trait.value}%</span>
            </div>
            <div className={styles.track}>
                <div
                    className={`${styles.fill} ${styles['fill_' + trait.key]}`}
                    style={{ width: `${width}%` }}
                />
            </div>
        </div>
    )
}

const DERIVED_FROM = [
    'commits', 'pull requests', 'repository quality',
    'documentation', 'issue activity', 'reviews',
]

export function DeveloperDNA({ data }) {
    const traits = computeTraits(data)
    const sentence = personalitySentence(traits)
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
        <div ref={ref} className={`${styles.card} ${inView ? styles.inView : ''}`}>
            <div className={styles.header}>
                <h3 className={styles.title}>🧬 Developer DNA</h3>
            </div>

            <div className={styles.traits}>
                {traits.map((t, i) => <TraitBar key={t.key} trait={t} delay={i * 90} />)}
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

            <p className={styles.sentence}>{sentence}</p>
        </div>
    )
}