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

/** Listening ends by itself after this long without new words. */
export const SILENCE_TIMEOUT_MS = 30_000

const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false

/** A recognizer error that ends listening; null — one we ride over by starting a new session. */
function errorOf(code: string): SpeechError | null {
  // A pause («no-speech») or our own restart («aborted»): the next session goes on.
  if (code === 'no-speech' || code === 'aborted') return null
  // Offline any failure is the network's: the toast says why the mic does nothing.
  if (offline()) return 'network'
  if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') return 'notAllowed'
  if (code === 'network') return 'network'
  return 'nothingHeard'
}

interface SpeechRecognitionOptions {
  /** BCP 47, e.g. `ru-RU`. */
  lang: string
  /** Everything said, once listening ends (a second tap, or 30 s of silence). */
  onResult: (said: string) => void
  onError: (error: SpeechError) => void
}

const joined = (parts: string[]) => parts.join(' ').replace(/\s+/g, ' ').trim()

/**
 * Listens until `stop()` (docs/UX.md §3 «Голос»): one can say «гречка 200», think, and go on. Browsers
 * end a recognition session on a pause by themselves (Safari, Chrome on Android); while the user has
 * not stopped, a new session starts and what was said before is kept. 30 s without new words — stop.
 * `transcript` is everything recognized so far, for showing it live. `supported` is false where the
 * browser has no recognition (Firefox): no mic button there.
 */
export function useSpeechRecognition({ lang, onResult, onError }: SpeechRecognitionOptions) {
  const [supported] = useState(() => recognitionConstructor() !== null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognition = useRef<Recognition | null>(null)
  // The user wants to listen: a session ended by the browser is followed by a new one.
  const active = useRef(false)
  // Text of the sessions that have ended, and of the current one (finals and the last interim).
  const done = useRef<string[]>([])
  const current = useRef('')
  const failure = useRef<SpeechError | null>(null)
  const silence = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The latest callbacks: recognition ends long after the render that started it.
  const handlers = useRef({ onResult, onError })
  useEffect(() => {
    handlers.current = { onResult, onError }
  })

  const clearSilence = () => {
    if (silence.current !== null) clearTimeout(silence.current)
    silence.current = null
  }
  const stop = () => {
    active.current = false
    clearSilence()
    recognition.current?.stop()
  }
  const armSilence = () => {
    clearSilence()
    silence.current = setTimeout(stop, SILENCE_TIMEOUT_MS)
  }

  const finish = () => {
    recognition.current = null
    active.current = false
    clearSilence()
    setListening(false)
    setTranscript('')
    const said = joined(done.current)
    const error = failure.current
    if (said) handlers.current.onResult(said)
    if (error) handlers.current.onError(error)
    else if (!said) handlers.current.onError(offline() ? 'network' : 'nothingHeard')
  }

  const session = (Constructor: RecognitionConstructor) => {
    const r = new Constructor()
    r.lang = lang
    r.interimResults = true
    r.continuous = true
    current.current = ''
    r.onresult = (event) => {
      const text = joined(Array.from({ length: event.results.length }, (_, i) => event.results[i]?.[0]?.transcript ?? ''))
      if (text === current.current) return
      current.current = text
      setTranscript(joined([...done.current, text]))
      armSilence()
    }
    r.onerror = (event) => {
      const error = errorOf(event.error)
      if (!error) return
      failure.current = error
      active.current = false
    }
    r.onend = () => {
      if (current.current) done.current.push(current.current)
      current.current = ''
      if (!active.current) return finish()
      // Ended by the browser on a pause: go on listening.
      try {
        session(Constructor)
      } catch {
        finish()
      }
    }
    recognition.current = r
    r.start()
  }

  // Leaving the screen drops what is being said.
  useEffect(
    () => () => {
      active.current = false
      clearSilence()
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
    active.current = true
    done.current = []
    failure.current = null
    setTranscript('')
    setListening(true)
    armSilence()
    try {
      session(Constructor)
    } catch {
      failure.current = offline() ? 'network' : 'notAllowed'
      finish()
    }
  }

  return { supported, listening, transcript, start, stop }
}
