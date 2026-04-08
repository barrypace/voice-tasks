import { Redis } from '@upstash/redis'

export type Task = {
  id: string
  text: string
  done: boolean
  created: string
}

const redis = Redis.fromEnv()
const KEY = 'tasks'

async function readTasks(): Promise<Task[]> {
  const data = await redis.get<Task[]>(KEY)
  return data ?? []
}

async function writeTasks(tasks: Task[]): Promise<void> {
  await redis.set(KEY, tasks)
}

export async function GET() {
  const tasks = await readTasks()
  return Response.json(tasks)
}

export async function POST(request: Request) {
  const { texts }: { texts: string[] } = await request.json()

  const tasks = await readTasks()
  const now = new Date().toISOString()

  const newTasks: Task[] = texts.map((text) => ({
    id: crypto.randomUUID(),
    text,
    done: false,
    created: now,
  }))

  await writeTasks([...tasks, ...newTasks])
  return Response.json(newTasks, { status: 201 })
}

export async function PATCH(request: Request) {
  const { id }: { id: string } = await request.json()

  const tasks = await readTasks()
  const updated = tasks.map((t) =>
    t.id === id ? { ...t, done: !t.done } : t
  )

  await writeTasks(updated)
  return Response.json(updated)
}

export async function DELETE() {
  const tasks = await readTasks()
  const remaining = tasks.filter((t) => !t.done)

  await writeTasks(remaining)
  return Response.json(remaining)
}
