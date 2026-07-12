import React, { useMemo, useRef, useState } from 'react'
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, Box, Braces, CheckCircle2, Database, File, FileCode, FileCog, FileText, FileType2, FolderClosed, FolderOpen,
  GitBranch, Hash, Image, Lock, MessageCircleQuestion, Network, Rocket, Search, Shield, Sparkles, Star, Terminal, TestTube2,
} from 'lucide-react'
import { fileColor, fileType, getRepoFile, repoStats, repoSummary, repoInterviewQuestions } from '../utils/repoAnalysis'

const TABS = ['Overview', 'Architecture', 'README', 'Security', 'Evaluate']

const SCORE_DIMS = [
  ['communication', 'Communication'],
  ['problemSolving', 'Problem Solving'],
  ['codeQuality', 'Code Quality'],
  ['architecture', 'Architecture'],
  ['debugging', 'Debugging'],
]

function verdictFor(avg) {
  if (!avg) return { verdict: 'Not scored yet', tone: 'none' }
  if (avg >= 4.5) return { verdict: 'Strong Hire', tone: 'sh' }
  if (avg >= 3.8) return { verdict: 'Hire', tone: 'h' }
  if (avg >= 3.0) return { verdict: 'Leaning Hire', tone: 'lh' }
  if (avg >= 2.0) return { verdict: 'Leaning No Hire', tone: 'lnh' }
  return { verdict: 'No Hire', tone: 'nh' }
}

function Rating({ value, onChange }) {
  return (
    <div className="rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} className={n <= value ? 'rating-dot on' : 'rating-dot'} onClick={() => onChange(n === value ? 0 : n)} aria-label={`${n} of 5`} />
      ))}
    </div>
  )
}

function Scorecard({ scores, setScores, notes, setNotes }) {
  const rated = Object.values(scores).filter(v => v > 0)
  const avg = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : 0
  const { verdict, tone } = verdictFor(avg)
  return (
    <div className="scorecard">
      <div className="section-title">Candidate evaluation</div>
      {SCORE_DIMS.map(([key, label]) => (
        <div className="score-row" key={key}>
          <span className="score-label">{label}</span>
          <Rating value={scores[key]} onChange={(v) => setScores(s => ({ ...s, [key]: v }))} />
        </div>
      ))}
      <div className="score-row overall">
        <span className="score-label">Overall</span>
        <span className="score-overall">{avg ? avg.toFixed(1) : '—'}<em>/5</em></span>
      </div>

      <div className="section-title" style={{ marginTop: 22 }}>Evidence</div>
      <textarea className="score-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes and evidence for this recommendation…" rows={3} />

      <div className="section-title" style={{ marginTop: 22 }}>Hiring recommendation</div>
      <div className={`reco-badge big ${tone}`}>{verdict}</div>
    </div>
  )
}

