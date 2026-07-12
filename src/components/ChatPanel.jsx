import React, { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import ChatMessage, { TypingIndicator } from './ChatMessage'
import ChatInput from './ChatInput'
import EmptyState from './EmptyState'

export default function ChatPanel({
  candidate, githubData, repoIndex, selectedFilePath,
  messages, isLoading, onSend, onCitationClick,
}) {
  const scrollRef = useRef(null)
  const [expanded, setExpanded] = useState(false)

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

  const currentFileLabel = selectedFilePath ? selectedFilePath.split('/').pop() : null
  const placeholder = currentFileLabel
    ? `Ask about ${currentFileLabel}…`
    : repoIndex
      ? `Ask about ${repoIndex.repo}…`
      : 'Ask about the candidate, their code, or fit for a role…'

  return (
    <>
      {expanded && <div className="chat-expand-backdrop" onClick={() => setExpanded(false)} />}
      <aside className={expanded ? 'chat-col expanded' : 'chat-col'}>
        <div className="chat-col-head">
          <span>Conversation</span>
          <button className="chat-expand-btn" onClick={() => setExpanded(v => !v)} title={expanded ? 'Collapse (Esc)' : 'Expand for easier reading'}>
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
        <div className="conversation">
          <div className="messages-scroll" ref={scrollRef}>
            {messages.length === 0 ? (
              <EmptyState onChip={(q) => onSend(q)} hasResume={!!candidate} hasGitHub={!!githubData} candidateName={candidate?.name} />
            ) : (
              <div className="messages-inner">
                {messages.map(msg => (
                  <ChatMessage key={msg.id} msg={msg} onCitationClick={onCitationClick} onAsk={(q) => onSend(q)} />
                ))}
                {isLoading && <TypingIndicator />}
              </div>
            )}
          </div>
          <div className="composer">
            <div className="composer-inner">
              <ChatInput onSend={onSend} disabled={isLoading} placeholder={placeholder} />
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
