'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

type Step = 'checking' | 'prompt' | 'who' | 'subscribing' | 'done' | 'not-pwa' | 'denied'

export default function PushOptIn() {
  const [step, setStep] = useState<Step>('checking')

  useEffect(() => {
    try {
      // Push only works in installed PWAs on iOS, and in modern browsers on desktop
      const hasPush = 'PushManager' in window
      const hasSW = 'serviceWorker' in navigator
      const hasNotification = 'Notification' in window

      if (!hasPush || !hasSW || !hasNotification) {
        // Likely iOS Safari (not installed PWA) or old browser
        setStep('not-pwa')
        return
      }

      if (Notification.permission === 'denied') {
        setStep('denied')
        return
      }

      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(reg => {
          reg.pushManager.getSubscription().then(sub => {
            setStep(sub ? 'done' : 'prompt')
          })
        })
      } else {
        setStep('prompt')
      }
    } catch {
      setStep('not-pwa')
    }
  }, [])

  async function subscribe(user: 'Ji' | 'Barry') {
    setStep('subscribing')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStep('denied')
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
      setStep('not-pwa')
    }
  }

  if (step === 'checking') return null
  if (step === 'done') return null

  if (step === 'not-pwa') {
    return (
      <div className="p-4 rounded-xl bg-secondary mb-4">
        <p className="text-sm opacity-60">
          To get task reminders, open this app from your home screen (Safari → Share → Add to Home Screen).
        </p>
      </div>
    )
  }

  if (step === 'denied') {
    return (
      <div className="p-4 rounded-xl bg-secondary mb-4">
        <p className="text-sm opacity-60">
          Notifications were blocked. To enable, go to Settings → Voice Tasks → Notifications.
        </p>
      </div>
    )
  }

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
