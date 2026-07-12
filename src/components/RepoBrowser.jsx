import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Braces, ChevronDown, ChevronRight, File, FileCode, FileCog, FileText, FileType2, FolderClosed, FolderOpen, Hash, Image, Search, Terminal } from 'lucide-react'
import { fileColor } from '../utils/repoAnalysis'

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
  files.forEach(f => {
    const parts = f.path.split('/')
    let cur = root
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join('/')
      if (!cur.children.has(part)) cur.children.set(part, { name: part, path, type: i === parts.length - 1 ? 'file' : 'folder', children: new Map() })
      cur = cur.children.get(part)
    })
  })
  return root
}
const sortNodes = (nodes) => [...nodes].sort((a, b) => (a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name)))

function TreeNode({ node, level, expanded, onToggle, selectedPath, onSelectFile }) {
  const isFolder = node.type === 'folder'
  const isOpen = expanded.has(node.path)
  const active = node.path === selectedPath
  const children = sortNodes([...node.children.values()])
  const Icon = isFolder ? (isOpen ? FolderOpen : FolderClosed) : fileIcon(node.path)
  return (
    <div>
      <button className={`tree-row${active ? ' active' : ''}`} style={{ paddingLeft: 6 + level * 13 }}
        onClick={() => isFolder ? onToggle(node.path) : onSelectFile?.(node.path)}>
        <span className="tree-caret">{isFolder ? (isOpen ? '▾' : '▸') : ''}</span>
        <Icon size={13} className="tree-file-icon" style={!isFolder ? { color: fileColor(node.path) } : undefined} />
        <span className="tree-name">{node.name}</span>
      </button>
      {isFolder && isOpen && children.map(c => (
        <TreeNode key={c.path} node={c} level={level + 1} expanded={expanded} onToggle={onToggle} selectedPath={selectedPath} onSelectFile={onSelectFile} />
      ))}
    </div>
  )
}

export default function RepoBrowser({ repoIndex, loading, selectedPath, onSelectFile }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(() => new Set(['src', 'src/components']))

  const files = repoIndex?.files || []
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? files.filter(f => f.path.toLowerCase().includes(q)) : files
  }, [files, query])
  const tree = useMemo(() => buildTree(filtered), [filtered])
  const topLevel = sortNodes([...tree.children.values()])
  const toggle = (p) => setExpanded(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n })

  const count = files.length
  const label = repoIndex ? `${repoIndex.repo}` : 'Repository'

  return (
    <div className="repo-browser">
      <button className="repo-browser-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="rb-title">Files</span>
        <span className="rb-meta">{loading ? 'indexing…' : count ? `${label} · ${count}` : 'none'}</span>
      </button>
      {open && (
        <motion.div className="repo-browser-body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.18 }}>
          <label className="rb-search"><Search size={13} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search files" /></label>
          <div className="rb-tree">
            {!repoIndex && !loading && <div className="rb-empty">Connect a repository to browse files.</div>}
            {loading && <div className="skeleton-list">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton-row" />)}</div>}
            {repoIndex && !loading && topLevel.length === 0 && <div className="rb-empty">No matching files.</div>}
            {!loading && topLevel.map(n => <TreeNode key={n.path} node={n} level={0} expanded={expanded} onToggle={toggle} selectedPath={selectedPath} onSelectFile={onSelectFile} />)}
          </div>
        </motion.div>
      )}
    </div>
  )
}
