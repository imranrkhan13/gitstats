// CareerTimeline.jsx — Redesigned with SVG Icons + Animated Lines
import React, { useEffect, useRef, useState } from 'react'
import styles from '../styles/Careertimeline.module.css'

const Icons = {
    Joined: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="m22 21-3-3" />
            <path d="m19 18 3 3" />
        </svg>
    ),
    Repo: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
    ),
    Milestone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    ),
    Commits: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </svg>
    ),
    Flagship: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
    ),
    Streak: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    Today: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
        </svg>
    ),
}

function buildEvents(data) {
    const {
        user, allRepos = [], topByStars = [], monthlyCommits = [],
        reposByYear = [], score = 0, lastActive, streak = 0,
    } = data

    const events = []

    if (user?.created_at) {
        events.push({
            date: user.created_at,
            icon: 'Joined',
            title: 'Joined GitHub',
            detail: `Account created${user.created_at ? ` in ${user.created_at.slice(0, 4)}` : ''}.`,
            milestone: 'Account Created',
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
            icon: 'Repo',
            title: 'First Repository',
            detail: first.name ? `Started with "${first.name}".` : 'Pushed the first repo live.',
            milestone: 'First Commit',
        })
    }

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
                    icon: 'Milestone',
                    title: `${m} Repositories`,
                    detail: `Crossed the ${m}-repo mark in ${year}.`,
                    milestone: `${m} Repos Milestone`,
                })
            }
        }
    }

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
                    icon: 'Commits',
                    title: `${target} Commits`,
                    detail: `Crossed ${target} tracked commits in ${m.month}.`,
                    milestone: `${target} Commits Milestone`,
                })
            }
        }
    }

    const flagship = topByStars?.[0]
    if (flagship?.created) {
        events.push({
            date: flagship.created,
            icon: 'Flagship',
            title: `Flagship: ${flagship.name}`,
            detail: `Now the flagship repo with ${flagship.stars} stars.`,
            milestone: 'Flagship Project',
        })
    }

    if (lastActive) {
        events.push({
            date: lastActive,
            icon: 'Streak',
            title: streak > 0 ? `${streak}-Day Streak` : 'Last Activity',
            detail: streak > 0 ? 'Still actively shipping.' : 'Most recent tracked activity.',
            milestone: streak > 0 ? 'Active Streak' : 'Recent Activity',
        })
    }

    events.push({
        date: new Date().toISOString().slice(0, 10),
        icon: 'Today',
        title: 'Present Day',
        detail: `GitStatus Dev Score: ${score}/100.`,
        milestone: 'Current',
    })

    return events
        .filter(e => e.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
}

function formatMonth(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', { month: 'short' })
}

function TimelineItem({ event, index, isLast }) {
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
    const month = formatMonth(event.date)
    const Icon = Icons[event.icon] || Icons.Today

    return (
        <div
            ref={ref}
            className={`${styles.item} ${inView ? styles.itemVisible : ''}`}
            style={{ transitionDelay: `${Math.min(index, 8) * 70}ms` }}
        >
            <div className={styles.rail}>
                <div className={styles.dot}>
                    <span className={styles.iconWrap}>{Icon}</span>
                </div>
                {!isLast && (
                    <div className={styles.lineWrap}>
                        <div className={`${styles.line} ${inView ? styles.lineDrawn : ''}`} />
                    </div>
                )}
            </div>
            <div className={styles.content}>
                <div className={styles.metaRow}>
                    <div className={styles.dateGroup}>
                        <span className={styles.month}>{month}</span>
                        <span className={styles.year}>{year}</span>
                    </div>
                    <div className={styles.badges}>
                        {index === 0 && <span className={styles.badge}>Start</span>}
                        {isLast && <span className={styles.badge}>Now</span>}
                        <span className={`${styles.milestone} ${styles[`milestone_${event.icon}`]}`}>
                            {event.milestone}
                        </span>
                    </div>
                </div>
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
                <h3 className={styles.heading}>
                    <span className={styles.headingIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </span>
                    Career Timeline
                </h3>
            </div>
            <div className={styles.timeline}>
                {events.map((e, i) => (
                    <TimelineItem
                        key={e.title + e.date}
                        event={e}
                        index={i}
                        isLast={i === events.length - 1}
                    />
                ))}
            </div>
        </div>
    )
}