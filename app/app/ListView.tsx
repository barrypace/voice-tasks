'use client'

import { useEffect, useState } from 'react'
import type { Task } from '../api/tasks/route'
import styles from './app.module.css'

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
    return <div className={styles.listView}><p className={styles.hint}>Loading…</p></div>
  }

  return (
    <div className={styles.listView}>
      {tasks.length === 0 ? (
        <p className={styles.hint}>No tasks yet.</p>
      ) : (
        <ul className={styles.taskList}>
          {pending.map(task => (
            <li key={task.id} className={styles.taskItem} onClick={() => toggle(task.id)}>
              {task.text}
            </li>
          ))}
          {done.map(task => (
            <li key={task.id} className={`${styles.taskItem} ${styles.taskDone}`} onClick={() => toggle(task.id)}>
              {task.text}
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <button onClick={clearDone} className={styles.clearBtn}>
          Clear {done.length} done
        </button>
      )}
    </div>
  )
}
