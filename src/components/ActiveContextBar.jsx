import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, FileCode2, FolderGit2 } from 'lucide-react'

const SOURCE_DEFS = [
  ['resume', 'Resume'],
  ['github', 'GitHub'],
  ['repository', 'Repo'],
  ['file', 'File'],
  ['ats', 'ATS'],
]

// Which sources are plausibly "hot" given current selection — a lightweight,
// always-on preview of what routeContext will draw from once a question is asked.
function activeSources({ candidate, githubData, repoIndex, selectedFilePath }) {
  const active = new Set()
  if (candidate) active.add('resume')
  if (githubData) active.add('github')
  if (repoIndex) active.add('repository')
  if (selectedFilePath) active.add('file')
  if (candidate?.ats) active.add('ats')
  return active
}

export default function ActiveContextBar({ candidate, githubData, repoIndex, selectedFilePath, selectedFileName }) {
  const active = activeSources({ candidate, githubData, repoIndex, selectedFilePath })
  const hasAny = repoIndex || selectedFilePath

  return (
    <div className="active-context-bar">
      <div className="acb-crumbs">
        <AnimatePresence mode="popLayout" initial={false}>
          {!hasAny && (
            <motion.span key="empty" className="acb-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              No repository selected — connect GitHub to bring code into context
            </motion.span>
          )}
          {repoIndex && (
            <motion.span
              key={`repo-${repoIndex.repo}`}
              className={selectedFilePath ? 'acb-crumb' : 'acb-crumb current'}
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
            >
              <FolderGit2 size={13} /> {repoIndex.owner}/{repoIndex.repo}
            </motion.span>
          )}
          {repoIndex && selectedFilePath && (
            <motion.span key="sep" className="acb-crumb-sep" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ChevronRight size={12} />
            </motion.span>
          )}
          {selectedFilePath && (
            <motion.span
              key={`file-${selectedFilePath}`}
              className="acb-crumb current"
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
            >
              <FileCode2 size={13} /> {selectedFileName || selectedFilePath}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="acb-sources">
        {SOURCE_DEFS.map(([key, label]) => (
          <motion.span
            key={key}
            layout
            className={active.has(key) ? 'acb-source-chip active' : 'acb-source-chip'}
            transition={{ duration: 0.18 }}
          >
            <i /> {label}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
