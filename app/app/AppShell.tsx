'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import CaptureView from './CaptureView'
import ListView from './ListView'
import QuestionsListView from './QuestionsListView'

type View = 'capture' | 'tasks' | 'questions'

export default function AppShell() {
  const [view, setView] = useState<View>('capture')

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'capture' && <CaptureView />}
        {view === 'tasks' && <ListView />}
        {view === 'questions' && <QuestionsListView />}
      </div>
      <nav className="flex border-t border-border shrink-0">
        {(['capture', 'tasks', 'questions'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'flex-1 py-4 text-[15px] border-none bg-transparent text-inherit cursor-pointer capitalize transition-opacity',
              view === v ? 'opacity-100 font-semibold' : 'opacity-40'
            )}
          >
            {v}
          </button>
        ))}
      </nav>
    </div>
  )
}
