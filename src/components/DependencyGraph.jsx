import React, { useEffect, useMemo, useRef, useState } from 'react'
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force'
import { fileType } from '../utils/repoAnalysis'

const GRAPH_LIMIT = 140

// Muted, low-saturation palette keyed by file type for a calm, minimal look.
const MUTED_COLORS = {
  tsx: '#818cf8',
  ts: '#93a4c4',
  jsx: '#a5b4fc',
  js: '#c4b5a0',
  css: '#b8a1c9',
  json: '#a3b3a0',
  md: '#a8b0b8',
  config: '#9aa4b2',
  api: '#8fb0b8',
  test: '#c7a3a3',
  env: '#c2a58a',
  other: '#b6bcc4',
}

function mutedColor(path = '') {
  return MUTED_COLORS[fileType(path)] || MUTED_COLORS.other
}

function useElementSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 420, height: 260 })

  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      if (rect) {
        setSize({
          width: Math.max(260, rect.width),
          height: Math.max(220, rect.height),
        })
      }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return [ref, size]
}

export default function DependencyGraph({ graph, selectedPath, onSelectFile }) {
  const [wrapRef, size] = useElementSize()
  const [layout, setLayout] = useState({ nodes: [], links: [] })

  const graphData = useMemo(() => {
    const sourceNodes = graph?.nodes || []
    const sourceEdges = graph?.edges || []
    const connected = new Set()
    sourceEdges.forEach(edge => {
      connected.add(edge.source)
      connected.add(edge.target)
    })

    const prioritized = [...sourceNodes]
      .sort((a, b) => {
        if (a.path === selectedPath) return -1
        if (b.path === selectedPath) return 1
        return (connected.has(b.path) ? 1 : 0) - (connected.has(a.path) ? 1 : 0)
      })
      .slice(0, GRAPH_LIMIT)
    const allowed = new Set(prioritized.map(node => node.path))

    return {
      nodes: prioritized.map(node => ({ ...node })),
      links: sourceEdges
        .filter(edge => allowed.has(edge.source) && allowed.has(edge.target))
        .map(edge => ({ ...edge })),
    }
  }, [graph, selectedPath])

  useEffect(() => {
    if (!graphData.nodes.length) {
      setLayout({ nodes: [], links: [] })
      return
    }

    const nodes = graphData.nodes.map(node => ({ ...node }))
    const links = graphData.links.map(edge => ({ ...edge }))
    const simulation = forceSimulation(nodes)
      .force('link', forceLink(links).id(node => node.path).distance(54).strength(0.35))
      .force('charge', forceManyBody().strength(-120))
      .force('collide', forceCollide().radius(node => (node.size || 6) + 8))
      .force('center', forceCenter(size.width / 2, size.height / 2))
      .stop()

    for (let i = 0; i < 150; i += 1) simulation.tick()

    setLayout({
      nodes: nodes.map(node => ({
        ...node,
        x: Math.max(18, Math.min(size.width - 18, node.x || size.width / 2)),
        y: Math.max(18, Math.min(size.height - 18, node.y || size.height / 2)),
      })),
      links,
    })

    return () => simulation.stop()
  }, [graphData, size.width, size.height])

  const nodeByPath = useMemo(
    () => Object.fromEntries(layout.nodes.map(node => [node.path, node])),
    [layout.nodes]
  )

  return (
    <div ref={wrapRef} className="dependency-graph">
      {!layout.nodes.length ? (
        <div className="graph-empty">Connect a repository to build the dependency graph.</div>
      ) : (
        <svg width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`} role="img" aria-label="Repository dependency graph">
          <g>
            {layout.links.map((edge, i) => {
              const source = typeof edge.source === 'string' ? nodeByPath[edge.source] : edge.source
              const target = typeof edge.target === 'string' ? nodeByPath[edge.target] : edge.target
              if (!source || !target) return null
              const selected = source.path === selectedPath || target.path === selectedPath
              return (
                <line
                  key={`${source.path}-${target.path}-${i}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={selected ? '#4f46e5' : '#e5e7eb'}
                  strokeWidth={selected ? 1.4 : 0.7}
                  opacity={selected ? 0.8 : 0.6}
                />
              )
            })}
          </g>
          <g>
            {layout.nodes.map(node => {
              const selected = node.path === selectedPath
              return (
                <g
                  key={node.path}
                  transform={`translate(${node.x},${node.y})`}
                  onClick={() => onSelectFile?.(node.path)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    r={selected ? (node.size || 5) + 3 : node.size || 5}
                    fill={mutedColor(node.path)}
                    stroke={selected ? '#4f46e5' : '#ffffff'}
                    strokeWidth={selected ? 2 : 1.2}
                    opacity={selected ? 1 : 0.85}
                  />
                  {selected && <circle r={(node.size || 5) + 8} fill="none" stroke="#c7d2fe" strokeWidth="1.5" opacity="0.9" />}
                  <title>{node.path}</title>
                  {(selected || layout.nodes.length < 45) && (
                    <text
                      x={10}
                      y={4}
                      fontSize="9"
                      fontWeight={selected ? 600 : 500}
                      fill={selected ? '#111827' : '#6b7280'}
                      paintOrder="stroke"
                      stroke="#ffffff"
                      strokeWidth="3"
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      )}
    </div>
  )
}

