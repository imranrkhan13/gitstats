import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function EmptyState({ onChip, hasResume, hasGitHub, candidateName }) {
  const title = hasResume
    ? `Ready to evaluate ${candidateName || 'this candidate'}`
    : hasGitHub
      ? 'GitHub connected'
      : 'Your AI hiring workspace'

  const subtitle = hasResume || hasGitHub
    ? 'Ask about fit, evidence, code quality, architecture, or a selected file.'
    : 'Add a resume and connect GitHub, then ask anything. Answers cite the resume, GitHub, and code.'

  const prompts = [
    'Should I hire this candidate? Explain why.',
    'What evidence supports hiring this candidate?',
    'What are the biggest hiring risks?',
    'Generate recruiter notes and next interview questions.',
  ]

  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="empty-illustration">
        <div className="ei-ring" />
        <div className="ei-core"><Sparkles size={22} /></div>
      </div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div className="empty-prompts">
        {prompts.map(prompt => (
          <button key={prompt} onClick={() => onChip(prompt)}>{prompt}</button>
        ))}
      </div>
    </motion.div>
  )
}
