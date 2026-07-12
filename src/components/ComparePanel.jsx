import React, { useEffect, useRef, useState } from 'react'
import { Check, FileUp, GitBranch, Loader2, Maximize2, Minimize2, Sparkles, UserPlus, X } from 'lucide-react'
import { extractResumeText } from '../utils/pdfExtractor'
import { parseResume, buildResumeContext } from '../utils/resumeParser'
import { fetchGitHubProfile, buildGitHubContext } from '../utils/githubapi'
import { callAI } from '../utils/aiClient'
import { buildCompareSystemPrompt, parseCompareResponse } from '../utils/compareParser'
import CompareChatMessage, { CompareTypingIndicator, CompareUserMessage } from './CompareChatMessage'
import ChatInput from './ChatInput'
import Avatar from './Avatar'

const SUGGESTIONS = [
  'Which candidate is the strongest overall fit?',
  'Rank them by seniority and explain why.',
  'Who has stronger open-source evidence?',
  'What is the biggest hiring risk with each?',
]

function GitHubSlot({ entry, onAttach }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (entry.githubData) {
    return <span className="compare-gh-badge on"><Check size={11} /> {entry.githubData.username}</span>
  }
  if (!open) {
    return <button className="compare-gh-badge" onClick={() => setOpen(true)}><GitBranch size={11} /> Connect GitHub</button>
  }
  const submit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true); setError(null)
    try {
      const data = await fetchGitHubProfile(input.trim())
      onAttach(entry.id, data)
      setOpen(false)
    } catch (err) { setError(err.message || 'Failed to connect') } finally { setLoading(false) }
  }
  return (
    <form className="compare-gh-form" onSubmit={submit}>
      <input autoFocus value={input} onChange={e => setInput(e.target.value)} placeholder="user/repo" onBlur={() => !input && setOpen(false)} />
      <button type="submit" disabled={loading}>{loading ? <Loader2 size={11} className="spin" /> : <Check size={11} />}</button>
      {error && <span className="sb-error">{error}</span>}
    </form>
  )
}

function CandidateColumn({ entry, onRemove, onAttachGitHub }) {
  const { candidate, githubData } = entry
  const name = candidate?.name || githubData?.name || githubData?.username || 'Candidate'
  const initials = candidate?.initials || githubData?.username?.slice(0, 2).toUpperCase() || '—'
  return (
    <div className="compare-col">
      <button className="compare-col-remove" onClick={() => onRemove(entry.id)} title="Remove"><X size={13} /></button>
      <Avatar src={githubData?.avatar} alt={name} initials={initials} className="compare-col-avatar" />
      <div className="compare-col-name">{name}</div>
      <div className="compare-col-role">{candidate?.role || githubData?.bio || '—'}</div>
      <GitHubSlot entry={entry} onAttach={onAttachGitHub} />

      <div className="compare-col-rows">
        <div><span>ATS</span><strong>{candidate?.ats?.total ?? '—'}</strong></div>
        <div><span>Experience</span><strong>{candidate?.expYears != null ? `${candidate.expYears}y` : '—'}</strong></div>
        <div><span>Repositories</span><strong>{githubData?.publicRepos ?? '—'}</strong></div>
        <div><span>Languages</span><strong>{githubData?.languageStats?.length ?? '—'}</strong></div>
      </div>

      {candidate?.skills?.length > 0 && (
        <div className="tag-row" style={{ marginTop: 10 }}>
          {candidate.skills.slice(0, 6).map(s => <span key={s} className="code-tag">{s}</span>)}
        </div>
      )}
    </div>
  )
}

function AddCandidateCard({ onAdd }) {
  const fileRef = useRef(null)
  const [username, setUsername] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || loading) return
    setLoading(true); setError(null)
    try {
      const githubData = await fetchGitHubProfile(username.trim())
      let candidate = null
      let resumeText = ''
      if (resumeFile) {
        resumeText = await extractResumeText(resumeFile)
        candidate = await parseResume(resumeText, resumeFile.name)
      }
      onAdd({ id: crypto.randomUUID(), resumeText, candidate, githubData })
      setUsername(''); setResumeFile(null)
    } catch (err) {
      setError(err.message || 'Failed to connect GitHub')
    } finally { setLoading(false) }
  }

  return (
    <form className="compare-add-card" onSubmit={handleSubmit}>
      <UserPlus size={18} style={{ color: 'var(--stone-soft)' }} />
      <input
        className="compare-add-gh-input"
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="GitHub username or user/repo"
      />
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" hidden onChange={e => setResumeFile(e.target.files[0] || null)} />
      {resumeFile ? (
        <span className="compare-add-resume-chip">
          <FileUp size={11} /> {resumeFile.name}
          <button type="button" onClick={() => setResumeFile(null)}><X size={11} /></button>
        </span>
      ) : (
        <button type="button" className="compare-add-resume-link" onClick={() => fileRef.current?.click()}>+ Attach resume (optional)</button>
      )}
      <button className="sb-btn" type="submit" disabled={loading || !username.trim()}>
        {loading ? <Loader2 size={14} className="spin" /> : <GitBranch size={14} />} Add candidate
      </button>
      {error && <span className="sb-error">{error}</span>}
    </form>
  )
}

