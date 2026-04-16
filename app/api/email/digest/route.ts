import { Redis } from '@upstash/redis'
import { Resend } from 'resend'

type Task = {
  id: string
  text: string
  done: boolean
  created: string
  assignee: 'Ji' | 'Barry' | null
}

type Question = {
  id: string
  text: string
  seen: boolean
  created: string
}

const redis = Redis.fromEnv()

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const APP_URL = 'https://voice-tasks-xi.vercel.app/app'

function isUk5pm(): boolean {
  const now = new Date()
  const ukHour = parseInt(
    now.toLocaleString('en-GB', { timeZone: 'Europe/London', hour: 'numeric', hour12: false })
  )
  // Vercel Hobby limits us to one daily cron scheduling (16:00 UTC)
  // This means 5 PM in summer (BST) but 4 PM in winter (GMT)
  return ukHour === 16 || ukHour === 17
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
    day: 'numeric',
    month: 'short',
  })
}

function assigneeBadge(assignee: 'Ji' | 'Barry' | null): string {
  if (!assignee) return ''
  const colour = assignee === 'Ji' ? '#7c3aed' : '#2563eb'
  return `<span style="display:inline-block;background:${colour};color:#fff;font-size:11px;padding:2px 6px;border-radius:4px;margin-right:6px;">${assignee}</span>`
}

function buildEmailHtml(tasks: Task[], questions: Question[]): string {
  const pendingTasks = tasks.filter(t => !t.done)
  const unseenQuestions = questions.filter(q => !q.seen)

  let taskRows = ''
  if (pendingTasks.length === 0) {
    taskRows = '<p style="color:#888;font-style:italic;">No pending tasks — nice one 🎉</p>'
  } else {
    taskRows = pendingTasks
      .map(
        t =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${assigneeBadge(t.assignee)}${escapeHtml(t.text)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#888;font-size:13px;white-space:nowrap;">${formatDate(t.created)}</td>
          </tr>`
      )
      .join('')
    taskRows = `<table style="width:100%;border-collapse:collapse;">${taskRows}</table>`
  }

  let questionRows = ''
  if (unseenQuestions.length === 0) {
    questionRows = '<p style="color:#888;font-style:italic;">No unseen questions</p>'
  } else {
    questionRows = unseenQuestions
      .map(
        q =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(q.text)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#888;font-size:13px;white-space:nowrap;">${formatDate(q.created)}</td>
          </tr>`
      )
      .join('')
    questionRows = `<table style="width:100%;border-collapse:collapse;">${questionRows}</table>`
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;">
  <h2 style="margin:0 0 4px 0;font-size:20px;">📋 Voice Tasks — Daily Digest</h2>
  <p style="margin:0 0 24px 0;color:#888;font-size:14px;">${new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/London', weekday: 'long', day: 'numeric', month: 'long' })}</p>

  <h3 style="margin:0 0 12px 0;font-size:16px;color:#333;">Tasks (${pendingTasks.length} pending)</h3>
  ${taskRows}

  <h3 style="margin:24px 0 12px 0;font-size:16px;color:#333;">Questions (${unseenQuestions.length} unseen)</h3>
  ${questionRows}

  <p style="margin:32px 0 0 0;">
    <a href="${APP_URL}" style="display:inline-block;background:#c92a2a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">Open Voice Tasks</a>
  </p>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const isTest = url.searchParams.get('test') === 'true'

  // Only send when it's actually 5 PM UK time (handles BST/GMT), unless in test mode
  if (!isUk5pm() && !isTest) {
    return Response.json({ skipped: true, reason: 'not 5 PM UK time' })
  }

  const emailTo = process.env.DIGEST_EMAIL_TO
  if (!emailTo) {
    return Response.json({ error: 'DIGEST_EMAIL_TO not configured' }, { status: 500 })
  }

  const tasks = (await redis.get<Task[]>('tasks')) ?? []
  const questions = (await redis.get<Question[]>('questions')) ?? []

  const pendingCount = tasks.filter(t => !t.done).length
  const unseenCount = questions.filter(q => !q.seen).length

  const html = buildEmailHtml(tasks, questions)

  const { error } = await getResend().emails.send({
    from: process.env.DIGEST_EMAIL_FROM ?? 'Voice Tasks <onboarding@resend.dev>',
    to: emailTo,
    subject: `Voice Tasks — ${pendingCount} task${pendingCount !== 1 ? 's' : ''}, ${unseenCount} question${unseenCount !== 1 ? 's' : ''}`,
    html,
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ sent: true, pendingCount, unseenCount })
}
