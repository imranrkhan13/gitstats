import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { TiltCard } from './CardEngine.jsx'
import { MagneticButton, CountUp } from './MotionUI.jsx'
import { DownloadIcon, CopyIcon, CheckIcon } from './Icons.jsx'
import { BRAND } from '../lib/brand.js'
import { scoreColor } from '../lib/utils.js'

// Simple typewriter — reveals the main roast line character by character.
// Kept short (roast text is 2-4 sentences) so this never drags.
function useTypewriter(text, speed = 18) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    setShown('')
    if (!text) return
    let i = 0
    const id = setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text])
  return shown
}

function FieldBlock({ label, children, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }} style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>{children}</div>
    </motion.div>
  )
}

export function RoastCard({ roast, login }) {
  const cardRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const typed = useTypewriter(roast.roast)
  const typingDone = typed.length === roast.roast.length

  const shareText = () => [
    `🔥 ${roast.title}`,
    ``,
    roast.roast,
    ``,
    `Dev Score: ${roast.score}/100`,
    `✅ Best: ${roast.strength}`,
    `⚠️ Weak spot: ${roast.weakness}`,
    ``,
    `Roasted by ${BRAND.appName} · ${BRAND.websiteUrl}/?user=${login}`,
  ].join('\n')

  const download = async () => {
    setStatus('rendering')
    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true })
    const a = document.createElement('a')
    a.download = `gitstatus-roast-${login}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
    setStatus('done-download'); setTimeout(() => setStatus('idle'), 2500)
  }

  const copyImage = async () => {
    setStatus('rendering')
    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true })
    canvas.toBlob(async (blob) => {
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); setStatus('done-copy') }
      catch { setStatus('error') }
      setTimeout(() => setStatus('idle'), 2500)
    })
  }

  const copyText = async () => {
    await navigator.clipboard.writeText(shareText()).catch(() => {})
    setStatus('done-text'); setTimeout(() => setStatus('idle'), 2500)
  }

  return (
    <div>
      <div ref={cardRef}>
        <TiltCard width="min(420px, 92vw)" aspectRatio="420/560" style={{ margin: '0 auto' }}>
          <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', padding: '7% 8%', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text4)' }}>{BRAND.appName.toUpperCase()} ROAST</span>
              {!roast.aiGenerated && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text4)' }}>RULE-BASED</span>}
            </div>

            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 22, fontWeight: 900, color: 'var(--br2)', letterSpacing: '-0.01em', marginBottom: 12 }}>
              🔥 {roast.title}
            </motion.div>

            <div style={{ fontSize: 14.5, color: 'var(--text2)', lineHeight: 1.6, minHeight: 70, marginBottom: 14 }}>
              {typed}
              {!typingDone && <span style={{ opacity: 0.5 }}>▍</span>}
            </div>

            {typingDone && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: scoreColor(roast.score) }}><CountUp value={roast.score} duration={0.8} /></span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>/ 100 dev score</span>
                </div>

                <FieldBlock label="Biggest strength" delay={0.05}>✅ {roast.strength}</FieldBlock>
                <FieldBlock label="Biggest weakness" delay={0.12}>⚠️ {roast.weakness}</FieldBlock>
                <FieldBlock label="Fun facts" delay={0.19}>
                  {roast.funFacts.map((f, i) => <div key={i}>• {f}</div>)}
                </FieldBlock>
                <FieldBlock label="If this GitHub were a developer..." delay={0.26}>{roast.ifDeveloper}</FieldBlock>

                <div style={{ marginTop: 'auto', fontSize: 10, color: 'var(--text4)', paddingTop: 8 }}>gitstatus.netlify.app</div>
              </>
            )}
          </div>
        </TiltCard>
      </div>

      {typingDone && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          <MagneticButton onClick={download} glow="rgba(245,200,66,0.4)" style={{ height: 38, padding: '0 14px', borderRadius: 9, background: 'var(--br)', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 700, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            {status === 'done-download' ? <><CheckIcon size={13} color="#fff" /> Saved</> : <><DownloadIcon size={13} /> Download</>}
          </MagneticButton>
          <MagneticButton onClick={copyImage} glow="rgba(245,200,66,0.3)" style={{ height: 38, padding: '0 14px', borderRadius: 9, background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)', fontSize: 12.5, fontWeight: 700, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            {status === 'done-copy' ? <><CheckIcon size={13} color="var(--green)" /> Copied</> : <><CopyIcon size={13} /> Copy Image</>}
          </MagneticButton>
          <MagneticButton onClick={copyText} glow="rgba(245,200,66,0.3)" style={{ height: 38, padding: '0 14px', borderRadius: 9, background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)', fontSize: 12.5, fontWeight: 700, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            {status === 'done-text' ? <><CheckIcon size={13} color="var(--green)" /> Copied</> : <><CopyIcon size={13} /> Copy Text</>}
          </MagneticButton>
        </motion.div>
      )}
    </div>
  )
}
