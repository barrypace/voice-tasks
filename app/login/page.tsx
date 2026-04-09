import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    maxAge: 60 * 60 * 24 * 30,
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
    <main className="flex items-center justify-center h-dvh px-6">
      <form action={login} className="flex flex-col gap-4 w-full max-w-xs">
        <h1 className="text-xl font-semibold text-center mb-2">Voice Tasks</h1>
        <Input
          type="password"
          name="password"
          placeholder="Password"
          autoComplete="current-password"
          autoFocus
          required
        />
        <Button type="submit" className="w-full">
          Enter
        </Button>
        {hasError && (
          <p className="text-sm text-destructive text-center">Wrong password. Try again.</p>
        )}
      </form>
    </main>
  )
}
