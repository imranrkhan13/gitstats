import { useRef, useState, useCallback, useEffect } from 'react'
import { buildResumeContext } from '../utils/resumeParser'
import { buildGitHubContext } from '../utils/githubapi'
import { buildRepoContext } from '../utils/repoAnalysis'

// ── States ──
export const VOICE_STATE = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  LISTENING: 'listening',
  SPEAKING: 'speaking',
  PROCESSING: 'processing',
  RESPONDING: 'responding',
  ERROR: 'error',
  UNSUPPORTED: 'unsupported',
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const FREE_VOICE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
]

function buildVoiceSystemPrompt(candidate, githubData, repoIndex, chatMode, selectedFilePath, userText) {
  const ctx = candidate ? buildResumeContext(candidate) : null
  const ghCtx = githubData ? buildGitHubContext(githubData) : null
  const repoCtx = repoIndex ? buildRepoContext(repoIndex, userText || '', chatMode || 'merged', selectedFilePath) : null

  let prompt = `You are ResumeIQ, a voice-enabled ATS hiring assistant. You are answering spoken questions from a recruiter.

RULES:
- Keep answers SHORT and conversational (2-4 sentences max for voice).
- Never fabricate candidate, GitHub, or repository details. Say "Not mentioned" if data is missing.
- Speak naturally. Avoid bullet points, asterisks, markdown, or long lists.
- Cite which source you used: [Resume], [GitHub], [Repo], or [File].
- If no data is loaded, answer general hiring questions concisely.
`

  if (ctx) {
    prompt += `\\n\\nCANDIDATE RESUME DATA:\\n${ctx}`
  }
  if (ghCtx) {
    prompt += `\\n\\nCANDIDATE GITHUB DATA:\\n${ghCtx}`
  }
  if (repoCtx) {
    prompt += `\\n\\nREPOSITORY CONTEXT:\\n${repoCtx}`
  }
  if (!ctx && !ghCtx && !repoCtx) {
    prompt += `\\n\\nNo candidate data loaded.`
  }

  return prompt
}

