import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const PARTS = [
  { key: 'skills', label: 'Skills', max: 35, tip: 'List more relevant, in-demand technical skills explicitly.' },
  { key: 'experience', label: 'Experience', max: 25, tip: 'Add clear date ranges for each role to reflect total years.' },
  { key: 'education', label: 'Education', max: 15, tip: 'State your highest degree and field clearly.' },
  { key: 'certs', label: 'Certifications', max: 10, tip: 'Add recognised certifications (e.g. cloud, security).' },
  { key: 'contact', label: 'Contact', max: 10, tip: 'Include email, phone, LinkedIn and GitHub links.' },
  { key: 'content', label: 'Content', max: 5, tip: 'Add more than one role and clear education details.' },
]

export default function AtsModal({ candidate, onClose }) {
  const ats = candidate?.ats
  const breakdown = ats?.breakdown || {}
  const score = ats?.total ?? candidate?.score ?? 0

  const rows = PARTS.map(p => ({ ...p, pts: breakdown[p.key] ?? 0, pct: Math.round(((breakdown[p.key] ?? 0) / p.max) * 100) }))
  const strengths = rows.filter(r => r.pct >= 80)
  const weaknesses = rows.filter(r => r.pct < 50)
  const recommendations = weaknesses.map(r => r.tip)
  const gap = rows.reduce((sum, r) => sum + (r.max - r.pts), 0)
  const potential = Math.min(100, score + gap)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="ats-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>

        <div className="ats-modal-head">
          <div>
            <div className="ats-modal-kicker">ATS analysis</div>
            <h2>{score}<em>/100</em></h2>
            <span className="ats-modal-label">{ats?.label || '—'}</span>
          </div>
          <div className="ats-potential">
            <span>Potential</span>
            <strong>{potential}</strong>
          </div>
        </div>

        <div className="ats-modal-section">
          <div className="ats-modal-title">Breakdown</div>
          {rows.map(r => (
            <div className="ats-part" key={r.key}>
              <span className="ats-part-label">{r.label}</span>
              <span className="ats-part-bar"><i style={{ width: `${r.pct}%` }} /></span>
              <span className="ats-part-value">{r.pts}<em>/{r.max}</em></span>
            </div>
          ))}
        </div>

        <div className="ats-modal-grid">
          <div>
            <div className="ats-modal-title">Strengths</div>
            {strengths.length ? (
              <ul className="ats-bullets good">{strengths.map(s => <li key={s.key}>{s.label} — {s.pts}/{s.max}</li>)}</ul>
            ) : <p className="aa-muted">No component is near its maximum yet.</p>}
          </div>
          <div>
            <div className="ats-modal-title">Weaknesses</div>
            {weaknesses.length ? (
              <ul className="ats-bullets bad">{weaknesses.map(w => <li key={w.key}>{w.label} — {w.pts}/{w.max}</li>)}</ul>
            ) : <p className="aa-muted">No components below 50%.</p>}
          </div>
        </div>

        <div className="ats-modal-section">
          <div className="ats-modal-title">Recommendations</div>
          {recommendations.length ? (
            <ul className="ats-bullets">{recommendations.map(r => <li key={r}>{r}</li>)}</ul>
          ) : <p className="aa-muted">This resume already scores well across all components.</p>}
        </div>

        <p className="ats-modal-note">All values are derived from the ATS engine breakdown for this resume — no scores are invented.</p>
      </motion.div>
    </div>
  )
}
