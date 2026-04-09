'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Task, Assignee } from '../api/tasks/route'
import PushOptIn from './PushOptIn'

const ASSIGNEE_ORDER: Assignee[] = [null, 'Ji', 'Barry']

function AssigneeBadge({ assignee, onClick }: { assignee: Assignee; onClick: () => void }) {
  const label = assignee === 'Ji' ? 'Ji' : assignee === 'Barry' ? 'B' : '?'
  const bgClass = assignee === 'Ji' ? 'bg-badge-ji' : assignee === 'Barry' ? 'bg-badge-barry' : 'bg-badge-none'
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn('w-7 h-7 rounded-full text-xs font-semibold shrink-0 border-none cursor-pointer text-white', bgClass)}
      aria-label={`Assigned to ${assignee ?? 'nobody'}. Tap to change.`}
    >
      {label}
    </button>
  )
}

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

  async function cycleAssignee(id: string, current: Assignee) {
    const currentIdx = ASSIGNEE_ORDER.indexOf(current)
    const next = ASSIGNEE_ORDER[(currentIdx + 1) % ASSIGNEE_ORDER.length]
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, assignee: next }),
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
      <PushOptIn />
      {tasks.length === 0 ? (
        <p className="text-sm opacity-40 text-center mt-8">No tasks yet.</p>
      ) : (
        <ul className="flex flex-col flex-1">
          {pending.map(task => (
            <li
              key={task.id}
              className="py-4 px-1 text-[17px] leading-relaxed border-b border-border cursor-pointer active:opacity-50 transition-opacity flex items-center justify-between gap-3"
              onClick={() => toggle(task.id)}
            >
              <span>{task.text}</span>
              <AssigneeBadge assignee={task.assignee} onClick={() => cycleAssignee(task.id, task.assignee)} />
            </li>
          ))}
          {done.map(task => (
            <li
              key={task.id}
              className="py-4 px-1 text-[17px] leading-relaxed border-b border-border cursor-pointer active:opacity-50 transition-opacity line-through opacity-35 flex items-center justify-between gap-3"
              onClick={() => toggle(task.id)}
            >
              <span>{task.text}</span>
              <AssigneeBadge assignee={task.assignee} onClick={() => cycleAssignee(task.id, task.assignee)} />
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
