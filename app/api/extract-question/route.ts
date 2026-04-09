import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `You clean up voice-captured questions.
The input is a raw speech-to-text transcript of someone speaking a question informally.
Return ONLY the cleaned-up question as a plain string. No JSON, no arrays, no explanation, no punctuation beyond the question mark.
Fix filler words, false starts, and run-on phrasing. Keep the question natural and concise.
Do not answer the question.
Example input: "um so I wanted to ask you like what do you think we should do for my mum's birthday this year because I haven't heard anything"
Example output: What do you think we should do for my mum's birthday this year?
If there is no clear question in the transcript, return an empty string.`

export async function POST(request: Request) {
  const { transcript }: { transcript: string } = await request.json()

  if (!transcript.trim()) {
    return Response.json({ question: '' })
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: transcript }],
  })

  const raw =
    response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  return Response.json({ question: raw })
}
