import { useEffect, useRef, useState } from 'react'

/*
 * The browser's speech recognition (Web Speech API) for the dish editor's mic (docs/UX.md §3 «Голос»).
 * Our own small hook, no dependency (docs/ARCHITECTURE.md §2, 2026-10-07). TypeScript's DOM types do
 * not describe the API, so the part we use is typed here.
 */

interface RecognitionAlternative {
  readonly transcript: string
}

interface RecognitionResult {
  readonly length: number
  readonly isFinal: boolean
  readonly [index: number]: RecognitionAlternative
}

interface RecognitionResultEvent extends Event {
  readonly results: { readonly length: number; readonly [index: number]: RecognitionResult }
}

interface RecognitionErrorEvent extends Event {
  readonly error: string
}

interface Recognition extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: RecognitionResultEvent) => void) | null
  onerror: ((event: RecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type RecognitionConstructor = new () => Recognition

/** What went wrong: each has its own toast. */
export type SpeechError = 'notAllowed' | 'network' | 'nothingHeard'

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function errorOf(code: string): SpeechError | null {
  if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') return 'notAllowed'
  if (code === 'network') return 'network'
  // Stopped by us (a second tap, leaving the screen): not an error.
  if (code === 'aborted') return null
  return 'nothingHeard'
}

interface SpeechRecognitionOptions {
  /** BCP 47, e.g. `ru-RU`. */
  lang: string
  /** Everything said, once recognition ends (a second tap or a pause). */
  onResult: (said: string) => void
  onError: (error: SpeechError) => void
}

/**
 * One utterance at a time: `start()` listens until the browser hears a pause or `stop()` is called;
 * `transcript` is what is recognized so far, for showing it live. `supported` is false where the
 * browser has no recognition (Firefox): no mic button there.
 */
export function useSpeechRecognition({ lang, onResult, onError }: SpeechRecognitionOptions) {
  const [supported] = useState(() => recognitionConstructor() !== null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognition = useRef<Recognition | null>(null)
  // The latest callbacks: recognition ends long after the render that started it.
  const handlers = useRef({ onResult, onError })
  useEffect(() => {
    handlers.current = { onResult, onError }
  })

  // Leaving the screen drops what is being said.
  useEffect(
    () => () => {
      const r = recognition.current
      if (!r) return
      r.onend = null
      r.onerror = null
      r.abort()
    },
    [],
  )

  const start = () => {
    const Constructor = recognitionConstructor()
    if (!Constructor || recognition.current) return
    const r = new Constructor()
    r.lang = lang
    r.interimResults = true
    r.continuous = false
    let said = ''
    let failed = false
    r.onresult = (event) => {
      said = Array.from({ length: event.results.length }, (_, i) => event.results[i]?.[0]?.transcript ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      setTranscript(said)
    }
    r.onerror = (event) => {
      const error = errorOf(event.error)
      if (!error) return
      failed = true
      handlers.current.onError(error)
    }
    r.onend = () => {
      recognition.current = null
      setListening(false)
      setTranscript('')
      if (failed) return
      if (said) handlers.current.onResult(said)
      else handlers.current.onError('nothingHeard')
    }
    recognition.current = r
    setTranscript('')
    setListening(true)
    try {
      r.start()
    } catch {
      recognition.current = null
      setListening(false)
      handlers.current.onError('notAllowed')
    }
  }

  const stop = () => recognition.current?.stop()

  return { supported, listening, transcript, start, stop }
}
