'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Task } from '../api/tasks/route'

export default function ListView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/tasks')
    setTasks(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggle(id: string) {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  async function clearDone() {
    await fetch('/api/tasks', { method: 'DELETE' })
    load()
  }

  const pending = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm opacity-40">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
      {tasks.length === 0 ? (
        <p className="text-sm opacity-40 text-center mt-8">No tasks yet.</p>
      ) : (
        <ul className="flex flex-col flex-1">
          {pending.map(task => (
            <li
              key={task.id}
              className="py-4 px-1 text-[17px] leading-relaxed border-b border-black/10 dark:border-white/10 cursor-pointer active:opacity-50 transition-opacity"
              onClick={() => toggle(task.id)}
            >
              {task.text}
            </li>
          ))}
          {done.map(task => (
            <li
              key={task.id}
              className="py-4 px-1 text-[17px] leading-relaxed border-b border-black/10 dark:border-white/10 cursor-pointer active:opacity-50 transition-opacity line-through opacity-35"
              onClick={() => toggle(task.id)}
            >
              {task.text}
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <Button variant="outline" size="sm" className="self-center rounded-full" onClick={clearDone}>
          Clear {done.length} done
        </Button>
      )}
    </div>
  )
}
