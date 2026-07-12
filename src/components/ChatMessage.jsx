import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'

const SRC_LABEL = {
  resume: 'Resume', github: 'GitHub', both: 'Resume + GitHub',
  repo: 'Repository', file: 'File', merged: 'Merged',
  ats: 'ATS Engine', jd: 'Job Description',
  inference: 'Inference', general: 'General', error: 'Error',
}

const SRC_COLOR = {
  resume: '#16a34a', github: '#8b5e3c', both: '#a97142', repo: '#5f7c88',
  file: '#6f7d6a', merged: '#8b5e3c', ats: '#b45309', jd: '#4f6d8a',
  inference: '#9a7b52', general: '#a1a1aa', error: '#b4482f',
}

function confidenceMeta(pct) {
  if (pct >= 100) return { label: 'Explicitly stated', tone: 'high' }
  if (pct >= 75) return { label: 'Strongly supported', tone: 'high' }
  if (pct >= 40) return { label: 'Inferred from multiple sources', tone: 'mid' }
  if (pct > 0) return { label: 'Weak evidence', tone: 'low' }
  return { label: 'Not available in the data', tone: 'none' }
}

const SCOPE_TONE = {
  overall: '#22c55e', candidate: '#6f4e37', github: '#8b5cf6', repo: '#c89b6d',
  file: '#d99a3a', jd: '#dc2626', ats: '#b45309', interview: '#6f4e37', cross: '#6f4e37',
}

function Collapsible({ title, meta, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="msg-collapsible">
      <button className="msg-collapsible-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <ChevronRight size={13} className={open ? 'chev open' : 'chev'} />
        <span className="msg-collapsible-title">{title}</span>
        {meta && <span className="msg-collapsible-meta">{meta}</span>}
      </button>
      {open && <div className="msg-collapsible-body">{children}</div>}
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="chat-row ai-row">
      <div className="chat-avatar ai">RI</div>
      <div className="typing-card">
        {[0, 1, 2].map(i => <span key={i} style={{ animationDelay: `${i * 0.18}s` }} />)}
      </div>
    </div>
  )
}

