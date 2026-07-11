// CommandPalette.jsx — Cmd/Ctrl+K quick-nav, in the spirit of Linear/Raycast.
// Jump between dashboard tabs, jump straight to a repository's Showcase,
// or trigger Share/Wrapped/Compare/Roast — all things that already exist,
// this just gives a fast keyboard-first way to reach them.
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchIcon } from './Icons.jsx'

export function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(c => c.label.toLowerCase().includes(q) || c.group?.toLowerCase().includes(q))
  }, [query, commands])

  useEffect(() => { if (open) { setQuery(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30) } }, [open])
  useEffect(() => { setActive(0) }, [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(filtered.length - 1, a + 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)) }
      if (e.key === 'Enter' && filtered[active]) { filtered[active].run(); onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, active, onClose])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(10,5,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,0.35)', overflow: 'hidden', border: '1px solid var(--border)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <SearchIcon size={15} color="var(--text4)" />
            <input
              ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Jump to a tab, repo, or action…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--text)', fontFamily: 'Inter,sans-serif' }}
            />
            <span style={{ fontSize: 11, color: 'var(--text4)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px' }}>esc</span>
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto', padding: '6px' }}>
            {filtered.length === 0 && <div style={{ padding: '16px', fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>No matches</div>}
            {filtered.map((c, i) => (
              <button key={c.id} onClick={() => { c.run(); onClose() }} onMouseEnter={() => setActive(i)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  background: active === i ? 'var(--bg2)' : 'transparent',
                }}>
                <span style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 600 }}>{c.label}</span>
                {c.group && <span style={{ fontSize: 11, color: 'var(--text4)' }}>{c.group}</span>}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
