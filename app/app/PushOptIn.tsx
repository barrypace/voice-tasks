'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

type Step = 'checking' | 'prompt' | 'who' | 'subscribing' | 'done' | 'unsupported'

export default function PushOptIn() {
  const [step, setStep] = useState<Step>('checking')

  useEffect(() => {
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) {
      setStep('unsupported')
      return
    }
    if (Notification.permission === 'granted') {
      // Check if already subscribed
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setStep(sub ? 'done' : 'prompt')
        })
      })
    } else if (Notification.permission === 'denied') {
      setStep('unsupported')
    } else {
      setStep('prompt')
    }
  }, [])

  async function subscribe(user: 'Ji' | 'Barry') {
    setStep('subscribing')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStep('unsupported')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON(), user }),
      })

      setStep('done')
    } catch {
      setStep('unsupported')
    }
  }

  if (step === 'checking' || step === 'done' || step === 'unsupported') return null

  if (step === 'who') {
    return (
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-secondary mb-4">
        <span className="text-sm">Who are you?</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => subscribe('Ji')}>Ji</Button>
          <Button size="sm" variant="outline" onClick={() => subscribe('Barry')}>Barry</Button>
        </div>
      </div>
    )
  }

  if (step === 'subscribing') {
    return (
      <div className="p-4 rounded-xl bg-secondary mb-4">
        <p className="text-sm opacity-50">Setting up reminders…</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-secondary mb-4">
      <span className="text-sm">Get task reminders every few hours?</span>
      <Button size="sm" onClick={() => setStep('who')}>Enable</Button>
    </div>
  )
}
