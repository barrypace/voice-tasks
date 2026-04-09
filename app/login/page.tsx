import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import styles from './login.module.css'

async function login(formData: FormData) {
  'use server'

  const submitted = (formData.get('password') as string) ?? ''
  const expected = process.env.APP_PASSWORD ?? ''

  let match = false
  const submittedBuf = Buffer.from(submitted)
  const expectedBuf = Buffer.from(expected)
  if (submittedBuf.length === expectedBuf.length) {
    match = timingSafeEqual(submittedBuf, expectedBuf)
  }

  if (!match) {
    redirect('/login?error=1')
  }

  const token = createHmac('sha256', process.env.APP_SECRET ?? '')
    .update(process.env.APP_PASSWORD ?? '')
    .digest('hex')

  const cookieStore = await cookies()
  cookieStore.set('vt-auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  redirect('/app')
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const hasError = params.error === '1'

  return (
    <main className={styles.page}>
      <form action={login} className={styles.form}>
        <h1 className={styles.title}>Voice Tasks</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoComplete="current-password"
          autoFocus
          required
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Enter
        </button>
        {hasError && <p className={styles.error}>Wrong password. Try again.</p>}
      </form>
    </main>
  )
}
