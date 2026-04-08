'use client'

import { useState } from 'react'
import CaptureView from './CaptureView'
import ListView from './ListView'
import styles from './app.module.css'

type View = 'capture' | 'list'

export default function AppShell() {
  const [view, setView] = useState<View>('capture')

  return (
    <div className={styles.shell}>
      <div className={styles.content}>
        {view === 'capture' ? <CaptureView /> : <ListView />}
      </div>
      <nav className={styles.nav}>
        <button
          className={view === 'capture' ? styles.navActive : styles.navItem}
          onClick={() => setView('capture')}
        >
          Capture
        </button>
        <button
          className={view === 'list' ? styles.navActive : styles.navItem}
          onClick={() => setView('list')}
        >
          List
        </button>
      </nav>
    </div>
  )
}
