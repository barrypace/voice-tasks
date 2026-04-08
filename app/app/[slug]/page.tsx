import { notFound } from 'next/navigation'
import AppShell from './AppShell'

export default async function AppPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (slug !== process.env.APP_SLUG) {
    notFound()
  }

  return <AppShell />
}
