import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `You analyse voice transcripts and extract two things.

Return ONLY valid JSON in this exact format, nothing else:
{ "tasks": [{ "text": "Task text", "assignee": "Ji" | "Barry" | null }], "question": "Question text?" }

The speaker is Ji. Assignment rules:
- "I need to..." / "remind me to..." / "I should..." → assignee: "Ji"
- "Barry needs to..." / "tell Barry to..." / "Barry should..." / "can Barry..." → assignee: "Barry"
- "we need to..." / unclear who → assignee: null

Tasks: actionable things to do. Capitalise the first word. Keep them short and concrete.
Question: a single question the speaker wants to ask someone else. Clean up filler words and false starts. One question only.

If no tasks: "tasks": []
If no clear question: "question": null

Example input: "I need to call the dentist and tell Barry to pick up the dry cleaning"
Example output: { "tasks": [{ "text": "Call the dentist", "assignee": "Ji" }, { "text": "Pick up the dry cleaning", "assignee": "Barry" }], "question": null }

Example input: "we need to book the boiler and also what are we doing for Christmas this year"
Example output: { "tasks": [{ "text": "Book the boiler", "assignee": null }], "question": "What are we doing for Christmas this year?" }

Example input: "um what did you end up deciding about the holiday"
Example output: { "tasks": [], "question": "What did you decide about the holiday?" }`

type TaskItem = { text: string; assignee: 'Ji' | 'Barry' | null }

export async function POST(request: Request) {
  const { transcript }: { transcript: string } = await request.json()

  if (!transcript.trim()) {
    return Response.json({ tasks: [], question: null })
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: transcript }],
  })

  const raw =
    response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let result: { tasks: TaskItem[]; question: string | null }
  try {
    const parsed = JSON.parse(text)
    // Normalise: if Claude returns old string[] format, wrap each as an object
    if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0 && typeof parsed.tasks[0] === 'string') {
      result = {
        tasks: (parsed.tasks as string[]).map(t => ({ text: t, assignee: null })),
        question: parsed.question ?? null,
      }
    } else {
      result = { tasks: parsed.tasks ?? [], question: parsed.question ?? null }
    }
  } catch {
    result = { tasks: [], question: null }
  }

  return Response.json(result)
}