/* ── Architecture map (React Flow) ── */
const PROJECT_AREAS = [
  { id: 'app', label: 'App', icon: Box, matcher: /^(src\/)?(app|main|index|App)\b|vite|package/i, color: '#6b4226' },
  { id: 'frontend', label: 'Frontend', icon: FileCode, matcher: /component|page|view|ui|jsx|tsx|css/i, color: '#8a5a3b' },
  { id: 'hooks', label: 'Hooks', icon: Braces, matcher: /hooks?\//i, color: '#9a6b52' },
  { id: 'utils', label: 'Utils', icon: Braces, matcher: /utils?|lib|helpers?/i, color: '#6f7d6a' },
  { id: 'services', label: 'API', icon: Network, matcher: /api|service|client|fetch|github|ai/i, color: '#5f7c88' },
  { id: 'security', label: 'Security', icon: Shield, matcher: /auth|token|secret|env|security/i, color: '#a35b4f' },
  { id: 'data', label: 'Database', icon: Database, matcher: /db|data|model|schema|store/i, color: '#6b8461' },
  { id: 'testing', label: 'Testing', icon: TestTube2, matcher: /test|spec|__tests__/i, color: '#9a7b52' },
  { id: 'deploy', label: 'Deploy', icon: Rocket, matcher: /deploy|docker|vercel|netlify|ci|workflow|config/i, color: '#7c766e' },
]
const EDGE_PAIRS = [['app', 'frontend'], ['frontend', 'hooks'], ['hooks', 'utils'], ['utils', 'services'], ['services', 'data'], ['services', 'security'], ['app', 'deploy'], ['app', 'testing']]

function buildProjectMap(files = []) {
  const areas = PROJECT_AREAS.map(a => ({ ...a, files: files.filter(f => a.matcher.test(f.path)).slice(0, 12) })).filter(a => a.files.length || a.id === 'app')
  const graph = new dagre.graphlib.Graph()
  graph.setGraph({ rankdir: 'TB', nodesep: 30, ranksep: 52 })
  graph.setDefaultEdgeLabel(() => ({}))
  const nodes = areas.map(a => { graph.setNode(a.id, { width: 140, height: 48 }); return { id: a.id, data: { label: a.label, count: a.files.length, icon: a.icon, color: a.color }, type: 'projectArea', position: { x: 0, y: 0 } } })
  const edges = EDGE_PAIRS.filter(([s, t]) => nodes.some(n => n.id === s) && nodes.some(n => n.id === t)).map(([s, t]) => { graph.setEdge(s, t); return { id: `${s}-${t}`, source: s, target: t, style: { stroke: '#ece7e2', strokeWidth: 1.2 } } })
  dagre.layout(graph)
  nodes.forEach(n => { const p = graph.node(n.id); n.position = { x: p.x - 70, y: p.y - 24 } })
  return { nodes, edges }
}

function ProjectAreaNode({ data }) {
  const Icon = data.icon
  return (
    <div className={data.dim ? 'project-node dim' : 'project-node'} style={{ '--node-color': data.color }}>
      <Icon size={15} /><div><strong>{data.label}</strong><span>{data.count} files</span></div>
    </div>
  )
}
const nodeTypes = { projectArea: ProjectAreaNode }

function ArchitectureGraph({ files }) {
  const [activeArea, setActiveArea] = useState(null)
  const base = useMemo(() => buildProjectMap(files), [files])
  const related = useMemo(() => {
    if (!activeArea) return null
    const set = new Set([activeArea])
    base.edges.forEach(e => { if (e.source === activeArea) set.add(e.target); if (e.target === activeArea) set.add(e.source) })
    return set
  }, [activeArea, base.edges])
  const nodes = useMemo(() => base.nodes.map(n => ({ ...n, data: { ...n.data, dim: related ? !related.has(n.id) : false } })), [base.nodes, related])
  const edges = useMemo(() => base.edges.map(e => {
    const on = related && related.has(e.source) && related.has(e.target)
    return { ...e, animated: !!on, style: { stroke: on ? '#6b4226' : '#ece7e2', strokeWidth: on ? 1.6 : 1.2, opacity: related && !on ? 0.35 : 1 } }
  }), [base.edges, related])

  if (!files.length) return <div className="context-empty">Connect a repository to generate the architecture graph.</div>
  return (
    <div className="arch-wrap">
      <p className="arch-hint">Click a node to highlight connected areas. Scroll to zoom.</p>
      <div className="arch-graph">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.3} maxZoom={1.8}
          onNodeClick={(_, n) => setActiveArea(a => (a === n.id ? null : n.id))} onPaneClick={() => setActiveArea(null)} proOptions={{ hideAttribution: true }}>
          <Background gap={20} color="#f2ede8" />
          <Controls showInteractive={false} />
          <MiniMap zoomable pannable nodeColor={n => n.data?.color || '#c7bdb0'} maskColor="rgba(250,248,246,0.75)" />
        </ReactFlow>
      </div>
    </div>
  )
}

/* ── VSCode-style explorer ── */
function fileIcon(path) {
  const ext = path.includes('.') ? path.split('.').pop().toLowerCase() : ''
  if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'vue', 'svelte'].includes(ext)) return FileCode
  if (ext === 'json') return Braces
  if (['css', 'scss', 'less'].includes(ext)) return Hash
  if (['md', 'mdx', 'txt'].includes(ext)) return FileText
  if (['html', 'xml', 'svg'].includes(ext)) return FileType2
  if (['yml', 'yaml', 'toml', 'env', 'lock'].includes(ext) || /config/i.test(path)) return FileCog
  if (['sh', 'bash', 'zsh'].includes(ext)) return Terminal
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'].includes(ext)) return Image
  return File
}

function buildTree(files = []) {
  const root = { name: '', path: '', type: 'folder', children: new Map() }
  files.forEach(file => {
    const parts = file.path.split('/')
    let cur = root
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join('/')
      if (!cur.children.has(part)) cur.children.set(part, { name: part, path, type: i === parts.length - 1 ? 'file' : 'folder', children: new Map() })
      cur = cur.children.get(part)
    })
  })
  return root
}
function sortNodes(nodes) {
  return [...nodes].sort((a, b) => (a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name)))
}

