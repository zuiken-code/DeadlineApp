import {
  buildPushPayload,
  type PushSubscription as WebPushSubscription,
} from '@block65/webcrypto-web-push'

type Env = {
  ASSETS: Fetcher
  SUBSCRIPTIONS?: KVNamespace
  VAPID_PUBLIC_KEY?: string
  VAPID_PRIVATE_KEY?: string
  VAPID_SUBJECT?: string
}

type GoalForNotification = {
  title: string
  deadline: string
}

type StoredSubscription = {
  subscription: WebPushSubscription
  goal: GoalForNotification
  notificationTime: string
  timeZone: string
  updatedAt: string
}

type SubscriptionMetadata = Pick<StoredSubscription, 'notificationTime' | 'timeZone'> & {
  deadline: string
}

type ScheduledAction =
  | { type: 'delete'; key: string }
  | { type: 'send'; key: string; today: string }

const SUBSCRIPTION_PREFIX = 'subscription:'
const FIFTEEN_MINUTE_TIME = /^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/
const DATE_VALUE = /^(\d{4})-(\d{2})-(\d{2})$/
const MAX_GOAL_TITLE_LENGTH = 80
const RESPONSE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: RESPONSE_HEADERS })
}

function isConfigured(env: Env) {
  return Boolean(env.SUBSCRIPTIONS && env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY)
}

