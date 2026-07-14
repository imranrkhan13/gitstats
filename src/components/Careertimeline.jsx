// CareerTimeline.jsx — GitStatus
// Auto-generates a vertical career timeline using only dates already present
// in `data` (account creation, repo creation dates, monthly commit series,
// repos-per-year series). No duplicate API calls.
//
// Events NOT included because the fetched data has no real date for them
// (adding them would mean guessing): "first star", "first release",
// "first OSS contribution to someone else's repo". To add these for real:
//   - First release date  → GET /repos/{owner}/{repo}/releases (per repo)
//   - First external OSS PR → keep the FULL events list (not just the last
//     ~90 days / 25-item activity slice) and find the earliest PullRequestEvent
//     whose repo owner !== the user's login.

import React, { useEffect, useRef, useState } from 'react'
import styles from '../styles/Careertimeline.module.css'

function buildEvents(data) {
    const {
        user, allRepos = [], topByStars = [], monthlyCommits = [],
        reposByYear = [], score = 0, lastActive, streak = 0,
    } = data

    const events = []

    if (user?.created_at) {
        events.push({
            date: user.created_at,
            icon: '👋',
            title: 'Joined GitHub',
            detail: `Account created${user.created_at ? ` in ${user.created_at.slice(0, 4)}` : ''}.`,
        })
    }

    const repoPool = allRepos?.length ? allRepos : topByStars
    const withDates = repoPool.filter(r => r.created_at || r.created)
    if (withDates.length) {
        const first = [...withDates].sort((a, b) =>
            new Date(a.created_at || a.created) - new Date(b.created_at || b.created))[0]
        const d = first.created_at || first.created
        events.push({
            date: d,
            icon: '📦',
            title: 'Created first repository',
            detail: first.name ? `Started with "${first.name}".` : 'Pushed the first repo live.',
        })
    }

    // Repo-count milestones from real per-year repo creation counts.
    const milestoneCounts = [10, 25, 50]
    let cumulative = 0
    const sortedByYear = [...reposByYear].sort((a, b) => a.year.localeCompare(b.year))
    for (const { year, count } of sortedByYear) {
        const before = cumulative
        cumulative += count
        for (const m of milestoneCounts) {
            if (before < m && cumulative >= m) {
                events.push({
                    date: `${year}-12-31`,
                    icon: '🗂️',
                    title: `Reached ${m} repositories`,
                    detail: `Crossed the ${m}-repo mark in ${year}.`,
                })
            }
        }
    }

    // Commit milestones from real monthly commit series (cumulative).
    const commitMilestones = [100, 1000]
    let commitCum = 0
    const sortedCommits = [...monthlyCommits].sort((a, b) => a.key.localeCompare(b.key))
    for (const m of sortedCommits) {
        const before = commitCum
        commitCum += m.commits
        for (const target of commitMilestones) {
            if (before < target && commitCum >= target) {
                events.push({
                    date: `${m.key}-01`,
                    icon: '🔥',
                    title: `Reached ${target} commits`,
                    detail: `Crossed ${target} tracked commits in ${m.month}.`,
                })
            }
        }
    }

    const flagship = topByStars?.[0]
    if (flagship?.created) {
        events.push({
            date: flagship.created,
            icon: '🌟',
            title: `Launched ${flagship.name}`,
            detail: `Now the flagship repo with ${flagship.stars} stars.`,
        })
    }

    if (lastActive) {
        events.push({
            date: lastActive,
            icon: streak > 0 ? '⚡' : '🕓',
            title: streak > 0 ? `On a ${streak}-day streak` : 'Last recorded activity',
            detail: streak > 0 ? 'Still actively shipping.' : 'Most recent tracked activity.',
        })
    }

    events.push({
        date: new Date().toISOString().slice(0, 10),
        icon: '🎯',
        title: 'Today',
        detail: `GitStatus Dev Score: ${score}/100.`,
    })

    return events
        .filter(e => e.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
}

function TimelineItem({ event, index }) {
    const ref = useRef(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
            { threshold: 0.2 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    const year = event.date?.slice(0, 4)

    return (
        <div
            ref={ref}
            className={`${styles.item} ${inView ? styles.itemVisible : ''}`}
            style={{ transitionDelay: `${Math.min(index, 8) * 70}ms` }}
        >
            <div className={styles.rail}>
                <div className={styles.dot}><span>{event.icon}</span></div>
                <div className={styles.line} />
            </div>
            <div className={styles.content}>
                <div className={styles.year}>{year}</div>
                <div className={styles.eventTitle}>{event.title}</div>
                <div className={styles.eventDetail}>{event.detail}</div>
            </div>
        </div>
    )
}

export function CareerTimeline({ data }) {
    const events = buildEvents(data)
    if (!events.length) return null

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.heading}>🛤️ Career Timeline</h3>
            </div>
            <div className={styles.timeline}>
                {events.map((e, i) => (
                    <TimelineItem key={e.title + e.date} event={e} index={i} />
                ))}
            </div>
        </div>
    )
}