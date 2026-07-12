import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, FileUp, GitBranch, MessagesSquare, Sparkles } from 'lucide-react'
import Avatar from './Avatar'

function Metric({ label, value }) {
  return (
    <div className="ov-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay: i * 0.06 },
})

export default function OverviewDashboard({ candidate, githubData, repoIndex, stats, onOpenAts, onStart }) {
  const atsScore = candidate?.ats?.total ?? candidate?.score ?? null
  const name = candidate?.name || githubData?.name || githubData?.username || 'No candidate yet'
  const role = candidate?.role || githubData?.bio || 'Add a resume or connect GitHub to begin'
  const initials = candidate?.initials || githubData?.username?.slice(0, 2).toUpperCase() || 'RI'

  return (
    <div className="overview">
      <motion.header className="overview-head" {...fade(0)}>
        <h1>Good to see you</h1>
        <p>Here's the candidate you're evaluating and everything the interview workspace knows so far.</p>
      </motion.header>

      <motion.section className="ov-card ov-candidate" {...fade(1)}>
        <div className="ov-card-head">
          <span className="ov-kicker">Candidate overview</span>
          {candidate?.ats && (
            <button className="ov-link" onClick={onOpenAts}>ATS breakdown <ArrowRight size={13} /></button>
          )}
        </div>
        <div className="ov-candidate-body">
          <Avatar src={githubData?.avatar} alt={name} initials={initials} className="ov-avatar" />
          <div className="ov-identity">
            <h2>{name}</h2>
            <p>{role}</p>
          </div>
          {atsScore != null && (
            <div className="ov-ats">
              <div className="ats-ring" style={{ '--score': atsScore }}><span>{atsScore}</span></div>
              <span className="ov-ats-label">{candidate?.ats?.label || 'ATS'}</span>
            </div>
          )}
        </div>
        <div className="ov-metrics">
          <Metric label="Experience" value={candidate?.expYears != null ? `${candidate.expYears}y` : '—'} />
          <Metric label="Skills" value={candidate?.skills?.length || 0} />
          <Metric label="Repositories" value={githubData?.publicRepos || 0} />
          <Metric label="Languages" value={githubData?.languageStats?.length || 0} />
        </div>
      </motion.section>

      <div className="ov-grid">
        <motion.section className="ov-card" {...fade(2)}>
          <span className="ov-kicker">Repository intelligence</span>
          {repoIndex ? (
            <>
              <h3 className="ov-repo-name">{repoIndex.owner}/{repoIndex.repo}</h3>
              <div className="ov-metrics three">
                <Metric label="Files" value={stats?.files ?? '—'} />
                <Metric label="Edges" value={stats?.edges ?? '—'} />
                <Metric label="Languages" value={githubData?.languageStats?.length || 0} />
              </div>
              {(githubData?.languageStats || []).length > 0 && (
                <div className="ov-langs">
                  {githubData.languageStats.slice(0, 4).map(l => <span key={l.name}>{l.name} {l.percentage}%</span>)}
                </div>
              )}
            </>
          ) : (
            <p className="ov-empty">Connect GitHub in the interview workspace to index a repository and explore its files, architecture, and code.</p>
          )}
        </motion.section>

        <motion.section className="ov-card ov-cta" {...fade(3)}>
          <div className="ov-cta-icon"><Sparkles size={20} /></div>
          <span className="ov-kicker">Interview workspace</span>
          <h3>Interview this candidate</h3>
          <p>Ask evidence-first questions, browse the repo, read the code, and generate tailored interview questions and coding tasks.</p>
          <button className="ov-primary" onClick={onStart}>
            <MessagesSquare size={15} /> Open workspace <ArrowRight size={15} />
          </button>
        </motion.section>
      </div>

      {!candidate && !githubData && (
        <motion.div className="ov-hints" {...fade(4)}>
          <div className="ov-hint"><FileUp size={16} /> Upload a resume to compute the ATS score and skills.</div>
          <div className="ov-hint"><GitBranch size={16} /> Connect GitHub to index a repository and read the code.</div>
        </motion.div>
      )}
    </div>
  )
}
