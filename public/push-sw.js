self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data?.text() }
  }

  const scope = self.registration.scope
  const options = {
    body: data.body || '目標を確認しましょう',
    icon: new URL(data.icon || 'pwa-192x192.png', scope).href,
    badge: new URL(data.badge || 'pwa-192x192.png', scope).href,
    tag: data.tag || 'deadline-reminder',
    data: { url: new URL(data.url || './', scope).href },
  }

  event.waitUntil(self.registration.showNotification(data.title || '期限くん', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || self.registration.scope

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find((client) => client.url.startsWith(self.registration.scope))
    if (existing) {
      if ('navigate' in existing) await existing.navigate(targetUrl)
      return existing.focus()
    }
    return self.clients.openWindow(targetUrl)
  })())
})
