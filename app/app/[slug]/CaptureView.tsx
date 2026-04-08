'use client'

import { useState, useRef } from 'react'
import styles from './app.module.css'

type State = 'idle' | 'recording' | 'processing' | 'confirming'

export default function CaptureView() {
  const [state, setState] = useState<State>('idle')
  const [transcript, setTranscript] = useState('')
  const [tasks, setTasks] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const accumulatedRef = useRef('')    // text built up across iOS restart sessions
  const isRecordingRef = useRef(false) // user's intent — survives recognition restarts

  function handleButtonClick() {
    if (state === 'idle') startRecording()
    else if (state === 'recording') stopRecording()
  }

  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      setError("Voice recording isn't supported in this browser.")
      return
    }

    accumulatedRef.current = ''
    isRecordingRef.current = true
    setTranscript('')
    setError(null)
    setState('recording')

    startSession(SpeechRecognitionAPI)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function startSession(SpeechRecognitionAPI: any) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    const recognition = new SpeechRecognitionAPI()
    // iOS stops recognition after each utterance when continuous=true
    recognition.continuous = !isIOS
    // interim results are unreliable on iOS
    recognition.interimResults = !isIOS
    recognition.lang = 'en-GB'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      if (isIOS) {
        // On iOS: no interim results, one final per session — accumulate across restarts
        let sessionText = ''
        for (let i = 0; i < event.results.length; i++) {
          sessionText += event.results[i][0].transcript + ' '
        }
        accumulatedRef.current += sessionText
        setTranscript(accumulatedRef.current.trim())
      } else {
        // Desktop: rebuild full text from all results each time onresult fires
        let finalText = ''
        let interimText = ''
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) finalText += result[0].transcript + ' '
          else interimText += result[0].transcript
        }
        accumulatedRef.current = finalText
        setTranscript(finalText + interimText)
      }
    }

    recognition.onend = () => {
      recognitionRef.current = null
      if (isRecordingRef.current) {
        // User hasn't tapped stop — restart to keep listening (expected on iOS)
        startSession(SpeechRecognitionAPI)
      } else {
        // User tapped stop — extract whatever was captured
        const text = accumulatedRef.current.trim()
        if (text) extract(text)
        else { setState('idle'); setTranscript('') }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') return
      if (event.error === 'no-speech') return // onend will restart the session
      if (event.error === 'not-allowed') {
        isRecordingRef.current = false
        setError('Microphone access was blocked. Go to Settings > Safari > Microphone and allow access.')
        setState('idle')
        return
      }
      if (event.error === 'network') {
        isRecordingRef.current = false
        setError('Network error. Check your connection and try again.')
        setState('idle')
        return
      }
      isRecordingRef.current = false
      setError("Couldn't hear anything. Tap to try again.")
      setState('idle')
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopRecording() {
    isRecordingRef.current = false
    recognitionRef.current?.stop()
    // onend fires → sees isRecordingRef.current=false → extracts
  }

  async function extract(text: string) {
    setState('processing')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      const data = await res.json()
      if (data.tasks.length === 0) {
        setError('No tasks found — try again.')
        setState('idle')
        return
      }
      setTasks(data.tasks)
      setTranscript(text)
      setState('confirming')
    } catch {
      setError('Something went wrong. Tap to try again.')
      setState('idle')
    }
  }

  async function confirm() {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: tasks }),
    })
    reset()
  }

  function reset() {
    setTranscript('')
    setTasks([])
    setError(null)
    setState('idle')
    accumulatedRef.current = ''
    isRecordingRef.current = false
  }

  if (state === 'confirming') {
    return (
      <div className={styles.confirmView}>
        <p className={styles.heard}>"{transcript.trim()}"</p>
        <ul className={styles.extractedList}>
          {tasks.map((task, i) => (
            <li key={i} className={styles.extractedItem}>{task}</li>
          ))}
        </ul>
        <div className={styles.confirmActions}>
          <button onClick={reset} className={styles.discardBtn}>Discard</button>
          <button onClick={confirm} className={styles.confirmBtn}>
            Add {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.captureView}>
      <button
        className={`${styles.recordBtn} ${state === 'recording' ? styles.recordingActive : ''}`}
        onClick={handleButtonClick}
        disabled={state === 'processing'}
        aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
      />
      {state === 'recording' && (
        <p className={styles.interimText}>
          {transcript || 'Listening…'}
        </p>
      )}
      {state === 'idle' && !error && (
        <p className={styles.hint}>Tap to record</p>
      )}
      {state === 'processing' && (
        <p className={styles.hint}>Thinking…</p>
      )}
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}
