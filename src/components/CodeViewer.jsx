import React, { useMemo, useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Check, ChevronDown, ChevronRight, Copy, Search } from 'lucide-react'
import { fileType } from '../utils/repoAnalysis'

const MAX_LINES = 1200

const LANG_MAP = {
  js: 'jsx', jsx: 'jsx', mjs: 'jsx', cjs: 'jsx',
  ts: 'tsx', tsx: 'tsx',
  json: 'json', css: 'css', scss: 'scss', less: 'css',
  html: 'markup', xml: 'markup', svg: 'markup', vue: 'markup',
  md: 'markdown', mdx: 'markdown',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  c: 'c', h: 'c', cpp: 'cpp', cs: 'csharp', php: 'php',
  sh: 'bash', bash: 'bash', yml: 'yaml', yaml: 'yaml', sql: 'sql',
}

function langFor(path = '') {
  const ext = path.includes('.') ? path.split('.').pop().toLowerCase() : ''
  return LANG_MAP[ext] || 'clike'
}

export default function CodeViewer({ file }) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')

  const { code, truncated } = useMemo(() => {
    const raw = file?.content || ''
    const lines = raw.split('\n')
    if (lines.length > MAX_LINES) {
      return { code: lines.slice(0, MAX_LINES).join('\n'), truncated: lines.length - MAX_LINES }
    }
    return { code: raw, truncated: 0 }
  }, [file?.content])

  if (!file) {
    return (
      <div className="code-viewer empty">
        <p>Select a file from the explorer to view its source.</p>
      </div>
    )
  }

  const name = file.path.split('/').pop()
  const lang = langFor(file.path)
  const q = query.trim().toLowerCase()

  const copy = () => {
    navigator.clipboard?.writeText(file.content || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="code-viewer">
      <div className="code-viewer-head">
        <span className="cv-name">
          <i className="cv-dot" data-type={fileType(file.path)} />
          {name}
          <em>{fileType(file.path)}</em>
        </span>
        <div className="cv-actions">
          {showSearch && (
            <div className="cv-search">
              <Search size={13} />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Find in file"
                onBlur={() => !query && setShowSearch(false)}
              />
            </div>
          )}
          <button className="cv-btn" title="Search" onClick={() => setShowSearch(s => !s)}><Search size={14} /></button>
          <button className="cv-btn" title="Copy" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
          <button className="cv-btn" title={collapsed ? 'Expand' : 'Collapse'} onClick={() => setCollapsed(c => !c)}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="code-scroll">
          <Highlight theme={themes.vsDark} code={code} language={lang}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre className={`code-pre ${className}`} style={style}>
                {tokens.map((line, i) => {
                  const text = line.map(t => t.content).join('').toLowerCase()
                  const isMatch = q && text.includes(q)
                  const lineProps = getLineProps({ line })
                  return (
                    <div key={i} {...lineProps} className={`code-line ${isMatch ? 'match' : ''} ${lineProps.className || ''}`}>
                      <span className="ln">{i + 1}</span>
                      <span className="lc">
                        {line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}
                      </span>
                    </div>
                  )
                })}
              </pre>
            )}
          </Highlight>
          {truncated > 0 && (
            <div className="code-truncated">{truncated} more lines hidden — open the file on GitHub to view all.</div>
          )}
        </div>
      )}
    </div>
  )
}
