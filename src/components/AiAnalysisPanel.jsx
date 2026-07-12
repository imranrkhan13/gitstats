import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Award, Bug, Clock, FileText, Gauge, GitCommitHorizontal, Loader2, MessagesSquare, Sparkles } from 'lucide-react'
import { fetchFileHistory } from '../utils/githubapi'

const TABS = [
  ['purpose', 'Purpose', FileText],
  ['complexity', 'Complexity', Activity],
  ['quality', 'Code Quality', Gauge],
  ['bugs', 'Potential Bugs', Bug],
  ['history', 'History', GitCommitHorizontal],
  ['interview', 'Interview', MessagesSquare],
  ['seniority', 'Seniority', Award],
]

const BUG_PATTERNS = [
  [/catch\s*\([^)]*\)\s*\{\s*\}/, 'Empty catch block — errors are silently swallowed'],
  [/[^=!<>]==[^=]/, 'Loose equality (==) — prefer strict equality'],
  [/console\.(log|debug|info)/, 'Leftover console logging'],
  [/\bTODO\b|\bFIXME\b|\bHACK\b/, 'Contains TODO / FIXME markers'],
  [/:\s*any\b/, 'Uses the `any` type — weakens type safety'],
  [/\beval\s*\(/, 'Uses eval()'],
  [/dangerouslySetInnerHTML/, 'Uses dangerouslySetInnerHTML — XSS surface'],
]

function AskButton({ label, onClick }) {
  return <button className="ask-ai-btn" onClick={onClick}><Sparkles size={13} /> {label}</button>
}

