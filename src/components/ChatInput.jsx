import React, { useState, useRef } from 'react'

const PLACEHOLDERS = [
  'Ask about skills, experience, or fit…',
  'Try: Is this candidate senior-level?',
  'Try: What gaps should I probe in the interview?',
  'Try: Compare to a typical 5-year engineer',
]

export default function ChatInput({ onSend, disabled, placeholder }) {
  const [val,     setVal]     = useState('')
  const [focused, setFocused] = useState(false)
  const [phIdx]               = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length))
  const ref = useRef()

  const resize = () => {
    const el = ref.current; if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 130) + 'px'
  }

  const send = () => {
    const q = val.trim(); if (!q || disabled) return
    onSend(q); setVal('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  const active = !disabled && val.trim().length > 0
  const chars  = val.length
  const near   = chars > 400

  return (
    <div style={{ padding:'12px 20px 14px', background:'var(--white)', borderTop:'1px solid var(--gray-200)', flexShrink:0 }}>
      <div style={{
        display:'flex', alignItems:'flex-end', gap:8,
        background: focused ? 'var(--white)' : 'var(--gray-50)',
        border:`1.5px solid ${focused ? 'var(--brown-400)' : 'var(--gray-200)'}`,
        borderRadius:'var(--r20)', padding:'9px 9px 9px 16px',
        transition:'border-color 0.15s, background 0.15s',
      }}>
        <textarea
          ref={ref} rows={1} value={val} disabled={disabled}
          onChange={e => { setVal(e.target.value); resize() }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || PLACEHOLDERS[phIdx]}
          style={{
            flex:1, border:'none', background:'transparent',
            fontFamily:'var(--font)', fontSize:13.5,
            color: disabled ? 'var(--gray-300)' : 'var(--brown-900)',
            outline:'none', resize:'none', lineHeight:1.55, maxHeight:130, padding:0,
          }}
        />
        <button onClick={send} disabled={!active}
          style={{
            width:34, height:34, borderRadius:'50%', border:'none',
            background: active ? 'var(--brown-800)' : 'var(--gray-200)',
            cursor: active ? 'pointer' : 'default',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, transition:'background 0.15s',
          }}
          onMouseEnter={e => { if (active) e.currentTarget.style.background='var(--brown-700)' }}
          onMouseLeave={e => { if (active) e.currentTarget.style.background='var(--brown-800)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={active ? 'var(--brown-100)' : 'var(--gray-400)'}
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
        <span style={{ fontSize:10, color:'var(--gray-400)', letterSpacing:'0.01em' }}>
          Enter to send · Shift+Enter for new line
        </span>
        {near && <span style={{ fontSize:10, color: chars>480?'#ef4444':'var(--gray-400)' }}>{chars}/500</span>}
      </div>
    </div>
  )
}
