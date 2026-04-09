self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Voice Tasks'
  const options = {
    body: data.body ?? 'You have pending tasks',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'task-reminder',
    renotify: true,
    data: { url: '/app' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/app'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})
