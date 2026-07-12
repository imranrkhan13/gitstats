import React from 'react'
import { Download, ExternalLink, GitCommitHorizontal, GitPullRequest } from 'lucide-react'
import { CandidateInsight } from './Inspector'
import { buildInterviewPacket, downloadMarkdown } from '../utils/exportPacket'
import Avatar from './Avatar'

function Stat({ label, value, onClick, accent }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp className={onClick ? 'cd-stat clickable' : 'cd-stat'} onClick={onClick}>
      <span className={accent ? 'cd-stat-value accent' : 'cd-stat-value'}>{value}</span>
      <span className="cd-stat-label">{label}</span>
    </Comp>
  )
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

function ActivityColumns({ githubData }) {
  const commits = githubData?.recentCommits || []
  const contributions = githubData?.contributions || []
  if (!commits.length && !contributions.length) return null

  return (
    <div className="cd-activity-grid">
      <div className="cd-activity-col">
        <div className="section-title"><GitCommitHorizontal size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Recent commits (own repos)</div>
        {commits.length ? (
          <ul className="activity-list">
            {commits.slice(0, 8).map((c, i) => (
              <li key={i}>
                <span className="activity-repo">{c.repo}</span>
                <span className="activity-msg">{c.message || 'No message'}</span>
                <span className="activity-time">{timeAgo(c.date)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="aa-muted">No recent push activity detected.</p>}
      </div>

      <div className="cd-activity-col">
        <div className="section-title"><GitPullRequest size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Open source contributions</div>
        {contributions.length ? (
          <ul className="activity-list">
            {contributions.slice(0, 8).map((c, i) => (
              <li key={i}>
                <span className="activity-repo">{c.repo}</span>
                <span className="activity-msg">
                  {c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.title || `${c.kind === 'pull_request' ? 'Pull request' : 'Issue'}`} <ExternalLink size={10} /></a> : (c.title || '—')}
                </span>
                <span className={`activity-badge ${c.state}`}>{c.state}</span>
              </li>
            ))}
          </ul>
        ) : <p className="aa-muted">No contributions to external repositories detected in recent activity.</p>}
      </div>
    </div>
  )
}

export default function CandidateDetail({ candidate, githubData, onOpenAts, onAsk }) {
  const initials = candidate?.initials || githubData?.username?.slice(0, 2).toUpperCase() || 'RI'
  const name = candidate?.name || githubData?.name || githubData?.username || 'No candidate yet'
  const role = candidate?.role || githubData?.bio || 'Add a resume or connect GitHub to begin'
  const atsScore = candidate?.ats?.total ?? candidate?.score ?? null

  if (!candidate && !githubData) {
    return (
      <div className="cd-empty">
        <div className="cd-empty-avatar">RI</div>
        <h2>No candidate yet</h2>
        <p>Upload a resume or connect GitHub from the bar above — every panel here fills in automatically as soon as they land.</p>
      </div>
    )
  }

  const handleExport = () => {
    const packet = buildInterviewPacket({ candidate, githubData })
    downloadMarkdown(`${(name || 'candidate').replace(/\s+/g, '-').toLowerCase()}-interview-packet.md`, packet)
  }

  return (
    <div className="candidate-detail">
      <div className="cd-header">
        <Avatar src={githubData?.avatar} alt={name} initials={initials} className="cd-avatar" />
        <div className="cd-identity">
          <h2>{name}</h2>
          <p>{role}</p>
        </div>
        <button className="cd-export-btn" onClick={handleExport}><Download size={13} /> Export interview packet</button>
      </div>

      <div className="cd-stats-grid">
        <Stat label="ATS score" value={atsScore != null ? atsScore : '—'} onClick={candidate?.ats ? onOpenAts : undefined} accent />
        <Stat label="JD match" value={candidate?.jdMatch != null ? `${candidate.jdMatch}%` : '—'} />
        <Stat label="Experience" value={candidate?.expYears != null ? `${candidate.expYears} yrs` : '—'} />
        <Stat label="Skills" value={candidate?.skills?.length || 0} />
        <Stat label="Repositories" value={githubData?.publicRepos || 0} />
        <Stat label="Languages" value={githubData?.languageStats?.length || 0} />
      </div>

      {candidate?.skills?.length > 0 && (
        <div className="cd-section">
          <div className="section-title">Skills</div>
          <div className="tag-row">{candidate.skills.map(s => <span key={s} className="code-tag">{s}</span>)}</div>
        </div>
      )}

      <ActivityColumns githubData={githubData} />

      <div className="cd-section">
        <CandidateInsight candidate={candidate} githubData={githubData} onAsk={onAsk} />
      </div>
    </div>
  )
}
