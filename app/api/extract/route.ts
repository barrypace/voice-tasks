import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `You extract actionable tasks from spoken transcripts.
The speaker will use natural, unstructured language — filler words, false starts, run-on sentences, and multiple tasks jumbled together are all normal.
Return ONLY a valid JSON array of task strings. No explanation, no markdown fences, just the raw array.
Capitalise the first word of each task. Keep tasks short and concrete.
Example input: "we need to book the boiler service and I think we're out of olive oil and can you remind me to call mum on Sunday"
Example output: ["Book boiler service", "Buy olive oil", "Call mum on Sunday"]
If there are no clear actionable tasks, return an empty array: []`

export async function POST(request: Request) {
  const { transcript }: { transcript: string } = await request.json()

  if (!transcript.trim()) {
    return Response.json({ tasks: [] })
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: transcript }],
  })

  const raw =
    response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let tasks: string[]
  try {
    tasks = JSON.parse(text)
  } catch {
    tasks = []
  }

  return Response.json({ tasks })
}
