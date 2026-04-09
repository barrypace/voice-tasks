import { Redis } from '@upstash/redis'

export type Question = {
  id: string
  text: string
  seen: boolean
  created: string
}

const redis = Redis.fromEnv()
const KEY = 'questions'

async function readQuestions(): Promise<Question[]> {
  const data = await redis.get<Question[]>(KEY)
  return data ?? []
}

async function writeQuestions(questions: Question[]): Promise<void> {
  await redis.set(KEY, questions)
}

export async function GET() {
  const questions = await readQuestions()
  return Response.json(questions)
}

export async function POST(request: Request) {
  const { text }: { text: string } = await request.json()

  const questions = await readQuestions()
  const newQuestion: Question = {
    id: crypto.randomUUID(),
    text,
    seen: false,
    created: new Date().toISOString(),
  }

  await writeQuestions([...questions, newQuestion])
  return Response.json(newQuestion, { status: 201 })
}

export async function PATCH(request: Request) {
  const { id }: { id: string } = await request.json()

  const questions = await readQuestions()
  const updated = questions.map((q) =>
    q.id === id ? { ...q, seen: !q.seen } : q
  )

  await writeQuestions(updated)
  return Response.json(updated)
}

export async function DELETE() {
  const questions = await readQuestions()
  const remaining = questions.filter((q) => !q.seen)

  await writeQuestions(remaining)
  return Response.json(remaining)
}
