import React, { useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Loader2, UploadCloud, X } from 'lucide-react'
import { extractResumeText } from '../utils/pdfExtractor'
import { parseResume } from '../utils/resumeParser'

// Cheap, deterministic JD-fit score — no AI calls per resume, so screening
// 30+ resumes stays instant and free. Just how many of the candidate's
// detected skills actually appear in the JD text.
function jdMatchScore(candidate, jdText) {
  if (!jdText?.trim() || !candidate?.skills?.length) return null
  const jd = jdText.toLowerCase()
  const hits = candidate.skills.filter(s => jd.includes(s.toLowerCase()))
  return Math.round((hits.length / candidate.skills.length) * 100)
}

export default function ScreenPanel({ onOpenCandidate }) {
  const fileRef = useRef(null)
  const [jd, setJd] = useState('')
  const [rows, setRows] = useState([]) // { id, fileName, candidate, resumeText, status }
  const [sortKey, setSortKey] = useState('ats')
  const [sortDir, setSortDir] = useState('desc')

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return

    const pending = files.map(f => ({ id: crypto.randomUUID(), fileName: f.name, candidate: null, resumeText: '', status: 'loading' }))
    setRows(prev => [...prev, ...pending])

    files.forEach(async (file, i) => {
      const id = pending[i].id
      try {
        const text = await extractResumeText(file)
        const candidate = await parseResume(text, file.name)
        setRows(prev => prev.map(r => r.id === id ? { ...r, candidate, resumeText: text, status: 'done' } : r))
      } catch (err) {
        setRows(prev => prev.map(r => r.id === id ? { ...r, status: 'error', error: err.message } : r))
      }
    })
  }

  const removeRow = (id) => setRows(prev => prev.filter(r => r.id !== id))

  const sorted = useMemo(() => {
    const withScores = rows.map(r => ({ ...r, match: r.candidate ? jdMatchScore(r.candidate, jd) : null }))
    const key = sortKey
    const get = (r) => {
      if (key === 'ats') return r.candidate?.ats?.total ?? -1
      if (key === 'match') return r.match ?? -1
      if (key === 'exp') return r.candidate?.expYears ?? -1
      if (key === 'name') return (r.candidate?.name || r.fileName || '').toLowerCase()
      return 0
    }
    return withScores.sort((a, b) => {
      const av = get(a), bv = get(b)
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rows, jd, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const Th = ({ label, k }) => (
    <th onClick={() => toggleSort(k)} className={sortKey === k ? 'active' : ''}>
      {label} {sortKey === k && (sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
    </th>
  )

  const loadedCount = rows.filter(r => r.status === 'done').length

  return (
    <div className="screen-view">
      <div className="compare-head">
        <h1>Screen resumes</h1>
        <p>Upload a batch of resumes, optionally paste a job description, and rank everyone by ATS score and JD fit — a fast pass before deciding who's worth a closer look.</p>
      </div>

      <div className="compare-jd-card">
        <label className="compare-jd-label">Job description <span>— optional, adds a Match% column scored against it</span></label>
        <textarea className="compare-jd-textarea" value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the role or job description here…" rows={jd ? 5 : 2} />
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" multiple hidden onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />
      <button className="screen-upload-zone" onClick={() => fileRef.current?.click()}>
        <UploadCloud size={20} />
        <span>Click to upload resumes — select multiple files at once</span>
      </button>

      {rows.length > 0 && (
        <div className="screen-table-wrap">
          <div className="screen-table-meta">{loadedCount} of {rows.length} parsed</div>
          <table className="screen-table">
            <thead>
              <tr>
                <Th label="Candidate" k="name" />
                <Th label="ATS" k="ats" />
                {jd.trim() && <Th label="Match" k="match" />}
                <Th label="Experience" k="exp" />
                <th>Top skills</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="screen-name">{r.candidate?.name || r.fileName}</div>
                    <div className="screen-role">{r.candidate?.role || (r.status === 'loading' ? 'Parsing…' : r.status === 'error' ? (r.error || 'Failed to parse') : '')}</div>
                  </td>
                  <td className="screen-num">{r.candidate?.ats?.total ?? (r.status === 'loading' ? <Loader2 size={13} className="spin" /> : '—')}</td>
                  {jd.trim() && <td className="screen-num">{r.match != null ? `${r.match}%` : '—'}</td>}
                  <td className="screen-num">{r.candidate?.expYears != null ? `${r.candidate.expYears}y` : '—'}</td>
                  <td>
                    <div className="tag-row">{(r.candidate?.skills || []).slice(0, 4).map(s => <span key={s} className="code-tag">{s}</span>)}</div>
                  </td>
                  <td className="screen-actions">
                    {r.candidate && (
                      <button className="mini-btn" onClick={() => onOpenCandidate(r)} title="Open in workspace"><ExternalLink size={12} /></button>
                    )}
                    <button className="mini-btn" onClick={() => removeRow(r.id)} title="Remove"><X size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
