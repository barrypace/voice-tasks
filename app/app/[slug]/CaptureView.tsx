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
  const finalTranscriptRef = useRef('')

  function handleButtonClick() {
    if (state === 'idle') startRecording()
    else if (state === 'recording') stopRecording()
  }

  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      setError("Voice recording isn't supported in this browser. Try Chrome.")
      return
    }

    finalTranscriptRef.current = ''
    setTranscript('')
    setError(null)

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-GB'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalText = ''
      let interimText = ''
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalText += result[0].transcript + ' '
        else interimText += result[0].transcript
      }
      finalTranscriptRef.current = finalText
      setTranscript(finalText + interimText)
    }

    recognition.onend = () => {
      const text = finalTranscriptRef.current.trim()
      recognitionRef.current = null
      if (text) extract(text)
      else { setState('idle'); setTranscript('') }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') return
      setError("Couldn't hear anything. Tap to try again.")
      setState('idle')
    }

    recognitionRef.current = recognition
    recognition.start()
    setState('recording')
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    // onend fires → extract() or reset
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
    finalTranscriptRef.current = ''
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