function getMissingConfiguration(env: Env) {
  const missing: string[] = []
  if (!env.SUBSCRIPTIONS) missing.push('SUBSCRIPTIONS')
  if (!env.VAPID_PUBLIC_KEY) missing.push('VAPID_PUBLIC_KEY')
  if (!env.VAPID_PRIVATE_KEY) missing.push('VAPID_PRIVATE_KEY')
  return missing
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE_VALUE.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 80) return false
  try {
    new Intl.DateTimeFormat('ja-JP', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

function isPushSubscription(value: unknown): value is WebPushSubscription {
  if (!value || typeof value !== 'object') return false
  const subscription = value as Partial<WebPushSubscription>
  if (typeof subscription.endpoint !== 'string' || !subscription.endpoint.startsWith('https://')) return false
  if (!subscription.keys || typeof subscription.keys !== 'object') return false
  return typeof subscription.keys.auth === 'string' && typeof subscription.keys.p256dh === 'string'
}

function parseStoredSubscription(value: unknown): StoredSubscription | null {
  if (!value || typeof value !== 'object') return null
  const input = value as Partial<StoredSubscription>
  const title = input.goal?.title?.trim()
  if (!title || title.length > MAX_GOAL_TITLE_LENGTH || !isValidDate(input.goal?.deadline)) return null
  if (!isPushSubscription(input.subscription)) return null
  if (typeof input.notificationTime !== 'string' || !FIFTEEN_MINUTE_TIME.test(input.notificationTime)) return null
  if (!isValidTimeZone(input.timeZone)) return null

  return {
    subscription: input.subscription,
    goal: { title, deadline: input.goal.deadline },
    notificationTime: input.notificationTime,
    timeZone: input.timeZone,
    updatedAt: new Date().toISOString(),
  }
}

async function subscriptionKey(endpoint: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${SUBSCRIPTION_PREFIX}${hash}`
}

async function readJson(request: Request) {
  const length = Number(request.headers.get('content-length') ?? '0')
  if (length > 16_384) throw new Error('request-too-large')
  return request.json() as Promise<unknown>
}

async function registerSubscription(request: Request, env: Env) {
  if (!isSameOrigin(request)) return json({ error: '許可されていない送信元です。' }, 403)
  if (!isConfigured(env) || !env.SUBSCRIPTIONS) return json({ error: '通知サーバーの準備が完了していません。' }, 503)

  try {
    const input = await readJson(request)
    const subscription = parseStoredSubscription(input)
    if (!subscription) return json({ error: '通知設定の内容が正しくありません。' }, 400)
    const sendTest = Boolean(input && typeof input === 'object' && (input as { sendTest?: unknown }).sendTest === true)

    const key = await subscriptionKey(subscription.subscription.endpoint)
    const expiration = Math.max(
      Math.floor(Date.parse(`${subscription.goal.deadline}T00:00:00Z`) / 1000) + 31 * 24 * 60 * 60,
      Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    )

    await env.SUBSCRIPTIONS.put(key, JSON.stringify(subscription), {
      expiration,
      metadata: {
        notificationTime: subscription.notificationTime,
        timeZone: subscription.timeZone,
        deadline: subscription.goal.deadline,
      } satisfies SubscriptionMetadata,
    })

    if (sendTest) {
      try {
        const today = getZonedDateTime(Date.now(), subscription.timeZone).date
        const remainingDays = Math.max(0, calendarDaysBetween(today, subscription.goal.deadline))
        const response = await sendPush(subscription.subscription, {
          title: '期限くん',
          body: `${subscription.goal.title}まで残り${remainingDays}日！がんばろう`,
          icon: 'pwa-192x192.png',
          badge: 'pwa-192x192.png',
          url: './',
          tag: `deadline-test-${Date.now()}`,
        }, env, 'high')
        if (!response.ok) {
          console.error(`Test push rejected: ${response.status} ${await response.text()}`)
          if (response.status === 404 || response.status === 410) {
            await env.SUBSCRIPTIONS.delete(key)
            return json({ error: '通知先の登録が期限切れです。もう一度通知をオンにしてください。' }, 410)
          }
          const detail = response.status === 401 || response.status === 403
            ? '通知の認証に失敗しました。VAPID鍵の設定を確認してください。'
            : `通知サービスへの送信に失敗しました（HTTP ${response.status}）。`
          return json({ error: detail }, 502)
        }
      } catch (error) {
        console.error('Test push failed', error)
        return json({ error: 'テスト通知を送れませんでした。通信状態を確認して再度お試しください。' }, 502)
      }
    }

    return json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'request-too-large') {
      return json({ error: '通知設定のデータが大きすぎます。' }, 413)
    }
    console.error('Failed to register push subscription', error)
    return json({ error: '通知設定を保存できませんでした。' }, 500)
  }
}

async function deleteSubscription(request: Request, env: Env) {
  if (!isSameOrigin(request)) return json({ error: '許可されていない送信元です。' }, 403)
  if (!env.SUBSCRIPTIONS) return json({ success: true })

  try {
    const body = await readJson(request) as { endpoint?: unknown }
    if (typeof body.endpoint !== 'string' || !body.endpoint.startsWith('https://')) {
      return json({ error: '通知情報が正しくありません。' }, 400)
    }
    await env.SUBSCRIPTIONS.delete(await subscriptionKey(body.endpoint))
    return json({ success: true })
  } catch (error) {
    console.error('Failed to delete push subscription', error)
    return json({ error: '通知設定を削除できませんでした。' }, 500)
  }
}

async function handleApi(request: Request, env: Env) {
  const { pathname } = new URL(request.url)
  if (pathname === '/api/push/config' && request.method === 'GET') {
    if (!isConfigured(env)) {
      const missing = getMissingConfiguration(env)
      return json({
        available: false,
        error: `Cloudflareの通知設定が不足しています: ${missing.join(', ')}`,
      }, 503)
    }
    return json({ available: true, publicKey: env.VAPID_PUBLIC_KEY })
  }
  if (pathname === '/api/push/subscription' && request.method === 'POST') {
    return registerSubscription(request, env)
  }
  if (pathname === '/api/push/subscription' && request.method === 'DELETE') {
    return deleteSubscription(request, env)
  }
  return json({ error: 'Not found' }, 404)
}

function getZonedDateTime(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  }
}

function calendarDaysBetween(from: string, to: string) {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)
  return Math.round(
    (Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86_400_000,
  )
}

type NotificationData = {
  title: string
  body: string
  icon: string
  badge: string
  url: string
  tag: string
}

async function sendPush(subscription: WebPushSubscription, data: NotificationData, env: Env, urgency: 'normal' | 'high') {
  const payload = await buildPushPayload({
    data,
    options: {
      ttl: 60 * 60 * 6,
      urgency,
    },
  }, subscription, {
    subject: env.VAPID_SUBJECT || 'https://deadlineapp.zuiken.workers.dev/',
    publicKey: env.VAPID_PUBLIC_KEY!,
    privateKey: env.VAPID_PRIVATE_KEY!,
  })
  return fetch(subscription.endpoint, payload)
}

async function sendNotification(key: string, today: string, env: Env) {
  if (!env.SUBSCRIPTIONS || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return
  const stored = await env.SUBSCRIPTIONS.get<StoredSubscription>(key, 'json')
  if (!stored) return

  const remainingDays = calendarDaysBetween(today, stored.goal.deadline)
  if (remainingDays < 0) {
    await env.SUBSCRIPTIONS.delete(key)
    return
  }

  try {
    const response = await sendPush(stored.subscription, {
      title: '期限くん',
      body: `${stored.goal.title}まで残り${remainingDays}日！がんばろう`,
      icon: 'pwa-192x192.png',
      badge: 'pwa-192x192.png',
      url: './',
      tag: `deadline-${today}`,
    }, env, 'normal')
    if (response.status === 404 || response.status === 410) {
      await env.SUBSCRIPTIONS.delete(key)
    } else if (!response.ok) {
      console.error(`Push delivery failed: ${response.status} ${await response.text()}`)
    }
  } catch (error) {
    console.error('Push delivery failed', error)
  }
}

async function sendScheduledNotifications(timestamp: number, env: Env) {
  if (!isConfigured(env) || !env.SUBSCRIPTIONS) {
    console.warn('Push notifications are not configured')
    return
  }

  let cursor: string | undefined
  do {
    const page = await env.SUBSCRIPTIONS.list<SubscriptionMetadata>({
      prefix: SUBSCRIPTION_PREFIX,
      limit: 1000,
      cursor,
    })

    const matching: ScheduledAction[] = []
    for (const key of page.keys) {
      if (!key.metadata || !isValidTimeZone(key.metadata.timeZone)) continue
      const current = getZonedDateTime(timestamp, key.metadata.timeZone)
      if (current.date > key.metadata.deadline) {
        matching.push({ type: 'delete', key: key.name })
        continue
      }
      if (current.time === key.metadata.notificationTime) {
        matching.push({ type: 'send', key: key.name, today: current.date })
      }
    }

    for (let index = 0; index < matching.length; index += 20) {
      const batch = matching.slice(index, index + 20)
      await Promise.all(batch.map((item) => (
        item.type === 'delete'
          ? env.SUBSCRIPTIONS!.delete(item.key)
          : sendNotification(item.key, item.today, env)
      )))
    }

    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.startsWith('/api/push/')) {
      return handleApi(request, env)
    }
    return env.ASSETS.fetch(request)
  },
  scheduled(controller, env, context) {
    context.waitUntil(sendScheduledNotifications(controller.scheduledTime, env))
  },
} satisfies ExportedHandler<Env>