export default function AiAnalysisPanel({ file, onAsk, owner, repo, branch }) {
  const [tab, setTab] = useState('purpose')
  const [history, setHistory] = useState({}) // path -> { loading, error, commits }
  const bugs = useMemo(() => {
    const c = file?.content || ''
    return BUG_PATTERNS.filter(([re]) => re.test(c)).map(([, label]) => label)
  }, [file])

  useEffect(() => {
    if (tab !== 'history' || !file || !owner || !repo) return
    if (history[file.path]) return
    setHistory(h => ({ ...h, [file.path]: { loading: true } }))
    fetchFileHistory(owner, repo, file.path, branch)
      .then(commits => setHistory(h => ({ ...h, [file.path]: { loading: false, commits } })))
      .catch(err => setHistory(h => ({ ...h, [file.path]: { loading: false, error: err.message } })))
  }, [tab, file, owner, repo, branch, history])

  if (!file) return <div className="ai-analysis empty"><p>Select a file to analyse the candidate's code.</p></div>

  const name = file.path.split('/').pop()
  const deps = file.dependencies || []
  const exportsList = file.summary?.keyExports || []
  const lineCount = file.summary?.lineCount || 0
  const nesting = file.summary?.complexity?.nesting ?? 0
  const questions = file.questions || []
  const ask = (q) => onAsk?.(q, 'file')

  const sScore = (lineCount > 200 ? 2 : lineCount > 80 ? 1 : 0) + (deps.length > 5 ? 1 : 0) + (exportsList.length > 3 ? 1 : 0) + (nesting >= 5 ? 1 : 0)
  const seniority = sScore >= 3 ? 'Senior-level signals' : sScore >= 1 ? 'Mid-level signals' : 'Early / junior signals'

  const complexityNote = `This file has ${lineCount} lines, ${deps.length} direct dependencies` + (nesting != null ? ` and a maximum nesting depth of ${nesting}.` : '.')
    + (lineCount > 180 || nesting >= 5 ? ' The author is handling non-trivial structure here.' : ' The structure is contained and readable.')

  const qualityNotes = [
    exportsList.length ? `Exposes a clear module surface (${exportsList.slice(0, 4).join(', ')}).` : 'No named exports detected — the module surface is implicit.',
    deps.length > 6 ? 'High import count suggests tight coupling.' : 'Dependency count is modest.',
    nesting >= 5 ? 'Deep nesting will make this hard to test.' : 'Control flow is reasonably flat.',
  ]

  const body = () => {
    if (tab === 'purpose') return (
      <div className="aa-body">
        <p className="aa-text">This file {file.summary?.summary ? file.summary.summary.replace(/^[A-Z]/, m => m.toLowerCase()) : 'has no detectable summary.'}</p>
        <div className="aa-metrics"><span><strong>{lineCount}</strong> lines</span><span><strong>{deps.length}</strong> imports</span><span><strong>{exportsList.length}</strong> exports</span></div>
      </div>
    )
    if (tab === 'complexity') return (
      <div className="aa-body">
        <p className="aa-text">{complexityNote}</p>
        <div className="aa-metrics"><span><strong>{lineCount}</strong> lines</span>{nesting != null && <span><strong>{nesting}</strong> max nesting</span>}<span><strong>{deps.length}</strong> deps</span></div>
      </div>
    )
    if (tab === 'quality') return (
      <div className="aa-body">
        <ul className="aa-list">{qualityNotes.map(n => <li key={n}>{n}</li>)}</ul>
        <AskButton label="Ask AI to review code quality" onClick={() => ask(`As a staff engineer, assess the code quality of ${name} using only the code shown.`)} />
      </div>
    )
    if (tab === 'bugs') return (
      <div className="aa-body">
        {bugs.length ? <ul className="aa-list">{bugs.map(b => <li key={b}>{b}</li>)}</ul> : <p className="aa-muted">No obvious bug patterns detected by static scan.</p>}
        <AskButton label="Ask AI to find potential bugs" onClick={() => ask(`Identify potential bugs and edge cases in ${name} using only the code shown.`)} />
      </div>
    )
    if (tab === 'history') {
      const entry = history[file.path]
      return (
        <div className="aa-body">
          {!owner || !repo ? (
            <p className="aa-muted">Connect a GitHub repository to see commit history for this file.</p>
          ) : entry?.loading ? (
            <p className="aa-muted"><Loader2 size={12} className="spin" style={{ verticalAlign: -2, marginRight: 6 }} />Loading commit history…</p>
          ) : entry?.error ? (
            <p className="aa-muted">Couldn't load history: {entry.error}</p>
          ) : entry?.commits?.length ? (
            <ul className="history-list">
              {entry.commits.map(c => (
                <li key={c.sha}>
                  <span className="history-msg">{c.message}</span>
                  <span className="history-meta"><Clock size={10} /> {c.author} · {c.sha}{c.url && <> · <a href={c.url} target="_blank" rel="noreferrer">view</a></>}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="aa-muted">No commit history found for this file on the current branch.</p>
          )}
        </div>
      )
    }
    if (tab === 'interview') return (
      <div className="aa-body">
        {questions.length ? <div className="aa-chips">{questions.map(q => <button key={q} className="aa-chip" onClick={() => ask(q)}>{q}</button>)}</div> : <p className="aa-muted">No generated questions for this file.</p>}
        <AskButton label="What would you ask about this file?" onClick={() => ask(`What interview questions would you ask this candidate about ${name}?`)} />
        <AskButton label="Give the candidate a coding task" onClick={() => ask(`Design a short coding task for this candidate based on ${name}.`)} />
      </div>
    )
    if (tab === 'seniority') return (
      <div className="aa-body">
        <p className="aa-text"><strong>{seniority}</strong> based on file size, dependencies, exports, and nesting.</p>
        <div className="aa-sub">What I'd ask as a Staff Engineer</div>
        <AskButton label="Generate Staff-Engineer-level questions" onClick={() => ask(`As a staff engineer, what deep questions would you ask this candidate about ${name} to probe their seniority?`)} />
      </div>
    )
    return null
  }

  return (
    <div className="ai-analysis">
      <div className="aa-tabs">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} className={tab === id ? 'aa-tab active' : 'aa-tab'} onClick={() => setTab(id)} title={label}>
            <Icon size={14} /><span>{label}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
          {body()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
