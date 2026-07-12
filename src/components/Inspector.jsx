import React from 'react'
import { AlertTriangle, Sparkles, ThumbsUp } from 'lucide-react'
import AiAnalysisPanel from './AiAnalysisPanel'
import RepoIntelligencePanel from './RepoIntelligencePanel'

const ATS_PARTS = [
  { key: 'skills', label: 'Skills', max: 35 },
  { key: 'experience', label: 'Experience', max: 25 },
  { key: 'education', label: 'Education', max: 15 },
  { key: 'certs', label: 'Certifications', max: 10 },
  { key: 'contact', label: 'Contact', max: 10 },
  { key: 'content', label: 'Content', max: 5 },
]

export function CandidateInsight({ candidate, githubData, onAsk }) {
  if (!candidate && !githubData) {
    return (
      <div className="context-empty">
        Add a resume or connect GitHub, then select a repository or file to bring code into context.
      </div>
    )
  }

  const breakdown = candidate?.ats?.breakdown || {}
  const rows = ATS_PARTS.map(p => ({ ...p, pct: Math.round(((breakdown[p.key] ?? 0) / p.max) * 100) }))
  const strengths = rows.filter(r => r.pct >= 70)
  const weaknesses = rows.filter(r => r.pct < 45)
  const verdict = candidate?.ats?.total >= 70 ? 'Promising fit' : candidate?.ats?.total >= 45 ? 'Worth a closer look' : 'Needs more evidence'

  return (
    <div className="repo-summary">
      <div className="rs-purpose">
        <div className="rs-name">Candidate signal</div>
        <p>{candidate ? `Built from the resume, ATS breakdown, and GitHub activity available so far.` : `Built from GitHub activity — add a resume to unlock ATS-based signal.`}</p>
      </div>

      {candidate?.ats && (
        <div className="rs-block">
          <div className="section-title">Hiring risk</div>
          <span className="reco-badge big h"><ThumbsUp size={13} style={{ marginRight: 6 }} /> {verdict}</span>
        </div>
      )}

      {strengths.length > 0 && (
        <div className="rs-block">
          <div className="section-title">Strengths</div>
          <ul className="rs-list">
            {strengths.map(s => <li key={s.key}><span>{s.label}</span><em>{s.pct}%</em></li>)}
          </ul>
        </div>
      )}

      {weaknesses.length > 0 && (
        <div className="rs-block">
          <div className="section-title">Weaknesses</div>
          <ul className="rs-list">
            {weaknesses.map(w => <li key={w.key}><span>{w.label}</span><em style={{ color: 'var(--warn)' }}><AlertTriangle size={11} style={{ marginRight: 4, verticalAlign: -1 }} />{w.pct}%</em></li>)}
          </ul>
        </div>
      )}

      {githubData?.languageStats?.length > 0 && (
        <div className="rs-block">
          <div className="section-title">Languages</div>
          <div className="tag-row">{githubData.languageStats.slice(0, 6).map(l => <span key={l.name} className="code-tag">{l.name} {l.percentage}%</span>)}</div>
        </div>
      )}

      {onAsk && (
        <div className="rs-block">
          <div className="section-title">Generate</div>
          <div className="gen-actions">
            <button className="gen-btn" onClick={() => onAsk('Compare the resume claims with GitHub evidence for this candidate.')}><Sparkles size={13} /> Compare resume vs GitHub</button>
            <button className="gen-btn" onClick={() => onAsk('Should we hire this candidate? Give a clear recommendation with evidence.')}><Sparkles size={13} /> Get a hiring recommendation</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Inspector({
  selectedFile, repoIndex, repoLoading, repoError, selectedFilePath,
  candidate, githubData, onAsk, onSelectFile,
}) {
  const eyebrow = selectedFile ? 'File' : repoIndex || repoLoading ? 'Repository' : 'Insights'
  const title = selectedFile
    ? selectedFile.path.split('/').pop()
    : repoIndex
      ? `${repoIndex.owner}/${repoIndex.repo}`
      : 'Nothing selected yet'

  return (
    <div className="inspector">
      <div className="inspector-head">
        <span className="inspector-eyebrow">{eyebrow} inspector</span>
        <span className="inspector-title">{title}</span>
      </div>

      {selectedFile ? (
        <AiAnalysisPanel file={selectedFile} onAsk={onAsk} owner={repoIndex?.owner} repo={repoIndex?.repo} branch={repoIndex?.branch} />
      ) : repoIndex || repoLoading || repoError ? (
        <RepoIntelligencePanel
          repoIndex={repoIndex}
          githubData={githubData}
          loading={repoLoading}
          error={repoError}
          selectedPath={selectedFilePath}
          onSelectFile={onSelectFile}
          onAsk={onAsk}
        />
      ) : (
        <div className="context-body">
          <div className="context-empty">
            Select a repository or a file to see AI-generated insights here — architecture,
            code quality, potential bugs, and interview questions all update automatically.
          </div>
        </div>
      )}
    </div>
  )
}
