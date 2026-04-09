'use client'

import { useState } from 'react'
import CaptureView from './CaptureView'
import ListView from './ListView'
import QuestionsView from './QuestionsView'
import styles from './app.module.css'

type View = 'capture' | 'tasks' | 'questions'

export default function AppShell() {
  const [view, setView] = useState<View>('capture')

  return (
    <div className={styles.shell}>
      <div className={styles.content}>
        {view === 'capture' && <CaptureView />}
        {view === 'tasks' && <ListView />}
        {view === 'questions' && <QuestionsView />}
      </div>
      <nav className={styles.nav}>
        <button
          className={view === 'capture' ? styles.navActive : styles.navItem}
          onClick={() => setView('capture')}
        >
          Capture
        </button>
        <button
          className={view === 'tasks' ? styles.navActive : styles.navItem}
          onClick={() => setView('tasks')}
        >
          Tasks
        </button>
        <button
          className={view === 'questions' ? styles.navActive : styles.navItem}
          onClick={() => setView('questions')}
        >
          Questions
        </button>
      </nav>
    </div>
  )
}
