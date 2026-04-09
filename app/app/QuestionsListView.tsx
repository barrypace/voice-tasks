'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Question } from '../api/questions/route'

export default function QuestionsListView() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/questions')
    const data: Question[] = await res.json()
    data.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    setQuestions(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleSeen(id: string) {
    await fetch('/api/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  async function clearSeen() {
    await fetch('/api/questions', { method: 'DELETE' })
    load()
  }

  const pending = questions.filter(q => !q.seen)
  const seen = questions.filter(q => q.seen)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm opacity-40">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
      {questions.length === 0 ? (
        <p className="text-sm opacity-40 text-center mt-8">No questions yet.</p>
      ) : (
        <ul className="flex flex-col flex-1">
          {pending.map(q => (
            <li
              key={q.id}
              className="py-4 px-1 text-base leading-relaxed border-b border-border cursor-pointer active:opacity-50 transition-opacity"
              onClick={() => toggleSeen(q.id)}
            >
              {q.text}
            </li>
          ))}
          {seen.map(q => (
            <li
              key={q.id}
              className="py-4 px-1 text-base leading-relaxed border-b border-border cursor-pointer active:opacity-50 transition-opacity line-through opacity-35"
              onClick={() => toggleSeen(q.id)}
            >
              {q.text}
            </li>
          ))}
        </ul>
      )}
      {seen.length > 0 && (
        <Button variant="outline" size="sm" className="self-center rounded-full" onClick={clearSeen}>
          Clear {seen.length} seen
        </Button>
      )}
    </div>
  )
}
