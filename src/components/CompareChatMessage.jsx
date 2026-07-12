import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Check, Crown, Minus } from 'lucide-react'

export function CompareTypingIndicator() {
  return (
    <div className="cc-row cc-row-ai">
      <div className="cc-avatar">RI</div>
      <div className="cc-typing">
        {[0, 1, 2].map(i => <span key={i} style={{ animationDelay: `${i * 0.18}s` }} />)}
      </div>
    </div>
  )
}

export function CompareUserMessage({ text }) {
  return (
    <motion.div className="cc-row cc-row-user" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="cc-user-bubble">{text}</div>
      <div className="cc-avatar cc-avatar-user">U</div>
    </motion.div>
  )
}

function DimensionRow({ dim, candidateNames }) {
  const isTie = !dim.leader || dim.leader.toLowerCase() === 'tie'
  return (
    <div className="cc-dim-row">
      <div className="cc-dim-head">
        <span className="cc-dim-label">{dim.label}</span>
        {isTie ? (
          <span className="cc-dim-winner tie"><Minus size={11} /> Tie</span>
        ) : (
          <span className="cc-dim-winner"><Crown size={11} /> {dim.leader}</span>
        )}
      </div>
      {candidateNames.length === 2 && !isTie && (
        <div className="cc-dim-bar">
          <div className={`cc-dim-bar-side ${dim.leader === candidateNames[0] ? 'lead' : ''}`}>{candidateNames[0]}</div>
          <ArrowRight size={12} className="cc-dim-bar-arrow" style={{ transform: dim.leader === candidateNames[0] ? 'rotate(180deg)' : 'none' }} />
          <div className={`cc-dim-bar-side ${dim.leader === candidateNames[1] ? 'lead' : ''}`}>{candidateNames[1]}</div>
        </div>
      )}
      {dim.note && <p className="cc-dim-note">{dim.note}</p>}
    </div>
  )
}

export default function CompareChatMessage({ msg, candidateNames = [] }) {
  const [copied, setCopied] = useState(false)
  const { parsed, provider } = msg

  const copy = () => {
    const text = parsed.freeText || [parsed.verdict, ...parsed.dimensions.map(d => `${d.label}: ${d.leader} — ${d.note}`)].join('\n')
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const isError = parsed.error

  return (
    <motion.div className="cc-row cc-row-ai" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <div className="cc-avatar">RI</div>
      <article className={isError ? 'cc-card error' : 'cc-card'}>
        <header className="cc-card-head">
          <span className="cc-card-kicker">Head-to-head</span>
          <div className="cc-card-actions">
            {provider && <span>{provider}</span>}
            <button onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </header>

        {parsed.freeText ? (
          <p className="cc-freetext">{parsed.freeText}</p>
        ) : (
          <>
            {parsed.verdict && (
              <div className="cc-verdict">
                <Crown size={15} />
                <div>
                  <div className="cc-verdict-label">{parsed.winner ? `${parsed.winner} comes out ahead` : 'Verdict'}</div>
                  <div className="cc-verdict-text">{parsed.verdict}</div>
                </div>
              </div>
            )}

            {parsed.dimensions.length > 0 && (
              <div className="cc-dims">
                {parsed.dimensions.map((d, i) => <DimensionRow key={`${d.label}-${i}`} dim={d} candidateNames={candidateNames} />)}
              </div>
            )}

            {parsed.risks.length > 0 && (
              <div className="cc-risks">
                <div className="cc-risks-title"><AlertTriangle size={12} /> Risks to probe</div>
                <ul>{parsed.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            )}

            {parsed.recommendation && (
              <div className="cc-recommendation">
                <Check size={13} /> <span>{parsed.recommendation}</span>
              </div>
            )}
          </>
        )}

        <div className="cc-confidence">
          <div><div style={{ width: `${Math.round((parsed.confidence || 0) * 100)}%` }} /></div>
          <span>{Math.round((parsed.confidence || 0) * 100)}% confidence</span>
        </div>
      </article>
    </motion.div>
  )
}
