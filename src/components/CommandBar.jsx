import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, FileUp, GitBranch, Loader2, Mic, Pin, RotateCcw, Search } from 'lucide-react'
import { extractResumeText } from '../utils/pdfExtractor'
import { fetchGitHubProfile } from '../utils/githubapi'
import Avatar from './Avatar'

function RepoPicker({ repositories, selectedRepoName, onSelect, disabled }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pinned, setPinned] = useState(() => new Set())
  const wrapRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  const togglePin = (e, name) => { e.stopPropagation(); setPinned(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n }) }
  const q = query.trim().toLowerCase()
  const filtered = repositories.filter(r => !q || r.name.toLowerCase().includes(q))
  const pinnedRepos = filtered.filter(r => pinned.has(r.name))
  const others = filtered.filter(r => !pinned.has(r.name))
  const label = selectedRepoName || (repositories.length ? 'Select repo' : 'No repository')
  const Row = (repo, isPinned) => (
    <button key={repo.name} className={repo.name === selectedRepoName ? 'repo-picker-item active' : 'repo-picker-item'} onClick={() => { onSelect(repo.name); setOpen(false) }}>
      <span className="repo-name">{repo.name}</span>
      <Pin size={13} className={isPinned ? 'pin pinned' : 'pin'} onClick={(e) => togglePin(e, repo.name)} />
    </button>
  )
  return (
    <div className="repo-picker-wrap" ref={wrapRef}>
      <button className="tb-select" onClick={() => !disabled && setOpen(v => !v)} disabled={disabled}>
        <GitBranch size={12} /><span>{label}</span>{!disabled && <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="repo-picker">
          <div className="repo-picker-search"><Search size={14} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search repositories" /></div>
          <div className="repo-picker-list">
            {filtered.length === 0 && <div className="repo-picker-empty">No repositories found.</div>}
            {pinnedRepos.length > 0 && <div className="repo-picker-group">Pinned</div>}
            {pinnedRepos.map(r => Row(r, true))}
            {pinnedRepos.length > 0 && others.length > 0 && <div className="repo-picker-group">All repositories</div>}
            {others.map(r => Row(r, false))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CommandBar({
  candidate, githubData, parseStatus,
  onFileLoad, onGitHubLoad, onGitHubRemove, onOpenAts,
  onSearch, activeProvider, onVoice, voiceActive, onClear,
  repositories = [], selectedRepoName, onRepositoryChange,
  branches = [], selectedBranch, onBranchChange,
}) {
  const fileRef = useRef(null)
  const [q, setQ] = useState('')
  const [githubInput, setGithubInput] = useState('')
  const [showGithub, setShowGithub] = useState(false)
  const [err, setErr] = useState(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)

  const isParsing = resumeLoading || parseStatus === 'parsing'
  const initials = candidate?.initials || githubData?.username?.slice(0, 2).toUpperCase() || 'RI'
  const name = candidate?.name || githubData?.name || githubData?.username || 'New candidate'
  const atsScore = candidate?.ats?.total ?? candidate?.score ?? null

  const submit = () => { if (!q.trim()) return; onSearch?.(q.trim()); setQ('') }

  const handleFile = async (file) => {
    if (!file) return
    setResumeLoading(true); setErr(null)
    try {
      const text = await extractResumeText(file)
      if (!text || text.length < 30) throw new Error('Resume appears empty or unreadable')
      onFileLoad(text, file.name)
    } catch (e) { setErr(e.message || 'Failed to parse resume') } finally { setResumeLoading(false) }
  }

  const handleGitHub = async (e) => {
    e.preventDefault()
    if (!githubInput.trim()) return
    setGithubLoading(true); setErr(null)
    try {
      const data = await fetchGitHubProfile(githubInput.trim())
      onGitHubLoad(data); setGithubInput(''); setShowGithub(false)
    } catch (e2) { setErr(e2.message || 'Failed to connect GitHub') } finally { setGithubLoading(false) }
  }

  return (
    <header className="command-bar">
      <div className="cb-candidate">
        <Avatar src={githubData?.avatar} alt={name} initials={initials} className="cb-avatar" />
        <div className="cb-identity">
          <strong>{name}</strong>
          {atsScore != null ? (
            <button className="cb-ats" onClick={candidate?.ats ? onOpenAts : undefined}>ATS {atsScore}</button>
          ) : (
            <span className="cb-sub">No resume yet</span>
          )}
        </div>

        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" hidden onChange={e => handleFile(e.target.files[0])} />
        {candidate ? (
          <span className="cb-badge on"><Check size={12} /> Resume</span>
        ) : (
          <button className="cb-badge" onClick={() => fileRef.current?.click()} disabled={isParsing}>
            {isParsing ? <Loader2 size={12} className="spin" /> : <FileUp size={12} />} Resume
          </button>
        )}
        {githubData ? (
          <button className="cb-badge on" onClick={onGitHubRemove} title="Disconnect"><Check size={12} /> GitHub</button>
        ) : showGithub ? (
          <form className="cb-github-form" onSubmit={handleGitHub}>
            <input autoFocus value={githubInput} onChange={e => setGithubInput(e.target.value)} placeholder="user/repo" onBlur={() => !githubInput && setShowGithub(false)} />
            <button type="submit" disabled={githubLoading}>{githubLoading ? <Loader2 size={12} className="spin" /> : <Check size={12} />}</button>
          </form>
        ) : (
          <button className="cb-badge" onClick={() => setShowGithub(true)}><GitBranch size={12} /> GitHub</button>
        )}
        {err && <span className="cb-error">{err}</span>}
      </div>

      <div className="cb-center">
        <div className="topbar-search">
          <Search size={14} />
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Ask anything about the candidate…" />
        </div>
        <RepoPicker repositories={repositories} selectedRepoName={selectedRepoName} onSelect={onRepositoryChange} disabled={!repositories.length} />
        {branches.length > 0 && (
          <select className="tb-select" value={selectedBranch || ''} onChange={e => onBranchChange?.(e.target.value)}>
            {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        )}
      </div>

      <div className="cb-right">
        <span className="topbar-provider">{activeProvider || 'AI Ready'}</span>
        <button className={voiceActive ? 'icon-btn active' : 'icon-btn'} onClick={onVoice} title="Voice"><Mic size={16} /></button>
        <button className="icon-btn" onClick={onClear} title="New session"><RotateCcw size={16} /></button>
      </div>
    </header>
  )
}
