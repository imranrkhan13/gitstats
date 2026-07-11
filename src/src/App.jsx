import React, { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Landing } from './components/Landing.jsx'
import { Dashboard } from './components/Dashboard.jsx'
import { CompareView } from './components/CompareView.jsx'
import { ShareCard } from './components/ShareCard.jsx'
import { Wrapped } from './components/Wrapped.jsx'
import { Constellation } from './components/Constellation.jsx'
import { DescribeMe } from './components/DescribeMe.jsx'
import { LoadingExperience } from './components/LoadingExperience.jsx'
import { GithubIcon, BackIcon, ExternalIcon } from './components/Icons.jsx'
import { BRAND } from './lib/brand.js'
import { fmt } from './lib/utils.js'
import { fetchGitHub } from './lib/github.js'

// ── Global responsive stylesheet ──────────────────────────────────────────────
// Mounted once at the app root. Overrides inline-style grids/widths at breakpoints
// without needing to rewrite every component's style={{}} object.
const ResponsiveStyles = () => (
  <style>{`
    .rg2, .rg3 { min-width: 0; }

    @media (max-width: 860px) {
      .rg3 { grid-template-columns: 1fr 1fr !important; }
    }
    @media (max-width: 640px) {
      .rg2, .rg3 { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 380px) {
      .rg2-keep { gap: 5px !important; }
    }
    @media (max-width: 480px) {
      .gs-toptoolbar { padding: 14px 0 16px !important; }
      .gs-toptoolbar button { padding: 0 12px !important; font-size: 12px !important; }
    }
    @media (max-width: 480px) {
      .gs-card { padding: 16px !important; }
      .gs-spotlight { padding: 16px 18px !important; }
      .gs-spotlight-health { text-align: left !important; align-items: flex-start !important; width: 100%; }
      .gs-spotlight-health > div:nth-child(3) { align-items: flex-start !important; }
    }

    .gs-header { padding: 0 12px !important; gap: 8px !important; }
    .gs-header-userinfo { gap: 6px !important; }
    @media (max-width: 700px) {
      .gs-header-stats { display: none !important; }
    }
    @media (max-width: 520px) {
      .gs-header-divider { display: none !important; }
      .gs-header-username { display: none !important; }
      .gs-header-gh-label { display: none !important; }
    }
    @media (max-width: 420px) {
      .gs-header-back-label { display: none !important; }
    }

    .gs-main { padding-left: 12px !important; padding-right: 12px !important; }
    @media (min-width: 480px) {
      .gs-main { padding-left: 20px !important; padding-right: 20px !important; }
    }

    .gs-sharecard, .gs-comparecard {
      width: 420px;
      max-width: 100%;
    }
    @media (max-width: 480px) {
      .gs-sharecard, .gs-comparecard { width: 100% !important; padding: 18px 16px !important; }
    }

    .gs-scroll-x { -webkit-overflow-scrolling: touch; }

    @media (max-width: 480px) {
      .gs-tightgap { gap: 6px !important; }
    }
  `}</style>
)

export default function App() {
  const [data, setData] = useState(null)
  const [showCompare, setShowCompare] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showWrapped, setShowWrapped] = useState(false)
  const [showConstellation, setShowConstellation] = useState(false)
  const [showDescribeMe, setShowDescribeMe] = useState(false)
  const [autoLoading, setAutoLoading] = useState(true)
  const [autoError, setAutoError] = useState('')

  const handleLoad = useCallback((d) => {
    setData(d); setShowCompare(false); setShowShare(false)
    const url = new URL(window.location.href)
    url.searchParams.set('user', d.user.login)
    window.history.replaceState({}, '', url)
  }, [])

  const handleBack = useCallback(() => {
    setData(null); setShowCompare(false); setShowShare(false)
    const url = new URL(window.location.href)
    url.searchParams.delete('user')
    window.history.replaceState({}, '', url)
  }, [])

  // Shared links (`?user=someone`) actually load that profile now — this is
  // what makes "share the link, not just a picture" a real thing rather than
  // a caption promising something the app didn't do.
  React.useEffect(() => {
    const username = new URL(window.location.href).searchParams.get('user')
    if (!username) { setAutoLoading(false); return }
    fetchGitHub(username)
      .then((d) => { setData(d) })
      .catch((e) => setAutoError(e.message))
      .finally(() => setAutoLoading(false))
  }, [])

  if (autoLoading) return (<><ResponsiveStyles /><LoadingExperience username={new URL(window.location.href).searchParams.get('user')} /></>)

  if (!data) return (<><ResponsiveStyles /><Landing onLoad={handleLoad} initialError={autoError} /></>)

  const u = data.user

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <ResponsiveStyles />

      {/* ── Sticky top bar ── */}
      <div className="gs-header" style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 0, zIndex: 200,
        boxShadow: '0 1px 0 var(--border)',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, fontFamily: 'Inter,sans-serif' }}>
          <div style={{ width: 30, height: 30, background: 'var(--br)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GithubIcon size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--br)', letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>{BRAND.appName}</span>
        </button>

        {/* User info */}
        <div className="gs-header-userinfo" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
          <div className="gs-header-divider" style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
          {u.avatar_url && <img src={u.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border)', flexShrink: 0 }} />}
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{u.name || u.login}</span>
          <span className="gs-header-username" style={{ fontSize: 13, color: 'var(--text3)', whiteSpace: 'nowrap', flexShrink: 0 }}>@{u.login}</span>
          <div className="gs-header-stats" style={{ display: 'flex', gap: 14, marginLeft: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(u.followers)}</span> followers
            </span>
            <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{data.nonForkCount}</span> repos
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <a
            href={`https://github.com/${u.login}`}
            target="_blank" rel="noopener noreferrer"
            style={{ height: 32, padding: '0 12px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            <ExternalIcon size={11} color="var(--text2)" /> <span className="gs-header-gh-label">GitHub</span>
          </a>
          <button
            onClick={handleBack}
            style={{ height: 32, padding: '0 12px', border: 'none', background: 'none', fontSize: 12, fontWeight: 600, color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap' }}
          >
            <BackIcon size={13} color="var(--text3)" /> <span className="gs-header-back-label">Back</span>
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="gs-main" style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px' }}>
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
        onWrapped={() => setShowWrapped(true)}
        onConstellation={() => setShowConstellation(true)}
        onDescribeMe={() => setShowDescribeMe(true)}
      />

      <AnimatePresence>
        {showShare && (
          <ShareCard data={data} show={showShare} onClose={() => setShowShare(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWrapped && (
          <Wrapped data={data} onClose={() => setShowWrapped(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConstellation && (
          <Constellation data={data} onClose={() => setShowConstellation(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDescribeMe && (
          <DescribeMe data={data} onClose={() => setShowDescribeMe(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}