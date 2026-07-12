import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Use CDN worker to avoid bundler issues with web workers
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

function cleanExtractedText(text = '') {
  return text
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/ﬀ/g, 'ff')
    .replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/(.)\1{5,}/g, '$1$1$1')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function extractPdfText(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer, disableFontFace: true, verbosity: 0 }).promise

  const pageTexts = []
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent({ includeMarkedContent: false })

    // Reconstruct lines by grouping by Y position
    const lineMap = new Map()
    for (const item of content.items) {
      if (!item.str) continue
      const y = Math.round(item.transform[5])
      if (!lineMap.has(y)) lineMap.set(y, [])
      lineMap.get(y).push(item.str)
    }
    // Sort by Y descending (top of page first), join each line
    const sortedLines = [...lineMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, words]) => words.join(' ').trim())
      .filter(Boolean)

    pageTexts.push(sortedLines.join('\n'))
  }
  return cleanExtractedText(pageTexts.join('\n\n'))
}

async function extractDocxText(file) {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return cleanExtractedText(result.value || '')
}

export async function extractResumeText(file) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf'))        return extractPdfText(file)
  if (name.endsWith('.docx') || name.endsWith('.doc')) return extractDocxText(file)
  const text = await file.text()
  return cleanExtractedText(text)
}
