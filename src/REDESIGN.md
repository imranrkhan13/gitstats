# ResumeIQ — Redesign notes (v2: structural rework)

Scope: **UI and layout only.** The data layer (`utils/*`) and `hooks/useChat.js`
/ `hooks/useVoice.js` are untouched — copied through exactly as you last edited them.

This pass replaces the previous three-column layout (candidate sidebar +
center workspace + right inspector) with a simpler, more focused structure.

## The new structure

```
┌────┬───────────────────────────────────────────────────────────┐
│    │  Command bar — candidate · repo/branch picker · search    │
│rail├───────────────────────────────────────┬───────────────────┤
│    │  Active Context bar (repo / file)      │                   │
│icon│  [Code] [Insights] [Candidate]  ⟨rail⟩ │   Conversation    │
│only│  ───────────────────────────────────── │   (always here,   │
│    │  file tree │  single focused pane      │   independent     │
│    │  (toggle)  │  for whichever tab is on  │   scroll, sticky  │
│    │            │                            │   input)          │
└────┴───────────────────────────────────────┴───────────────────┘
```

- **One main stage, three tabs** (`components/MainStage.jsx`) instead of a
  permanent code|inspector split. `Code` (the file), `Insights` (AI analysis
  of the file, or repo intelligence if no file is selected), `Candidate`
  (resume/GitHub detail, ATS, strengths & weaknesses). The tab auto-switches
  the moment you select a file or a repository — you don't have to click
  anything — but once you're looking at a tab you chose yourself, it won't
  get yanked out from under you.
- **Chat is now a permanent column**, not something pinned under the code
  (`components/ChatPanel.jsx`). It's always visible, always the same width,
  independent of whatever's happening in the main stage — closer to how
  Cursor/Claude Code keep the assistant panel present at all times.
- **Command bar replaces Navbar + the old candidate sidebar**
  (`components/CommandBar.jsx`). Candidate identity, resume/GitHub connect
  actions, ATS shortcut, repo/branch picker, and search all live in one
  slim strip so no vertical column is permanently spent on "who is this
  candidate" — that detail now lives in the Candidate tab, one click away,
  full width, not squeezed into 250px.
- **File tree is a toggle**, not a fixed column — click the panel icon in
  the stage tab row to hide it and give the code/insights more width.

## File map

| File | Status |
|---|---|
| `App.jsx` | rewritten around the structure above |
| `components/CommandBar.jsx` | new — replaces `Navbar.jsx` |
| `components/MainStage.jsx` | new — the tabbed stage described above |
| `components/ChatPanel.jsx` | new — persistent chat column |
| `components/CandidateDetail.jsx` | new — full-width Candidate tab content |
| `components/Inspector.jsx` | kept, trimmed — now only handles file/repo (the candidate branch moved into `CandidateDetail`); exports `CandidateInsight` so both reuse the same strengths/weaknesses view |
| `components/ActiveContextBar.jsx` | kept — the repo/file breadcrumb + live source chips, now sits at the top of the main stage |
| `AiAnalysisPanel`, `RepoIntelligencePanel`, `CodeViewer`, `RepoBrowser`, `ChatMessage`, `ChatInput`, `AtsModal`, `SideNav`, `EmptyState`, `OverviewDashboard`, `VoicePanel` | unchanged, same as before |
| `Navbar.jsx`, `CenterWorkspace.jsx`, the old `CandidateSidebar.jsx` | removed — superseded by `CommandBar` / `MainStage` / `ChatPanel` |

Still deprecated-not-deleted from the first pass (never wired into `App.jsx`
in the original either): `CandidateHeader.jsx`, `Sidebar.jsx`,
`RightPanel.jsx`, `Githubprofilecard.jsx`, `RepoExplorer.jsx`,
`DependencyGraph.jsx`.

## Styling

Same tokens as before (`styles/tokens.css`) — warm white, stone, one
burnt-orange accent, Inter, hairlines instead of card borders.
`styles/app.css` has new rules for `.command-bar`, `.workspace-columns`,
`.main-stage-col`, `.stage-tabs`, `.stage-body`, `.chat-col`, and
`.candidate-detail` / `.cd-*`; the old `.center-workspace` /
`.workspace-split` / `.split-code` / `.split-ai` rules were removed
since nothing renders them anymore.

## Motion

- Stage tab switches cross-fade (`AnimatePresence mode="wait"`).
- Active Context bar crumbs and source chips animate on change, as before.
- File rail toggle and repo/ATS popovers keep their existing pop-in.

## Still flagged, not addressed here (UI-only pass)

- API keys via `import.meta.env.VITE_*` still ship in the client bundle
  (`aiClient.js`, `useVoice.js`).
- `DependencyGraph.jsx` / `RepoExplorer.jsx` remain unwired; worth a call
  on whether to fold `DependencyGraph` into the Insights tab's architecture
  view or retire it in favor of the React Flow map already in
  `RepoIntelligencePanel`.
