import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `You analyse voice transcripts and extract two things.

Return ONLY valid JSON in this exact format, nothing else:
{ "tasks": ["Task 1", "Task 2"], "question": "Question text?" }

Tasks: actionable things to do. Capitalise the first word. Keep them short and concrete.
Question: a single question the speaker wants to ask someone else. Clean up filler words and false starts. One question only.

If no tasks: "tasks": []
If no clear question: "question": null

Example input: "we need to book the boiler and also what are we doing for Christmas this year"
Example output: { "tasks": ["Book the boiler"], "question": "What are we doing for Christmas this year?" }

Example input: "remind me to call the dentist"
Example output: { "tasks": ["Call the dentist"], "question": null }

Example input: "um what did you end up deciding about the holiday"
Example output: { "tasks": [], "question": "What did you decide about the holiday?" }`

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

  let result: { tasks: string[]; question: string | null }
  try {
    result = JSON.parse(text)
  } catch {
    result = { tasks: [], question: null }
  }

  return Response.json(result)
}
