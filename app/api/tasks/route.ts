import { Redis } from '@upstash/redis'

export type Assignee = 'Ji' | 'Barry' | null

export type Task = {
  id: string
  text: string
  done: boolean
  created: string
  assignee: Assignee
}

const redis = Redis.fromEnv()
const KEY = 'tasks'

async function readTasks(): Promise<Task[]> {
  const data = await redis.get<Task[]>(KEY)
  return (data ?? []).map(t => ({ ...t, assignee: t.assignee ?? null }))
}

async function writeTasks(tasks: Task[]): Promise<void> {
  await redis.set(KEY, tasks)
}

export async function GET() {
  const tasks = await readTasks()
  return Response.json(tasks)
}

export async function POST(request: Request) {
  const body = await request.json()

  const tasks = await readTasks()
  const now = new Date().toISOString()

  // Support both old shape (texts: string[]) and new shape (items: {text, assignee}[])
  let newTasks: Task[]
  if (body.items) {
    newTasks = body.items.map((item: { text: string; assignee?: Assignee }) => ({
      id: crypto.randomUUID(),
      text: item.text,
      done: false,
      created: now,
      assignee: item.assignee ?? null,
    }))
  } else {
    newTasks = (body.texts as string[]).map((text) => ({
      id: crypto.randomUUID(),
      text,
      done: false,
      created: now,
      assignee: null,
    }))
  }

  await writeTasks([...tasks, ...newTasks])
  return Response.json(newTasks, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()

  const tasks = await readTasks()
  let updated: Task[]

  if ('assignee' in body) {
    updated = tasks.map((t) =>
      t.id === body.id ? { ...t, assignee: body.assignee as Assignee } : t
    )
  } else {
    updated = tasks.map((t) =>
      t.id === body.id ? { ...t, done: !t.done } : t
    )
  }

  await writeTasks(updated)
  return Response.json(updated)
}

export async function DELETE() {
  const tasks = await readTasks()
  const remaining = tasks.filter((t) => !t.done)

  await writeTasks(remaining)
  return Response.json(remaining)
}
