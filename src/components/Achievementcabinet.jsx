// AchievementCabinet.jsx — GitStatus
// Steam/Xbox-style achievement grid. All unlock conditions are derived from
// the already-fetched `data` object — no duplicate API calls.
//
// Note on "Documentation Hero": GitHub's list-repos endpoint doesn't return a
// README flag, so this uses repo `description` presence as a proxy signal
// across the user's full non-fork repo list (data.allRepos). For a precise
// version, fetch GET /repos/{owner}/{repo}/readme per repo (rate-limit heavy).

import React from 'react'
import styles from '../styles/Achievementcabinet.module.css'

const RARITY_ORDER = { Legendary: 0, Epic: 1, Rare: 2, Common: 3 }

function computeAchievements(data) {
    const {
        user, totalStars = 0, nonForkCount = 0, languages = [],
        repoTypes = [], allRepos = [], eventStats,
    } = data

    const totalCommits = eventStats?.totalCommits || 0
    const reviews = eventStats?.reviewCount || 0
    const comments = eventStats?.commentCount || 0
    const issues = eventStats?.issueCount || 0
    const forks = eventStats?.forkCount || 0

    const docPool = allRepos?.length ? allRepos : []
    const docRatio = docPool.length
        ? docPool.filter(r => (r.description || '').trim().length > 10).length / docPool.length
        : 0

    const isNightOwl = eventStats?.mostActiveHour === 'Late Night' || eventStats?.mostActiveHour === 'Night'
    const hasAI = (repoTypes || []).some(t => t.type === 'AI/ML')

    return [
        {
            icon: '🥇', title: '100 Commits',
            description: 'Pushed at least 100 tracked commits.',
            unlocked: totalCommits >= 100, rarity: 'Common',
            progress: `${Math.min(totalCommits, 100)}/100`,
        },
        {
            icon: '⭐', title: 'First Star',
            description: 'Earned your first star on a repository.',
            unlocked: totalStars >= 1, rarity: 'Common',
            progress: totalStars >= 1 ? 'Unlocked' : '0/1',
        },
        {
            icon: '🚀', title: 'AI Builder',
            description: 'Shipped a project in the AI/ML category.',
            unlocked: hasAI, rarity: 'Epic',
            progress: hasAI ? 'Unlocked' : 'No AI/ML repos yet',
        },
        {
            icon: '📚', title: 'Documentation Hero',
            description: 'Most of your repositories ship with a clear description.',
            unlocked: docRatio >= 0.7, rarity: 'Rare',
            progress: `${Math.round(docRatio * 100)}% documented`,
        },
        {
            icon: '🤝', title: 'Community Helper',
            description: 'Active across reviews, issues, and comments.',
            unlocked: (reviews + comments + issues) >= 20, rarity: 'Rare',
            progress: `${Math.min(reviews + comments + issues, 20)}/20`,
        },
        {
            icon: '⚡', title: 'Night Owl',
            description: 'Most active during late-night hours.',
            unlocked: isNightOwl, rarity: 'Rare',
            progress: eventStats?.mostActiveHour || 'Not enough data',
        },
        {
            icon: '🌍', title: 'Open Source Explorer',
            description: 'Comfortable working across 5+ languages.',
            unlocked: languages.length >= 5, rarity: 'Epic',
            progress: `${Math.min(languages.length, 5)}/5 languages`,
        },
        {
            icon: '🎯', title: 'Polyglot Developer',
            description: 'Fluent across 8+ languages.',
            unlocked: languages.length >= 8, rarity: 'Legendary',
            progress: `${Math.min(languages.length, 8)}/8 languages`,
        },
    ].sort((a, b) => {
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
        return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
    })
}

function AchievementCard({ a }) {
    return (
        <div className={`${styles.card} ${styles['rarity_' + a.rarity]} ${a.unlocked ? styles.unlocked : styles.locked}`}>
            <div className={styles.rarityTag}>{a.rarity}</div>
            <div className={styles.icon}>{a.unlocked ? a.icon : '🔒'}</div>
            <div className={styles.title}>{a.title}</div>
            <div className={styles.description}>{a.description}</div>
            <div className={styles.footer}>
                <span className={styles.status}>{a.unlocked ? 'Unlocked' : 'Locked'}</span>
                {!a.unlocked && <span className={styles.progress}>{a.progress}</span>}
            </div>
        </div>
    )
}

export function AchievementCabinet({ data }) {
    const achievements = computeAchievements(data)
    const unlockedCount = achievements.filter(a => a.unlocked).length

    return (
        <div className={styles.card_container}>
            <div className={styles.header}>
                <h3 className={styles.heading}>🏆 Achievement Cabinet</h3>
                <span className={styles.count}>{unlockedCount}/{achievements.length} unlocked</span>
            </div>
            <div className={styles.grid}>
                {achievements.map(a => <AchievementCard key={a.title} a={a} />)}
            </div>
        </div>
    )
}