async function transcribeAudio(blob) {
  const deepgramKey = import.meta.env.VITE_DEEPGRAM_API
  if (deepgramKey) {
    const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
      method: 'POST',
      headers: {
        Authorization: `Token ${deepgramKey}`,
        'Content-Type': blob.type || 'audio/webm',
      },
      body: blob,
    })
    if (res.ok) {
      const data = await res.json()
      const text = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript
      if (text) return text
    }
  }

  const openAIKey = import.meta.env.VITE_OPENAI_API || import.meta.env.VITE_OPENAI_WHISPER_API
  if (openAIKey) {
    const form = new FormData()
    form.append('file', blob, 'voice.webm')
    form.append('model', 'whisper-1')
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openAIKey}` },
      body: form,
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.text) return data.text
    }
  }

  throw new Error('No speech recognition result. Add VITE_DEEPGRAM_API or VITE_OPENAI_API for voice transcription fallback.')
}

export function useVoice({ candidate, githubData, repoIndex, chatMode, selectedFilePath, onTranscript, onResponse, onError }) {
  const [voiceState, setVoiceState] = useState(VOICE_STATE.IDLE)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [volume, setVolume] = useState(0)
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef(null)
  const analyserRef = useRef(null)
  const animFrameRef = useRef(null)
  const audioCtxRef = useRef(null)
  const streamRef = useRef(null)
  const abortRef = useRef(null)
  const activeRef = useRef(false)
  const stateRef = useRef(VOICE_STATE.IDLE)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const discardAudioRef = useRef(false)

  const setState = useCallback((s) => {
    stateRef.current = s
    setVoiceState(s)
  }, [])

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if ((!SpeechRec && !window.MediaRecorder) || !navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false)
      setState(VOICE_STATE.UNSUPPORTED)
    }
  }, [setState])

  const startAnalyser = useCallback((stream) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser

      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        if (!activeRef.current) return
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((s, v) => s + v, 0) / data.length
        setVolume(Math.min(100, Math.round(avg * 2.2)))
        animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    } catch {
      // Analyser is non-critical
    }
  }, [])

  const stopAnalyser = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    setVolume(0)
    try { audioCtxRef.current?.close() } catch { }
    audioCtxRef.current = null
    analyserRef.current = null
  }, [])

  const streamResponse = useCallback(async (userText) => {
    const key = import.meta.env.VITE_OPENROUTER_API
    setState(VOICE_STATE.PROCESSING)
    setResponse('')

    const messages = [
      { role: 'system', content: buildVoiceSystemPrompt(candidate, githubData, repoIndex, chatMode, selectedFilePath, userText) },
      { role: 'user', content: userText },
    ]

    abortRef.current = new AbortController()
    const timeout = setTimeout(() => abortRef.current?.abort(), 30000)

    let fullText = ''
    let modelIdx = 0

    while (key && modelIdx < FREE_VOICE_MODELS.length) {
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'ResumeIQ Voice',
          },
          body: JSON.stringify({
            model: FREE_VOICE_MODELS[modelIdx],
            messages,
            stream: true,
            temperature: 0.4,
            max_tokens: 200,
          }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error?.message || `HTTP ${res.status}`)
        }

        setState(VOICE_STATE.RESPONDING)
        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\\n').filter(l => l.startsWith('data: '))

          for (const line of lines) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') break
            try {
              const json = JSON.parse(data)
              const token = json?.choices?.[0]?.delta?.content || ''
              if (token) {
                fullText += token
                setResponse(prev => prev + token)
              }
            } catch { }
          }
        }

        clearTimeout(timeout)
        onResponse?.(fullText)
        console.log(`✅ Voice response via ${FREE_VOICE_MODELS[modelIdx]}`)
        return fullText

      } catch (err) {
        if (err.name === 'AbortError') throw err
        console.warn(`❌ Voice model ${FREE_VOICE_MODELS[modelIdx]}:`, err.message)
        modelIdx++
      }
    }

    clearTimeout(timeout)
    const groqKey = import.meta.env.VITE_GROQ_API || import.meta.env.VITE_GROK_API || import.meta.env.VITE_GRADIUM_API
    if (groqKey) {
      setState(VOICE_STATE.RESPONDING)
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.35,
          max_tokens: 220,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data?.choices?.[0]?.message?.content || ''
        fullText = text.replace(/\*/g, '').trim()
        setResponse(fullText)
        onResponse?.(fullText)
        return fullText
      }
    }

    const geminiKey = import.meta.env.VITE_GEMINI_API
    if (geminiKey) {
      setState(VOICE_STATE.RESPONDING)
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${messages[0].content}\n\nQuestion: ${userText}` }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 220 },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        fullText = text.replace(/\*/g, '').trim()
        setResponse(fullText)
        onResponse?.(fullText)
        return fullText
      }
    }

    throw new Error('All voice response providers failed. Add VITE_OPENROUTER_API, VITE_GROQ_API, or VITE_GEMINI_API.')
  }, [candidate, githubData, repoIndex, chatMode, selectedFilePath, onResponse, setState])

  const start = useCallback(async () => {
    if (!isSupported) return
    if (activeRef.current) return

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    setState(VOICE_STATE.REQUESTING)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      activeRef.current = true

      startAnalyser(stream)

      if (!SpeechRec) {
        if (!window.MediaRecorder) throw new Error('Voice recording is not supported in this browser')
        audioChunksRef.current = []
        discardAudioRef.current = false
        const recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder

        recorder.ondataavailable = (event) => {
          if (event.data?.size) audioChunksRef.current.push(event.data)
        }

        recorder.onstop = async () => {
          const chunks = audioChunksRef.current
          mediaRecorderRef.current = null
          if (discardAudioRef.current || !chunks.length) {
            streamRef.current?.getTracks().forEach(t => t.stop())
            streamRef.current = null
            stopAnalyser()
            setState(VOICE_STATE.IDLE)
            return
          }

          try {
            setState(VOICE_STATE.PROCESSING)
            const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
            const q = (await transcribeAudio(blob)).trim()
            if (!q) throw new Error('No speech detected')
            setTranscript(q)
            onTranscript?.(q)
            await streamResponse(q)
          } catch (err) {
            setState(VOICE_STATE.ERROR)
            onError?.(err.message)
          } finally {
            activeRef.current = false
            streamRef.current?.getTracks().forEach(t => t.stop())
            streamRef.current = null
            stopAnalyser()
          }
        }

        recorder.start()
        setTranscript('')
        setResponse('')
        setState(VOICE_STATE.LISTENING)
        return
      }

      const rec = new SpeechRec()
      rec.lang = 'en-US'
      rec.interimResults = true
      rec.continuous = true
      rec.maxAlternatives = 1
      recognitionRef.current = rec

      let finalText = ''

      rec.onstart = () => {
        setState(VOICE_STATE.LISTENING)
        setTranscript('')
        setResponse('')
        finalText = ''
      }

      rec.onspeechstart = () => {
        setState(VOICE_STATE.SPEAKING)
      }

      rec.onspeechend = () => {
        if (stateRef.current === VOICE_STATE.SPEAKING) {
          setState(VOICE_STATE.LISTENING)
        }
      }

      rec.onresult = (e) => {
        let interim = ''
        finalText = ''
        for (let i = 0; i < e.results.length; i++) {
          const t = e.results[i][0].transcript
          if (e.results[i].isFinal) finalText += t + ' '
          else interim += t
        }
        setTranscript(finalText || interim)
      }

      rec.onerror = (e) => {
        if (e.error === 'no-speech') {
          if (activeRef.current) {
            try { rec.start() } catch { }
          }
          return
        }
        console.error('SpeechRec error:', e.error)
        if (e.error === 'not-allowed') {
          setState(VOICE_STATE.ERROR)
          onError?.('Microphone permission denied')
          stop()
        }
      }

      rec.onend = () => {
        if (finalText.trim() && activeRef.current) {
          const q = finalText.trim()
          setTranscript(q)
          onTranscript?.(q)

          streamResponse(q)
            .catch(err => {
              setState(VOICE_STATE.ERROR)
              onError?.(err.message)
            })
            .finally(() => {
              if (activeRef.current) {
                setTimeout(() => {
                  setState(VOICE_STATE.LISTENING)
                  setTranscript('')
                  finalText = ''
                  try { rec.start() } catch { }
                }, 800)
              }
            })
        } else if (activeRef.current) {
          setTimeout(() => {
            if (activeRef.current) {
              try { rec.start() } catch { }
            }
          }, 300)
        }
      }

      rec.start()

    } catch (err) {
      activeRef.current = false
      setState(VOICE_STATE.ERROR)
      onError?.(err.message || 'Could not access microphone')
    }
  }, [isSupported, startAnalyser, streamResponse, onTranscript, onError, setState])

  const stop = useCallback((options = {}) => {
    activeRef.current = false
    abortRef.current?.abort()

    if (mediaRecorderRef.current?.state === 'recording') {
      discardAudioRef.current = !!options.discard
      try { mediaRecorderRef.current.stop() } catch { }
      if (!options.discard) {
        setState(VOICE_STATE.PROCESSING)
        return
      }
    }

    try { recognitionRef.current?.stop() } catch { }
    recognitionRef.current = null

    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null

    stopAnalyser()
    setState(VOICE_STATE.IDLE)
    setTranscript('')
    setResponse('')
    setVolume(0)
  }, [stopAnalyser, setState])

  useEffect(() => () => stop({ discard: true }), [stop])

  return {
    voiceState,
    transcript,
    response,
    volume,
    isSupported,
    start,
    stop,
    isActive: activeRef.current,
  }
}