function TreeNode({ node, level, expanded, onToggle, selectedPath, onSelectFile }) {
  const isFolder = node.type === 'folder'
  const isOpen = expanded.has(node.path)
  const active = node.path === selectedPath
  const children = sortNodes([...node.children.values()])
  const Icon = isFolder ? (isOpen ? FolderOpen : FolderClosed) : fileIcon(node.path)
  return (
    <div>
      <button className={`tree-row${active ? ' active' : ''}`} style={{ paddingLeft: 8 + level * 14 }}
        onClick={() => isFolder ? onToggle(node.path) : onSelectFile?.(node.path)}
        data-file={!isFolder} aria-current={active ? 'true' : undefined}>
        <span className="tree-caret">{isFolder ? (isOpen ? '▾' : '▸') : ''}</span>
        <Icon size={14} className="tree-file-icon" style={!isFolder ? { color: fileColor(node.path) } : undefined} />
        <span className="tree-name">{node.name}</span>
      </button>
      {isFolder && isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>
          {children.map(c => <TreeNode key={c.path} node={c} level={level + 1} expanded={expanded} onToggle={onToggle} selectedPath={selectedPath} onSelectFile={onSelectFile} />)}
        </motion.div>
      )}
    </div>
  )
}

/* ── Overview insights ── */
function Stars({ value }) {
  return <span className="stars">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className={i <= value ? '' : 'star-off'} fill={i <= value ? 'currentColor' : 'none'} />)}</span>
}
const clamp = n => Math.max(1, Math.min(5, Math.round(n)))
function computeInsights(repoIndex, githubData) {
  const files = repoIndex?.files || []
  const count = files.length || 1
  const edges = repoIndex?.graph?.edges?.length || 0
  const readmeLen = (githubData?.targetRepo?.readme || githubData?.readmePreview || '').length
  const hasReadme = readmeLen > 0 || files.some(f => /readme/i.test(f.path))
  const testCount = files.filter(f => /(\.test\.|\.spec\.|__tests__|\/tests?\/)/i.test(f.path)).length
  const hasDeploy = files.some(f => /docker|vercel|netlify|\.github\/workflows|(^|\/)ci|deploy/i.test(f.path))
  const exposedEnv = files.some(f => /(^|\/)\.env/i.test(f.path))
  const documentation = clamp(readmeLen > 1200 ? 5 : readmeLen > 300 ? 4 : hasReadme ? 3 : 2)
  const architecture = clamp(2 + (edges / count) * 6)
  const testing = clamp(testCount === 0 ? 1 : 1 + (testCount / count) * 20)
  const security = clamp(exposedEnv ? 3 : 4)
  const deployment = clamp(hasDeploy ? 5 : 3)
  const health = clamp((documentation + architecture + testing + security + deployment) / 5)
  return [
    { label: 'Repository health', value: health, strong: true },
    { label: 'Documentation', value: documentation },
    { label: 'Architecture', value: architecture },
    { label: 'Testing', value: testing },
    { label: 'Security', value: security },
    { label: 'Deployment', value: deployment },
  ]
}
const LANG_COLORS = { JavaScript: '#d6b656', TypeScript: '#4a7cb5', Python: '#4b7a9e', HTML: '#c05a3a', CSS: '#7a5aa0', Java: '#9a6a3a', Go: '#4aa6c0', Ruby: '#a03a3a', Shell: '#7aa05a' }

