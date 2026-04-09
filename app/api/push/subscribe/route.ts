import { Redis } from '@upstash/redis'

type PushSubscriptionRecord = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  user: 'Ji' | 'Barry'
  created: string
}

const redis = Redis.fromEnv()
const KEY = 'push-subscriptions'

async function readSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const data = await redis.get<PushSubscriptionRecord[]>(KEY)
  return data ?? []
}

async function writeSubscriptions(subs: PushSubscriptionRecord[]): Promise<void> {
  await redis.set(KEY, subs)
}

export async function POST(request: Request) {
  const { subscription, user }: { subscription: { endpoint: string; keys: { p256dh: string; auth: string } }; user: 'Ji' | 'Barry' } = await request.json()

  const subs = await readSubscriptions()

  // Upsert: replace existing subscription for the same endpoint
  const filtered = subs.filter(s => s.endpoint !== subscription.endpoint)
  filtered.push({
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    user,
    created: new Date().toISOString(),
  })

  await writeSubscriptions(filtered)
  return Response.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: Request) {
  const { endpoint }: { endpoint: string } = await request.json()

  const subs = await readSubscriptions()
  const filtered = subs.filter(s => s.endpoint !== endpoint)

  await writeSubscriptions(filtered)
  return Response.json({ ok: true })
}
