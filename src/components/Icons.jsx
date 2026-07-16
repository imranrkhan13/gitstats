import React from 'react'
const V = ({ children, size = 16, fill = 'none', stroke = 'currentColor', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)

export const StarIcon = ({ size = 16, color = 'currentColor' }) => <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
export const ForkIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 9v4a2 2 0 002 2h8" /><circle cx="6" cy="18" r="3" /><line x1="6" y1="9" x2="6" y2="15" /></V>
export const RepoIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></V>
export const UsersIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></V>
export const FireIcon = ({ size = 16, color = 'currentColor' }) => <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2s-5.5 5-5.5 10.5a5.5 5.5 0 0011 0C17.5 7 12 2 12 2zm0 13a2.5 2.5 0 01-2.5-2.5C9.5 10 12 7.5 12 7.5s2.5 2.5 2.5 5A2.5 2.5 0 0112 15z" /></svg>
export const CodeIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></V>
export const AwardIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></V>
export const TrophyIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><polyline points="8 21 12 21 16 21" /><line x1="12" y1="17" x2="12" y2="21" /><path d="M7 4H17l-1 7a5 5 0 01-10 0z" /><path d="M17 5h3v3a3 3 0 01-3 3" /><path d="M7 5H4v3a3 3 0 003 3" /></V>
export const CalendarIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></V>
export const GlobeIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></V>
export const LinkIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></V>
export const ShareIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></V>
export const ChartIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></V>
export const GithubIcon = ({ size = 16, color = 'currentColor' }) => <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
export const XIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color} sw={2.5}><line x1="18" y1="6" x2="6" y2="18" /><line x1="18" y1="18" x2="6" y2="6" /></V>
export const CheckIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color} sw={3}><polyline points="20 6 9 17 4 12" /></V>
export const ExternalIcon = ({ size = 14, color = 'currentColor' }) => <V size={size} stroke={color}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></V>
export const BackIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color} sw={2.5}><polyline points="15 18 9 12 15 6" /></V>
export const EyeIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></V>
export const TrendIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></V>
export const CopyIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></V>
export const PlayIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M8 5v14l11-7z" />
  </svg>
)

export const PauseIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
)
export const DownloadIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></V>
export const IssueIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></V>
export const MedalIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></V>
export const InfoIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></V>
export const GridIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></V>
export const ListIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></V>
export const ActivityIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></V>
export const ClockIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></V>
export const ZapIcon = ({ size = 16, color = 'currentColor' }) => <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
export const CompareIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></V>
export const SearchIcon = ({ size = 16, color = 'currentColor' }) => <V size={size} stroke={color}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></V>




export function SparklesIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}

export function GitBranchIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  )
}



export function FlameIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.072-2.143-3-4-1.072 2.143-2.072 2.143-3 4-.5 1-1 1.62-1 3a2.5 2.5 0 0 0 2.5 2.5Z" />
      <path d="M12.5 17.5A2.5 2.5 0 0 0 15 15c0-1.38-.5-2-1-3-1.072-2.143-2.072-2.143-3-4-1.072 2.143-2.072 2.143-3 4-.5 1-1 1.62-1 3a2.5 2.5 0 0 0 2.5 2.5Z" />
    </svg>
  )
}

export function ChevronRightIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function ChevronLeftIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export function TerminalIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  )
}

export function HeartIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function TrendingUpIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

export function BarChartIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )
}

export function MessageCircleIcon({ size = 16, color = 'currentColor', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}