export default function RepoIntelligencePanel({ repoIndex, githubData, loading, error, selectedPath, onSelectFile, onAsk }) {
  const [tab, setTab] = useState('Overview')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(() => new Set(['src', 'src/components', 'src/hooks', 'src/utils']))
  const treeRef = useRef(null)
  const [scores, setScores] = useState({ communication: 0, problemSolving: 0, codeQuality: 0, architecture: 0, debugging: 0 })
  const [notes, setNotes] = useState('')

  const stats = repoStats(repoIndex)
  const summary = useMemo(() => repoSummary(repoIndex, githubData), [repoIndex, githubData])
  const repoQs = useMemo(() => repoInterviewQuestions(repoIndex, githubData), [repoIndex, githubData])
  const filteredFiles = useMemo(() => {
    const files = repoIndex?.files || []
    const q = query.trim().toLowerCase()
    return q ? files.filter(f => f.path.toLowerCase().includes(q)) : files
  }, [repoIndex, query])
  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles])
  const topLevel = sortNodes([...tree.children.values()])
  const toggleFolder = (path) => setExpanded(prev => { const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n })
  const readme = githubData?.targetRepo?.readme || githubData?.readmePreview || ''

  const onTreeKeyDown = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const rows = Array.from(treeRef.current?.querySelectorAll('.tree-row') || [])
    if (!rows.length) return
    e.preventDefault()
    const idx = rows.indexOf(document.activeElement)
    const next = e.key === 'ArrowDown' ? Math.min(rows.length - 1, idx + 1) : Math.max(0, idx - 1)
    rows[next < 0 ? 0 : next]?.focus()
  }

  const renderTab = () => {
    if (tab === 'Overview') {
      if (loading) return <div className="skeleton-list">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-row" />)}</div>
      if (!repoIndex || !summary) {
        return <div className="context-empty">{githubData ? 'Select a repository to see its summary, stack, and generated interview questions.' : 'Connect GitHub and select a repository to see a full repository summary.'}</div>
      }
      return (
        <div className="repo-summary">
          <div className="rs-purpose">
            <div className="rs-name">{summary.name}</div>
            <p>{summary.purpose}</p>
          </div>

          {summary.stack.length > 0 && (
            <div className="rs-block"><div className="section-title">Tech stack</div><div className="tag-row">{summary.stack.map(s => <span key={s} className="code-tag">{s}</span>)}</div></div>
          )}

          <div className="rs-facts">
            <div><span>Lines of code</span><strong>{summary.loc.toLocaleString()}</strong></div>
            <div><span>Files</span><strong>{summary.files}</strong></div>
            <div><span>Complexity</span><strong>{summary.complexity}</strong></div>
            <div><span>Maturity</span><strong>{summary.maturity}</strong></div>
          </div>

          <div className="rs-block">
            <div className="section-title">Entry point</div>
            <code className="rs-entry">{summary.entry || '—'}</code>
          </div>

          <div className="rs-block">
            <div className="section-title">Health check</div>
            <div className="health-grid">
              {[
                ['Testing', summary.testing, TestTube2],
                ['Deployment', summary.deployment, Rocket],
                ['Security', summary.security, Lock],
              ].map(([label, value, Icon]) => {
                const ok = !/^no /i.test(value || '')
                return (
                  <div key={label} className={ok ? 'health-item ok' : 'health-item warn'}>
                    <Icon size={14} />
                    <div className="health-item-text">
                      <span className="health-item-label">{label}</span>
                      <span className="health-item-value">{value}</span>
                    </div>
                    {ok ? <CheckCircle2 size={14} className="health-status" /> : <AlertTriangle size={14} className="health-status" />}
                  </div>
                )
              })}
            </div>
          </div>

          {summary.largestFolders.length > 0 && (
            <div className="rs-block">
              <div className="section-title">Largest folders</div>
              <div className="folder-bars">
                {summary.largestFolders.map(f => {
                  const max = summary.largestFolders[0].count || 1
                  return (
                    <div className="folder-bar-row" key={f.name}>
                      <span className="folder-bar-name">{f.name}</span>
                      <span className="folder-bar-track"><i style={{ width: `${Math.max(8, (f.count / max) * 100)}%` }} /></span>
                      <span className="folder-bar-count">{f.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {(githubData?.languageStats || []).length > 0 && (
            <div className="rs-block"><div className="section-title">Languages</div><div className="repo-langs">{githubData.languageStats.slice(0, 6).map(l => <span className="repo-lang" key={l.name}><i style={{ background: LANG_COLORS[l.name] || '#b8ada0' }} />{l.name} {l.percentage}%</span>)}</div></div>
          )}

          {repoQs.length > 0 && onAsk && (
            <div className="rs-block">
              <div className="section-title">Interview questions from this repo</div>
              <div className="rs-questions">{repoQs.map(q => <button key={q} className="rs-question" onClick={() => onAsk(q)}><MessageCircleQuestion size={13} /> {q}</button>)}</div>
            </div>
          )}

          {onAsk && (
            <div className="rs-block">
              <div className="section-title">Generate</div>
              <div className="gen-actions">
                <button className="gen-btn" onClick={() => onAsk('Suggest a practical coding task for this candidate based on this repository.')}><Sparkles size={13} /> Suggest a coding task</button>
                <button className="gen-btn" onClick={() => onAsk('Based on this repository code, what level and strengths does this candidate demonstrate?')}><Sparkles size={13} /> Assess seniority from the repo</button>
              </div>
            </div>
          )}
        </div>
      )
    }
    if (tab === 'Evaluate') return <Scorecard scores={scores} setScores={setScores} notes={notes} setNotes={setNotes} />
    if (tab === 'Architecture') return <ArchitectureGraph files={repoIndex?.files || []} />
    if (tab === 'README') return <div className="readme-preview">{readme ? readme.slice(0, 4000) : 'README preview appears after connecting a repository.'}</div>
    if (tab === 'Security') return (
      <div className="security-list">
        <span><Lock size={15} /> Check environment and config files for exposed assumptions or secrets.</span>
        <span><Shield size={15} /> Review authentication, token, and API client files first.</span>
        <span><GitBranch size={15} /> Compare the deployment branch against the default branch before shipping.</span>
      </div>
    )
    return null
  }

  return (
    <>
      <div className="context-tabs" role="tablist">
        {TABS.map(name => (
          <button key={name} role="tab" aria-selected={tab === name} className={tab === name ? 'context-tab active' : 'context-tab'} onClick={() => setTab(name)}>{name}</button>
        ))}
      </div>
      <div className="context-body">
        {error && <div className="compact-error">{error}</div>}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} style={{ height: tab === 'Architecture' ? '100%' : 'auto' }}>
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