export default function ComparePanel() {
  const [entries, setEntries] = useState([])
  const [role, setRole] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, isLoading, expanded])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  const addEntry = (entry) => setEntries(prev => [...prev, entry])
  const removeEntry = (id) => setEntries(prev => prev.filter(e => e.id !== id))
  const attachGitHub = (id, githubData) => setEntries(prev => prev.map(e => e.id === id ? { ...e, githubData } : e))

  const candidateNames = entries.map((e, i) => e.candidate?.name || e.githubData?.name || e.githubData?.username || `Candidate ${i + 1}`)

  const ask = async (question) => {
    if (!question.trim() || entries.length < 2 || isLoading) return
    setIsLoading(true)
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: question }])

    try {
      const blocks = entries.map((e, i) => {
        const name = candidateNames[i]
        const resumeCtx = e.candidate ? buildResumeContext(e.candidate) : 'No resume provided.'
        const ghCtx = e.githubData ? buildGitHubContext(e.githubData) : 'No GitHub connected.'
        return `=== CANDIDATE: ${name} ===\n${resumeCtx}\n\n${ghCtx}`
      }).join('\n\n')

      const recentHistory = messages.slice(-6).map(m =>
        m.role === 'user' ? `Recruiter: ${m.text}` : `ResumeIQ verdict: ${m.parsed?.verdict || m.parsed?.freeText || ''}`
      ).join('\n\n')

      const prompt = [
        `Candidates being compared: ${candidateNames.join(', ')}.`,
        role ? `=== JOB DESCRIPTION (weigh every dimension against this specific role) ===\n${role.slice(0, 4000)}` : '',
        recentHistory ? `=== RECENT CONVERSATION (resolve follow-up references against this) ===\n${recentHistory}` : '',
        blocks,
        `=== QUESTION ===\n${question}`,
      ].filter(Boolean).join('\n\n')

      const result = await callAI([{ role: 'user', parts: [{ text: prompt }] }], buildCompareSystemPrompt())
      const parsed = parseCompareResponse(result.text)
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', parsed, provider: result.provider }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'ai',
        parsed: { verdict: '', winner: '', confidence: 0, dimensions: [], risks: [], recommendation: '', freeText: `Unable to reach the AI provider.\n\n${err.message}`, error: true },
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="compare-view">
      <div className="compare-head">
        <h1>Compare candidates</h1>
        <p>Add each candidate by GitHub username — a resume is optional but sharpens ATS and experience signal. The layout adapts to however many you add, and the conversation remembers earlier answers for follow-ups.</p>
      </div>

      <div className="compare-grid">
        {entries.map(entry => <CandidateColumn key={entry.id} entry={entry} onRemove={removeEntry} onAttachGitHub={attachGitHub} />)}
        <AddCandidateCard onAdd={addEntry} />
      </div>

      {entries.length === 1 && <p className="aa-muted" style={{ margin: '0 0 20px' }}>Add at least one more candidate to start comparing.</p>}

      {entries.length >= 2 && (
        <div className="compare-jd-card">
          <label className="compare-jd-label">
            Job description <span>— optional, but every answer below will evaluate and rank candidates against it</span>
          </label>
          <textarea
            className="compare-jd-textarea"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Paste the role or job description here…"
            rows={role ? 5 : 2}
          />
        </div>
      )}

      {entries.length >= 2 && (
        <>
          {expanded && <div className="chat-expand-backdrop" onClick={() => setExpanded(false)} />}
          <div className={expanded ? 'compare-chat expanded' : 'compare-chat'}>
            <div className="chat-col-head">
              <span>Comparison chat</span>
              <button className="chat-expand-btn" onClick={() => setExpanded(v => !v)} title={expanded ? 'Collapse (Esc)' : 'Expand for easier reading'}>
                {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>
            <div className="compare-chat-scroll" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="compare-chat-empty">
                  <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                  <p>Ask anything about these {entries.length} candidates.</p>
                  <div className="empty-prompts">
                    {SUGGESTIONS.map(s => <button key={s} onClick={() => ask(s)}>{s}</button>)}
                  </div>
                </div>
              ) : (
                <div className="cc-messages-inner">
                  {messages.map(msg => msg.role === 'user'
                    ? <CompareUserMessage key={msg.id} text={msg.text} />
                    : <CompareChatMessage key={msg.id} msg={msg} candidateNames={candidateNames} />
                  )}
                  {isLoading && <CompareTypingIndicator />}
                </div>
              )}
            </div>

            <div className="composer">
              <div className="composer-inner">
                <ChatInput onSend={ask} disabled={isLoading} placeholder={`Ask about these ${entries.length} candidates…`} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