function AnswerText({ text = '' }) {
  const sourceRegex = /\[(Resume \u002b GitHub|Resume|GitHub|Both|Repository|Repo|File|ATS Engine|ATS|Job Description|JD)\]/gi
  const sourceFor = (value) => {
    const lower = value.toLowerCase()
    if (lower === 'resume') return 'resume'
    if (lower === 'github') return 'github'
    if (lower === 'resume + github' || lower === 'both') return 'both'
    if (lower === 'repo' || lower === 'repository') return 'repo'
    if (lower === 'file') return 'file'
    if (lower === 'ats engine' || lower === 'ats') return 'ats'
    if (lower === 'job description' || lower === 'jd') return 'jd'
    return null
  }

  return (
    <div className="answer-text">
      {text.split('\n').map((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={index} className="answer-gap" />
        const normalized = trimmed.replace(/^[-*•▸]\s+/, '').replace(/^#{1,4}\s+/, '').replace(/\*\*/g, '')
        const parts = normalized.split(sourceRegex)
        return (
          <p key={index}>
            {parts.map((part, partIndex) => {
              const source = sourceFor(part)
              return source
                ? <span key={partIndex} className="inline-source" style={{ '--source-color': SRC_COLOR[source] }}>{SRC_LABEL[source]}</span>
                : <span key={partIndex}>{part}</span>
            })}
          </p>
        )
      })}
    </div>
  )
}

function CitationList({ citations = [], onCitationClick }) {
  if (!citations.length) return <span className="muted-text">No explicit citations returned.</span>
  return (
    <div className="evidence-citations">
      {citations.map((citation, i) => {
        const isFile = citation.type === 'file' && citation.filePath
        const label = citation.label || citation.filePath || citation.type || 'Source'
        const range = citation.lineStart && citation.lineEnd ? `:${citation.lineStart}-${citation.lineEnd}` : ''
        const CITE_LABEL = { file: 'Repository', resume: 'Resume', github: 'GitHub', ats: 'ATS Engine', jd: 'Job Description' }
        const source = CITE_LABEL[citation.type] || 'GitHub'
        return (
          <button
            key={`${label}-${i}`}
            type="button"
            onClick={() => isFile && onCitationClick?.(citation)}
            disabled={!isFile}
            title={isFile ? `${citation.filePath}${range}` : label}
            className={isFile ? 'citation-link clickable' : 'citation-link'}
          >
            <span className="citation-source">{source} ·</span>
            <span className="citation-label">{label}{range}</span>
          </button>
        )
      })}
    </div>
  )
}

function EvidenceSummary({ parsed, onCitationClick }) {
  const has = (t) => parsed.citations?.some(c => c.type === t)
  const sources = {
    Resume: has('resume') || ['resume', 'both', 'merged'].includes(parsed.source),
    GitHub: has('github') || ['github', 'both', 'merged'].includes(parsed.source),
    Repository: has('file') || ['repo', 'file', 'merged'].includes(parsed.source),
    'ATS Engine': has('ats') || parsed.source === 'ats',
    'Job Description': has('jd') || parsed.source === 'jd',
  }

  return (
    <div className="response-evidence">
      <div className="evidence-source-grid">
        {Object.entries(sources).map(([label, active]) => (
          <span key={label} className={active ? 'evidence-source active' : 'evidence-source'}>{label}</span>
        ))}
      </div>
      <CitationList citations={parsed.citations} onCitationClick={onCitationClick} />
    </div>
  )
}

function Reasoning({ text }) {
  if (!text) return null
  return (
    <div className="response-reasoning">
      <div className="response-section-title" style={{ marginBottom: 8 }}>Cross-source reasoning</div>
      <p>{text}</p>
    </div>
  )
}

const QCATS = [
  ['technicalEasy', 'Technical · Easy'],
  ['technicalMedium', 'Technical · Medium'],
  ['technicalHard', 'Technical · Hard'],
  ['system_design', 'System Design'],
  ['architecture', 'Architecture'],
  ['code_review', 'Code Review'],
  ['behavioral', 'Behavioral'],
  ['tasks', 'Suggested tasks'],
  ['followups', 'Follow-ups'],
]

function InterviewBlock({ interview, onAsk }) {
  if (!interview) return null
  const groups = {
    technicalEasy: interview.technical?.easy || [],
    technicalMedium: interview.technical?.medium || [],
    technicalHard: interview.technical?.hard || [],
    system_design: interview.system_design || [],
    architecture: interview.architecture || [],
    code_review: interview.code_review || [],
    behavioral: interview.behavioral || [],
    tasks: interview.tasks || [],
    followups: interview.followups || [],
  }
  const active = QCATS.filter(([key]) => groups[key].length)
  if (!active.length) return null
  return (
    <div className="interview-block">
      <div className="response-section-title" style={{ marginBottom: 10 }}>Interview plan</div>
      {active.map(([key, label]) => (
        <div className="iv-group" key={key}>
          <div className="iv-group-label">{label}</div>
          <div className="iv-questions">
            {groups[key].map((q, i) => (
              <button key={`${key}-${i}`} className="iv-question" onClick={() => onAsk?.(q)} title="Ask this / continue the interview">
                {q}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function JdMatch({ jd }) {
  if (!jd) return null
  return (
    <div className="jd-match">
      <div className="response-section-title" style={{ marginBottom: 12 }}>Job description match</div>
      {jd.overall != null && (
        <div className="jd-overall">
          <div className="jd-overall-ring" style={{ '--v': jd.overall }}><span>{jd.overall}<em>%</em></span></div>
          <div className="jd-overall-label">Overall match</div>
        </div>
      )}
      {jd.categories?.length > 0 && (
        <div className="jd-cats">
          {jd.categories.map(c => (
            <div className="jd-cat" key={c.label}>
              <div className="jd-cat-head"><span>{c.label}</span><strong>{c.score}%</strong></div>
              <div className="jd-cat-bar"><i style={{ width: `${c.score}%` }} /></div>
            </div>
          ))}
        </div>
      )}
      <div className="jd-cols">
        {jd.strengths?.length > 0 && <div><div className="jd-h good">Strengths</div><ul className="fa-list">{jd.strengths.map(s => <li key={s}>{s}</li>)}</ul></div>}
        {jd.weaknesses?.length > 0 && <div><div className="jd-h bad">Weaknesses</div><ul className="fa-list">{jd.weaknesses.map(s => <li key={s}>{s}</li>)}</ul></div>}
      </div>
      {jd.missing?.length > 0 && <div className="jd-block"><div className="jd-h">Missing skills</div><div className="tag-row">{jd.missing.map(m => <span key={m} className="code-tag">{m}</span>)}</div></div>}
      <div className="jd-cols">
        {jd.green_flags?.length > 0 && <div><div className="jd-h good">Green flags</div><ul className="fa-list">{jd.green_flags.map(s => <li key={s}>{s}</li>)}</ul></div>}
        {jd.red_flags?.length > 0 && <div><div className="jd-h bad">Red flags</div><ul className="fa-list">{jd.red_flags.map(s => <li key={s}>{s}</li>)}</ul></div>}
      </div>
      {jd.risk && <div className="jd-block"><div className="jd-h">Risk assessment</div><p className="fa-body muted">{jd.risk}</p></div>}
      {jd.interview_focus?.length > 0 && <div className="jd-block"><div className="jd-h">Interview focus</div><ul className="fa-list">{jd.interview_focus.map(s => <li key={s}>{s}</li>)}</ul></div>}
    </div>
  )
}

const VERDICT_TONE = {
  'Strong Hire': 'sh',
  'Hire': 'h',
  'Leaning Hire': 'lh',
  'Leaning No Hire': 'lnh',
  'No Hire': 'nh',
}

function Recommendation({ rec }) {
  if (!rec?.verdict) return null

  return (
    <div className="response-reco">
      <div className="response-section-title" style={{ marginBottom: 12 }}>
        Hiring Recommendation
      </div>

      <div className="reco-row">
        <span className={`reco-badge ${VERDICT_TONE[rec.verdict] || 'h'}`}>
          {rec.verdict}
        </span>

        {rec.confidence != null && (
          <span className="reco-confidence">
            Confidence: {Math.round(rec.confidence * 100)}%
          </span>
        )}
      </div>

      {rec.rationale && (
        <p className="reco-rationale">
          {rec.rationale}
        </p>
      )}

      {rec.why?.length > 0 && (
        <div className="reco-section">
          <strong>Why this recommendation</strong>
          <ul>
            {rec.why.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {rec.risks?.length > 0 && (
        <div className="reco-section">
          <strong>Hiring Risks</strong>
          <ul>
            {rec.risks.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {rec.next_action && (
        <div className="reco-section">
          <strong>Recommended Next Step</strong>
          <p>{rec.next_action}</p>
        </div>
      )}

      {rec.recruiter_notes && (
        <div className="reco-section">
          <strong>Recruiter Notes</strong>
          <p>{rec.recruiter_notes}</p>
        </div>
      )}
    </div>
  )
}

function MissingInfo({ items = [] }) {
  if (!items.length) return null
  return (
    <div className="response-missing">
      <div className="response-section-title" style={{ marginBottom: 8 }}>Missing information</div>
      <ul className="missing-list">
        {items.slice(0, 6).map((item, i) => <li key={`${item}-${i}`}>{String(item)}</li>)}
      </ul>
    </div>
  )
}

export default function ChatMessage({ msg, onCitationClick, onAsk }) {
  const [copied, setCopied] = useState(false)

  if (msg.role === 'user') {
    return (
      <motion.div className="chat-row user-row" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="chat-avatar user">U</div>
        <div className="user-message">{msg.text}</div>
      </motion.div>
    )
  }

  const { parsed, provider } = msg
  const pct = Math.round((parsed.confidence || 0) * 100)
  const conf = confidenceMeta(pct)
  const src = parsed.source || 'inference'
  const dotColor = SRC_COLOR[src] || '#a8a29e'
  const isError = src === 'error'

  const copyAnswer = () => {
    navigator.clipboard?.writeText(parsed.answer)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <motion.div className="chat-row ai-row" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <div className="chat-avatar ai">RI</div>
      <article className={isError ? 'ai-message error' : 'ai-message'}>
        <header className="ai-message-header">
          {msg.scope
            ? <span className="scope-badge" style={{ '--tone': SCOPE_TONE[msg.scope.tone] || '#6f4e37' }}><i />{msg.scope.label}</span>
            : <span className="response-source"><i style={{ background: dotColor }} />{SRC_LABEL[src] || src}</span>}
          <div className="ai-actions">
            {provider && <span>{provider}</span>}
            <button onClick={copyAnswer}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </header>

        <AnswerText text={parsed.answer} />
        <JdMatch jd={parsed.jdMatch} />
        <InterviewBlock interview={parsed.interview} onAsk={onAsk} />
        <Recommendation rec={parsed.recommendation} />
        <MissingInfo items={parsed.missing_data} />

        {parsed.reasoning && (
          <Collapsible title="Reasoning">
            <p className="reasoning-text">{parsed.reasoning}</p>
          </Collapsible>
        )}

        <Collapsible title="Evidence">
          <EvidenceSummary parsed={parsed} onCitationClick={onCitationClick} />
        </Collapsible>

        {msg.sources?.length > 0 && (
          <Collapsible title="Sources used" meta={`${msg.sources.length}`}>
            <ul className="sources-list">
              {msg.sources.map(s => <li key={s}><Check size={13} /> {s}</li>)}
            </ul>
          </Collapsible>
        )}

        <div className="response-confidence subtle">
          <span>Confidence</span>
          <div><div className={`conf-${conf.tone}`} style={{ width: `${pct}%` }} /></div>
          <strong>{pct}%</strong>
          <em>{conf.label}</em>
        </div>

        {parsed.suggested_followups?.length > 0 && (
          <div className="followups">
            <div className="response-section-title" style={{ marginBottom: 10 }}>Suggested follow-ups</div>
            <div>
              {parsed.suggested_followups.map(question => (
                onAsk
                  ? <button key={question} className="followup-chip" onClick={() => onAsk(question)}>{question}</button>
                  : <span key={question}>{question}</span>
              ))}
            </div>
          </div>
        )}
      </article>
    </motion.div>
  )
}
