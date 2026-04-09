'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type State = 'idle' | 'recording' | 'processing' | 'confirming'

export default function CaptureView() {
  const [state, setState] = useState<State>('idle')
  const [transcript, setTranscript] = useState('')
  const [tasks, setTasks] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const accumulatedRef = useRef('')
  const isRecordingRef = useRef(false)

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
    setSavedMsg(null)
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
        setTranscript(accumulatedRef.current.trim())
      } else {
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
        startSession(SpeechRecognitionAPI)
      } else {
        const text = accumulatedRef.current.trim()
        if (text) process(text)
        else { setState('idle'); setTranscript('') }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') return
      if (event.error === 'no-speech') return
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
  }

  async function process(text: string) {
    setState('processing')
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      const data: { tasks: string[]; question: string | null } = await res.json()

      // Save question immediately (silently) if one was captured
      if (data.question) {
        fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: data.question }),
        })
      }

      if (data.tasks.length > 0) {
        setTasks(data.tasks)
        setTranscript(text)
        setState('confirming')
      } else if (data.question) {
        setSavedMsg('Question saved.')
        setState('idle')
        setTimeout(() => setSavedMsg(null), 3000)
      } else {
        setError('Nothing found — try again.')
        setState('idle')
      }
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
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
        <p className="text-sm opacity-50 italic leading-relaxed">"{transcript.trim()}"</p>
        <ul className="flex flex-col gap-3 flex-1">
          {tasks.map((task, i) => (
            <li key={i} className="text-lg px-4 py-4 rounded-xl bg-black/5 dark:bg-white/5 leading-snug">
              {task}
            </li>
          ))}
        </ul>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={reset}>
            Discard
          </Button>
          <Button className="flex-1" onClick={confirm}>
            Add {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
      <button
        className={cn(
          'w-44 h-44 rounded-full border-none cursor-pointer transition-colors bg-red-700',
          state === 'recording' && 'bg-red-900 animate-pulse-record',
          state === 'processing' && 'bg-gray-400 cursor-default'
        )}
        onClick={handleButtonClick}
        disabled={state === 'processing'}
        aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
      />
      {state === 'recording' && (
        <p className="text-[17px] leading-relaxed text-center max-w-xs opacity-75">
          {transcript || 'Listening\u2026'}
        </p>
      )}
      {state === 'idle' && !error && !savedMsg && (
        <p className="text-base opacity-45 text-center">Tap to record</p>
      )}
      {state === 'processing' && (
        <p className="text-base opacity-45 text-center">Thinking\u2026</p>
      )}
      {savedMsg && <p className="text-base opacity-60 text-center">{savedMsg}</p>}
      {error && <p className="text-sm text-red-600 text-center max-w-[280px]">{error}</p>}
    </div>
  )
}
