const GITHUB_API_BASE = 'https://api.github.com'
const TIMEOUT_MS = 15000

function authHeaders() {
    const token = import.meta.env.VITE_GITHUB_TOKEN

    return {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
}

async function fetchWithTimeout(url, opts = {}) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
        const res = await fetch(url, {
            ...opts,
            headers: {
                ...authHeaders(),
                ...(opts.headers || {})
            },
            signal: controller.signal
        })

        clearTimeout(id)
        return res
    } catch (err) {
        clearTimeout(id)
        throw err
    }
}

async function fetchGitHubPages(url, maxPages = 5) {
    const items = []
    for (let page = 1; page <= maxPages; page += 1) {
        const separator = url.includes('?') ? '&' : '?'
        const res = await fetchWithTimeout(`${url}${separator}per_page=100&page=${page}`)
        if (!res.ok) break
        const data = await res.json()
        if (!Array.isArray(data) || data.length === 0) break
        items.push(...data)
        if (data.length < 100) break
    }
    return items
}

export function parseGitHubInput(input) {
    const trimmed = input.trim()
    // Full URL like https://github.com/username or https://github.com/username/repo
    const urlMatch = trimmed.match(/github\.com\/([^\/\s]+)(?:\/([^\/\s]+))?/)
    if (urlMatch) {
        return { username: urlMatch[1], repo: urlMatch[2] || null }
    }
    // Just username or username/repo
    const simpleMatch = trimmed.match(/^([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_.-]+))?$/)
    if (simpleMatch) {
        return { username: simpleMatch[1], repo: simpleMatch[2] || null }
    }
    return null
}

export async function fetchGitHubProfile(input) {
    const parsed = parseGitHubInput(input)
    if (!parsed) throw new Error('Invalid GitHub input. Use username or github.com/username/repo')

    const { username, repo } = parsed

    // Fetch user profile
    const userRes = await fetchWithTimeout(`${GITHUB_API_BASE}/users/${username}`)
    if (!userRes.ok) {
        if (userRes.status === 404) throw new Error(`GitHub user "${username}" not found`)
        if (userRes.status === 403) {
            console.log(await userRes.text())
            throw new Error('GitHub returned 403. Check your token permissions or rate limit.')
        }
    }
    const user = await userRes.json()
    // Fetch all public repos, then sort by recency for instant switching.
    const repos = (await fetchGitHubPages(
        `${GITHUB_API_BASE}/users/${username}/repos?sort=updated`,
        5
    )).sort((a, b) => new Date(b.updated_at || b.pushed_at || 0) - new Date(a.updated_at || a.pushed_at || 0))

    // Fetch languages for top 6 repos
    const topRepos = repos.slice(0, 6)
    const reposWithLangs = await Promise.all(
        topRepos.map(async (r) => {
            try {
                const langRes = await fetchWithTimeout(r.languages_url)
                const langs = langRes.ok ? await langRes.json() : {}
                return { ...r, languages: langs }
            } catch {
                return { ...r, languages: {} }
            }
        })
    )

    // Aggregate language stats
    const langTotals = {}
    reposWithLangs.forEach((r) => {
        Object.entries(r.languages || {}).forEach(([lang, bytes]) => {
            langTotals[lang] = (langTotals[lang] || 0) + bytes
        })
    })
    const totalBytes = Object.values(langTotals).reduce((s, v) => s + v, 0) || 1
    const languageStats = Object.entries(langTotals)
        .map(([name, bytes]) => ({
            name,
            bytes,
            percentage: Math.round((bytes / totalBytes) * 100),
        }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 8)

    // Fetch recent events (commits/pushes) — last 30 events
    const eventsRes = await fetchWithTimeout(
        `${GITHUB_API_BASE}/users/${username}/events/public?per_page=30`
    )
    const events = eventsRes.ok ? await eventsRes.json() : []

    const recentCommits = events
        .filter((e) => e.type === 'PushEvent')
        .slice(0, 10)
        .map((e) => ({
            repo: e.repo?.name || 'unknown',
            message: e.payload?.commits?.[0]?.message || '',
            date: e.created_at,
        }))

    // Open-source contributions: PRs/issues opened on repos NOT owned by this
    // user — i.e. contributions to other people's projects, kept separate
    // from their own push activity above.
    const ownedPrefix = `${username}/`
    const contributions = events
        .filter((e) => (e.type === 'PullRequestEvent' || e.type === 'IssuesEvent') && !(e.repo?.name || '').startsWith(ownedPrefix))
        .slice(0, 10)
        .map((e) => {
            const isPR = e.type === 'PullRequestEvent'
            const payload = isPR ? e.payload?.pull_request : e.payload?.issue
            return {
                kind: isPR ? 'pull_request' : 'issue',
                repo: e.repo?.name || 'unknown',
                title: payload?.title || '',
                state: payload?.merged ? 'merged' : (payload?.state || e.payload?.action || ''),
                url: payload?.html_url || '',
                date: e.created_at,
            }
        })

    // Fetch README for top repo if available
    let readmeContent = null
    if (topRepos[0]) {
        try {
            const readmeRes = await fetchWithTimeout(
                `${GITHUB_API_BASE}/repos/${username}/${topRepos[0].name}/readme`
            )
            if (readmeRes.ok) {
                const readme = await readmeRes.json()
                readmeContent = readme.content
                    ? atob(readme.content.replace(/\s/g, ''))
                    : null
            }
        } catch {
            // README is optional
        }
    }

    // If a specific repo was requested, fetch extra details
    let targetRepo = null
    if (repo) {
        try {
            const repoRes = await fetchWithTimeout(`${GITHUB_API_BASE}/repos/${username}/${repo}`)
            if (repoRes.ok) {
                targetRepo = await repoRes.json()
                // Fetch README for target repo
                try {
                    const trReadme = await fetchWithTimeout(
                        `${GITHUB_API_BASE}/repos/${username}/${repo}/readme`
                    )
                    if (trReadme.ok) {
                        const tr = await trReadme.json()
                        targetRepo.readme = tr.content ? atob(tr.content.replace(/\s/g, '')) : null
                    }
                } catch { }
            }
        } catch {
            // target repo fetch failure is non-critical
        }
    }

    const repoLocator = {
        owner: username,
        repo: repo || topRepos[0]?.name || null,
        defaultBranch: repo ? targetRepo?.default_branch : topRepos[0]?.default_branch,
        explicit: !!repo,
    }

    return {
        username: user.login,
        name: user.name || user.login,
        avatar: user.avatar_url,
        bio: user.bio || '',
        company: user.company || '',
        location: user.location || '',
        blog: user.blog || '',
        followers: user.followers || 0,
        following: user.following || 0,
        publicRepos: user.public_repos || 0,
        createdAt: user.created_at,
        languageStats,
        topRepositories: reposWithLangs.map((r) => ({
            name: r.name,
            description: r.description || '',
            stars: r.stargazers_count || 0,
            forks: r.forks_count || 0,
            language: r.language,
            languages: r.languages,
            updatedAt: r.updated_at,
            pushedAt: r.pushed_at,
            htmlUrl: r.html_url,
        })),
        repositories: repos.map((r) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            description: r.description || '',
            stars: r.stargazers_count || 0,
            forks: r.forks_count || 0,
            language: r.language,
            updatedAt: r.updated_at,
            pushedAt: r.pushed_at,
            htmlUrl: r.html_url,
            defaultBranch: r.default_branch,
            size: r.size || 0,
            private: !!r.private,
        })),
        recentCommits,
        contributions,
        readmePreview: readmeContent ? readmeContent.slice(0, 3000) : null,
        targetRepo: targetRepo
            ? {
                name: targetRepo.name,
                description: targetRepo.description || '',
                stars: targetRepo.stargazers_count || 0,
                forks: targetRepo.forks_count || 0,
                language: targetRepo.language,
                topics: targetRepo.topics || [],
                readme: targetRepo.readme || null,
            }
            : null,
        repoLocator,
        fetchedAt: new Date().toISOString(),
    }
}

