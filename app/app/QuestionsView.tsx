'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './app.module.css'

type QState = 'idle' | 'recording' | 'processing'

type Question = {
  id: string
  text: string
  seen: boolean
  created: string
}

export default function QuestionsView() {
  const [state, setState] = useState<QState>('idle')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const accumulatedRef = useRef('')
  const isRecordingRef = useRef(false)

  useEffect(() => { loadQuestions() }, [])

  async function loadQuestions() {
    const res = await fetch('/api/questions')
    const data: Question[] = await res.json()
    data.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    setQuestions(data)
    setLoading(false)
  }

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
    setError(null)
    setState('recording')
    startSession(SpeechRecognitionAPI)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function startSession(SpeechRecognitionAPI: any) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = !isIOS
    recognition.interimResults = !isIOS
    recognition.lang = 'en-GB'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      if (isIOS) {
        let sessionText = ''
        for (let i = 0; i < event.results.length; i++) {
          sessionText += event.results[i][0].transcript + ' '
        }
        accumulatedRef.current += sessionText
      } else {
        let finalText = ''
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalText += event.results[i][0].transcript + ' '
        }
        accumulatedRef.current = finalText
      }
    }

    recognition.onend = () => {
      recognitionRef.current = null
      if (isRecordingRef.current) {
        startSession(SpeechRecognitionAPI)
      } else {
        const text = accumulatedRef.current.trim()
        if (text.length >= 3) {
          saveQuestion(text)
        } else {
          setState('idle')
          setError('Nothing captured — tap to try again.')
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') return
      if (event.error === 'no-speech') return
      if (event.error === 'not-allowed') {
        isRecordingRef.current = false
        setError('Microphone access was blocked. Check Settings > Safari > Microphone.')
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
  }

  async function saveQuestion(transcript: string) {
    setState('processing')
    try {
      const extractRes = await fetch('/api/extract-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      const { question } = await extractRes.json()

      if (!question) {
        setError('No clear question found — tap to try again.')
        setState('idle')
        return
      }

      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: question }),
      })

      accumulatedRef.current = ''
      isRecordingRef.current = false
      setState('idle')
      loadQuestions()
    } catch {
      setError('Something went wrong. Tap to try again.')
      setState('idle')
    }
  }

  async function toggleSeen(id: string) {
    await fetch('/api/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadQuestions()
  }

  async function clearSeen() {
    await fetch('/api/questions', { method: 'DELETE' })
    loadQuestions()
  }

  const pending = questions.filter(q => !q.seen)
  const seen = questions.filter(q => q.seen)

  const hintText =
    state === 'recording' ? 'Listening…' :
    state === 'processing' ? 'Saving…' :
    'Tap to record a question'

  return (
    <div className={styles.questionsView}>
      <div className={styles.questionCaptureArea}>
        <button
          className={`${styles.questionBtn} ${state === 'recording' ? styles.questionBtnActive : ''}`}
          onClick={handleButtonClick}
          disabled={state === 'processing'}
          aria-label={state === 'recording' ? 'Stop recording' : 'Record question'}
        />
        <p className={styles.hint}>{hintText}</p>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>

      <div className={styles.questionListArea}>
        {loading ? (
          <p className={styles.hint}>Loading…</p>
        ) : questions.length === 0 ? (
          <p className={styles.hint}>No questions yet.</p>
        ) : (
          <ul className={styles.questionList}>
            {pending.map(q => (
              <li key={q.id} className={styles.questionItem} onClick={() => toggleSeen(q.id)}>
                {q.text}
              </li>
            ))}
            {seen.map(q => (
              <li key={q.id} className={`${styles.questionItem} ${styles.questionSeen}`} onClick={() => toggleSeen(q.id)}>
                {q.text}
              </li>
            ))}
          </ul>
        )}
        {seen.length > 0 && (
          <button onClick={clearSeen} className={styles.clearBtn}>
            Clear {seen.length} seen
          </button>
        )}
      </div>
    </div>
  )
}
