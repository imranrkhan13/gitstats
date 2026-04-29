import React, { useState, useCallback } from 'react'
import { Landing } from './components/Landing.jsx'
import { Dashboard } from './components/Dashboard.jsx'
import { CompareView } from './components/CompareView.jsx'
import { ShareCard } from './components/ShareCard.jsx'
import { GithubIcon, BackIcon, ExternalIcon } from './components/Icons.jsx'
import { BRAND } from './lib/brand.js'
import { fmt } from './lib/utils.js'

export default function App() {
  const [data, setData]           = useState(null)
  const [showShare, setShowShare] = useState(false)
  const [showCompare, setShowCompare] = useState(false)

  const handleLoad = useCallback((d) => { setData(d); setShowShare(false); setShowCompare(false) }, [])
  const handleBack = useCallback(() => { setData(null); setShowShare(false); setShowCompare(false) }, [])

  if (!data) return <Landing onLoad={handleLoad} />

  const u = data.user

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Sticky top bar ── */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 0, zIndex: 200,
        boxShadow: '0 1px 0 var(--border)',
      }}>
        {/* Logo */}
        <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, fontFamily: 'Inter,sans-serif' }}>
          <div style={{ width: 30, height: 30, background: 'var(--br)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GithubIcon size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--br)', letterSpacing: '-0.025em' }}>{BRAND.appName}</span>
        </button>

        {/* User info */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }}/>
          {u.avatar_url && <img src={u.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border)', flexShrink: 0 }} />}
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name || u.login}</span>
          <span style={{ fontSize: 13, color: 'var(--text3)', whiteSpace: 'nowrap', flexShrink: 0 }}>@{u.login}</span>
          <div style={{ display: 'flex', gap: 14, marginLeft: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(u.followers)}</span> followers
            </span>
            <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{data.nonForkCount}</span> repos
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <a
            href={`https://github.com/${u.login}`}
            target="_blank" rel="noopener noreferrer"
            style={{ height: 32, padding: '0 12px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
          >
            <ExternalIcon size={11} color="var(--text2)" /> GitHub
          </a>
          <button
            onClick={handleBack}
            style={{ height: 32, padding: '0 12px', border: 'none', background: 'none', fontSize: 12, fontWeight: 600, color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter,sans-serif' }}
          >
            <BackIcon size={13} color="var(--text3)" /> Back
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px' }}>
        {showCompare && (
          <div style={{ paddingTop: 20 }}>
            <CompareView data1={data} onClose={() => setShowCompare(false)} />
          </div>
        )}
      </div>

      <Dashboard
        data={data}
        onShare={() => setShowShare(true)}
        onCompare={() => setShowCompare(v => !v)}
      />

      <ShareCard
        data={data}
        show={showShare}
        onClose={() => setShowShare(false)}
      />
    </div>
  )
}
