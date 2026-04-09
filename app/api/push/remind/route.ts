import { Redis } from '@upstash/redis'
import webpush from 'web-push'

type PushSubscriptionRecord = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  user: 'Ji' | 'Barry'
  created: string
}

type Task = {
  id: string
  text: string
  done: boolean
  created: string
  assignee: 'Ji' | 'Barry' | null
}

const redis = Redis.fromEnv()

let vapidConfigured = false
function ensureVapid() {
  if (vapidConfigured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:noreply@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
    process.env.VAPID_PRIVATE_KEY ?? ''
  )
  vapidConfigured = true
}

function isQuietHours(): boolean {
  // Quiet hours: 22:00–08:00 UK time
  const now = new Date()
  const ukHour = parseInt(
    now.toLocaleString('en-GB', { timeZone: 'Europe/London', hour: 'numeric', hour12: false })
  )
  return ukHour >= 22 || ukHour < 8
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (isQuietHours()) {
    return Response.json({ skipped: true, reason: 'quiet hours' })
  }

  ensureVapid()

  const subs = (await redis.get<PushSubscriptionRecord[]>('push-subscriptions')) ?? []
  const tasks = (await redis.get<Task[]>('tasks')) ?? []

  const pendingTasks = tasks.filter(t => !t.done)
  const staleEndpoints: string[] = []

  for (const sub of subs) {
    // Tasks for this user: assigned to them, or unassigned
    const userTasks = pendingTasks.filter(
      t => t.assignee === sub.user || t.assignee === null
    )

    if (userTasks.length === 0) continue

    const first3 = userTasks.slice(0, 3).map(t => t.text)
    const more = userTasks.length > 3 ? `, +${userTasks.length - 3} more` : ''
    const body = first3.join(', ') + more

    const payload = JSON.stringify({
      title: `Hey ${sub.user}, you have tasks`,
      body,
    })

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload
      )
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode
      if (statusCode === 410 || statusCode === 404) {
        staleEndpoints.push(sub.endpoint)
      }
    }
  }

  // Clean up expired subscriptions
  if (staleEndpoints.length > 0) {
    const cleaned = subs.filter(s => !staleEndpoints.includes(s.endpoint))
    await redis.set('push-subscriptions', cleaned)
  }

  return Response.json({ sent: subs.length - staleEndpoints.length, cleaned: staleEndpoints.length })
}
