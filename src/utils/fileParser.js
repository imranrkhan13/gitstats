// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// fileParser.js — Production-grade PDF + DOCX extraction
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WHY: file.text() on a PDF returns binary garbage.
// FIX: pdf.js for PDFs, mammoth for DOCX, plain text for TXT.

// ── pdf.js setup (browser build, no worker file needed via fake worker) ──
let pdfjsLib = null

async function getPdfLib() {
  if (pdfjsLib) return pdfjsLib
  const mod = await import('pdfjs-dist')
  pdfjsLib = mod
  // Use the fake worker for browser-only environments (no separate worker URL needed)
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href
  return pdfjsLib
}

// ── Unicode / encoding cleanup ──
function sanitizeText(raw) {
  return raw
    // Remove null bytes and control characters (except \n \r \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Replace common ligature characters with ASCII equivalents
    .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/ﬀ/g, 'ff')
    .replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl').replace(/ﬅ/g, 'st')
    // Replace special dashes with regular hyphen
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    // Replace smart quotes
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    // Replace ellipsis
    .replace(/\u2026/g, '...')
    // Collapse multiple blank lines to max 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim trailing whitespace on each line
    .split('\n').map(l => l.trimEnd()).join('\n')
    .trim()
}

// ── Extract text from PDF using pdf.js page-by-page ──
async function extractPdf(arrayBuffer) {
  const pdfjs = await getPdfLib()

  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    // Disable font loading — we only need text
    disableFontFace: true,
    // Suppress password prompts
    verbosity: 0,
  })

  const pdf = await loadingTask.promise
  const numPages = pdf.numPages
  const pageTexts = []

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent({
      // Include marked content — helps with structured resumes
      includeMarkedContent: false,
      disableNormalization: false,
    })

    // pdf.js returns items with transform arrays — reconstruct line breaks
    // by grouping items with similar Y positions
    const lines = []
    let currentY = null
    let currentLine = []

    const items = content.items.filter(item => item.str !== undefined)

    for (const item of items) {
      const y = Math.round(item.transform[5]) // Y position
      if (currentY === null) currentY = y

      // New line if Y position changed significantly (> 2 units)
      if (Math.abs(y - currentY) > 2) {
        if (currentLine.length) lines.push(currentLine.join(' ').trim())
        currentLine = []
        currentY = y
      }

      const str = item.str.trim()
      if (str) currentLine.push(str)
    }
    if (currentLine.length) lines.push(currentLine.join(' ').trim())

    pageTexts.push(lines.filter(Boolean).join('\n'))
  }

  return sanitizeText(pageTexts.join('\n\n'))
}

// ── Extract text from DOCX using mammoth ──
async function extractDocx(arrayBuffer) {
  const mammoth = (await import('mammoth')).default
  const result = await mammoth.extractRawText({ arrayBuffer })
  if (result.messages?.length) {
    const warnings = result.messages.filter(m => m.type === 'warning')
    if (warnings.length) console.warn('[DOCX] Warnings:', warnings.map(w => w.message))
  }
  return sanitizeText(result.value || '')
}

// ── Main export: parse any file type to clean text ──
export async function extractTextFromFile(file) {
  const name = file.name.toLowerCase()
  const ext  = name.split('.').pop()

  if (ext === 'pdf') {
    const buf = await file.arrayBuffer()
    return extractPdf(buf)
  }

  if (ext === 'docx' || ext === 'doc') {
    const buf = await file.arrayBuffer()
    return extractDocx(buf)
  }

  // Plain text / markdown fallback
  const text = await file.text()
  return sanitizeText(text)
}
