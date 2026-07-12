import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import ActiveContextBar from './ActiveContextBar'
import RepoBrowser from './RepoBrowser'
import CodeViewer from './CodeViewer'
import Inspector from './Inspector'
import CandidateDetail from './CandidateDetail'

const TABS = [
  ['code', 'Code'],
  ['insights', 'Insights'],
  ['candidate', 'Candidate'],
]

export default function MainStage({
  candidate, githubData,
  repoIndex, repoLoading, repoError,
  selectedFilePath, selectedFile, onSelectFile,
  onAsk, onOpenAts,
}) {
  const [tab, setTab] = useState(selectedFile ? 'code' : repoIndex ? 'insights' : 'candidate')
  const [railOpen, setRailOpen] = useState(true)
  const prevFile = useRef(selectedFilePath)
  const prevRepo = useRef(repoIndex?.repo)

  // Auto-switch focus the moment a file or repository newly becomes active —
  // but never fight the user once they've manually picked a tab for the
  // current selection.
  useEffect(() => {
    if (selectedFilePath && selectedFilePath !== prevFile.current) setTab('code')
    else if (!selectedFilePath && repoIndex?.repo && repoIndex.repo !== prevRepo.current) setTab('insights')
    prevFile.current = selectedFilePath
    prevRepo.current = repoIndex?.repo
  }, [selectedFilePath, repoIndex?.repo])

  const currentFileLabel = selectedFilePath ? selectedFilePath.split('/').pop() : null

  return (
    <div className="main-stage-col">
      <ActiveContextBar
        candidate={candidate}
        githubData={githubData}
        repoIndex={repoIndex}
        selectedFilePath={selectedFilePath}
        selectedFileName={currentFileLabel}
      />

      <div className="stage-tabs" role="tablist">
        <button className="rail-toggle" onClick={() => setRailOpen(v => !v)} title={railOpen ? 'Hide file tree' : 'Show file tree'}>
          {railOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'stage-tab active' : 'stage-tab'} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="stage-body">
        {railOpen && (
          <RepoBrowser repoIndex={repoIndex} loading={repoLoading} selectedPath={selectedFilePath} onSelectFile={onSelectFile} />
        )}

        <div className="stage-content">
          <AnimatePresence mode="wait">
            {tab === 'code' && (
              <motion.div key="code" className="stage-pane" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <CodeViewer file={selectedFile} />
              </motion.div>
            )}
            {tab === 'insights' && (
              <motion.div key="insights" className="stage-pane" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Inspector
                  selectedFile={selectedFile}
                  repoIndex={repoIndex}
                  repoLoading={repoLoading}
                  repoError={repoError}
                  selectedFilePath={selectedFilePath}
                  candidate={candidate}
                  githubData={githubData}
                  onAsk={onAsk}
                  onSelectFile={onSelectFile}
                />
              </motion.div>
            )}
            {tab === 'candidate' && (
              <motion.div key="candidate" className="stage-pane scrollable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <CandidateDetail candidate={candidate} githubData={githubData} onOpenAts={onOpenAts} onAsk={onAsk} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
