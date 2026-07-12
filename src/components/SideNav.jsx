import React from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, ListFilter, MessagesSquare, Settings, Users } from 'lucide-react'

const ITEMS = [
  ['overview', 'Overview', LayoutDashboard],
  ['interview', 'Interview', MessagesSquare],
  ['compare', 'Compare', Users],
  ['screen', 'Screen', ListFilter],
  ['settings', 'Settings', Settings],
]

export default function SideNav({ view, setView }) {
  return (
    <aside className="sidenav">
      <div className="sidenav-brand" title="ResumeIQ">RI</div>
      <nav className="sidenav-items">
        {ITEMS.map(([id, label, Icon]) => {
          const active = view === id
          return (
            <button key={id} className={active ? 'nav-item active' : 'nav-item'} onClick={() => setView(id)} title={label} aria-label={label}>
              {active && <motion.span layoutId="nav-active" className="nav-item-bg" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
              <Icon size={19} />
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