export async function fetchFileHistory(owner, repo, path, branch, limit = 8) {
    const params = new URLSearchParams({ path, per_page: String(limit) })
    if (branch) params.set('sha', branch)
    const res = await fetchWithTimeout(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?${params.toString()}`)
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
    const commits = await res.json()
    return commits.map((c) => ({
        sha: c.sha?.slice(0, 7),
        message: (c.commit?.message || '').split('\n')[0],
        author: c.commit?.author?.name || c.author?.login || 'unknown',
        date: c.commit?.author?.date,
        url: c.html_url,
    }))
}

export function buildGitHubContext(githubData) {
    if (!githubData) return null

    const lines = []
    lines.push(`GITHUB PROFILE: ${githubData.name} (@${githubData.username})`)
    if (githubData.bio) lines.push(`Bio: ${githubData.bio}`)
    if (githubData.company) lines.push(`Company: ${githubData.company}`)
    if (githubData.location) lines.push(`Location: ${githubData.location}`)
    lines.push(`Public repos: ${githubData.publicRepos} · Followers: ${githubData.followers}`)
    lines.push(`Account created: ${githubData.createdAt?.slice(0, 10) || 'unknown'}`)

    if (githubData.languageStats?.length) {
        lines.push(`\nTop Languages: ${githubData.languageStats.map((l) => `${l.name} (${l.percentage}%)`).join(', ')}`)
    }

    if (githubData.topRepositories?.length) {
        lines.push(`\nTop Repositories:`)
        githubData.topRepositories.slice(0, 5).forEach((r) => {
            lines.push(`  • ${r.name}: ${r.description || 'No description'} · ⭐${r.stars} · ${r.language || 'N/A'}`)
        })
    }

    if (githubData.contributions?.length) {
        lines.push(`\nOpen Source Contributions (to repos not owned by the candidate):`)
        githubData.contributions.slice(0, 5).forEach((c) => {
            lines.push(`  • [${c.repo}] ${c.kind === 'pull_request' ? 'PR' : 'Issue'} (${c.state}): ${c.title}`)
        })
    }

    if (githubData.recentCommits?.length) {
        lines.push(`\nRecent Activity:`)
        githubData.recentCommits.slice(0, 5).forEach((c) => {
            lines.push(`  • [${c.repo}] ${c.message.slice(0, 80)}${c.message.length > 80 ? '...' : ''}`)
        })
    }

    if (githubData.readmePreview) {
        lines.push(`\nREADME Preview (top repo):\n${githubData.readmePreview.slice(0, 1200)}`)
    }

    if (githubData.targetRepo) {
        lines.push(`\nTARGET REPO: ${githubData.targetRepo.name}`)
        lines.push(`  ${githubData.targetRepo.description}`)
        lines.push(`  Stars: ${githubData.targetRepo.stars} · Language: ${githubData.targetRepo.language || 'N/A'}`)
        if (githubData.targetRepo.topics?.length) {
            lines.push(`  Topics: ${githubData.targetRepo.topics.join(', ')}`)
        }
        if (githubData.targetRepo.readme) {
            lines.push(`  README:\n${githubData.targetRepo.readme.slice(0, 1500)}`)
        }
    }

    return lines.join('\n')
}