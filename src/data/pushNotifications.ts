import type { Goal } from './appStorage'

export type PushStatus = 'loading' | 'unsupported' | 'unavailable' | 'disabled' | 'enabled' | 'denied' | 'busy' | 'error'

export type PushStatusCheck = {
  status: PushStatus
  message?: string
}

type PushConfig = {
  available: boolean
  publicKey?: string
  error?: string
}

const API_ROOT = `${import.meta.env.BASE_URL}api/push`
const SERVICE_WORKER_TIMEOUT = 5000
const API_TIMEOUT = 10000

function supportsPushNotifications() {
  return window.isSecureContext
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replaceAll('-', '+').replaceAll('_', '/')
  const bytes = window.atob(base64)
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0))
}

async function getServiceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('Service Workerを準備できませんでした。')), SERVICE_WORKER_TIMEOUT)
    }),
  ])
}

async function fetchConfig() {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT)
  let response: Response

  try {
    response = await fetch(`${API_ROOT}/config`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('通知サーバーから応答がありません。通信状態を確認して、もう一度設定を押してください。')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }

  const data = await response.json().catch(() => ({ available: false })) as PushConfig
  if (!response.ok || !data.available || !data.publicKey) {
    throw new Error(data.error || '通知サーバーの準備が完了していません。')
  }
  return data.publicKey
}

async function saveSubscription(subscription: PushSubscription, goal: Goal, notificationTime: string) {
  const response = await fetch(`${API_ROOT}/subscription`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      goal,
      notificationTime,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tokyo',
    }),
  })
  const result = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(result.error || '通知設定を保存できませんでした。')
}

export function isValidNotificationTime(value: string) {
  return /^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/.test(value)
}

export async function getPushStatus(): Promise<PushStatusCheck> {
  if (!supportsPushNotifications()) {
    return {
      status: 'unsupported',
      message: 'この環境ではWeb Push通知を利用できません。HTTPSで開いていることと、ブラウザの対応状況を確認してください。',
    }
  }
  if (Notification.permission === 'denied') {
    return {
      status: 'denied',
      message: '通知がブロックされています。ブラウザまたはWindowsの設定から期限くんの通知を許可してください。',
    }
  }

  try {
    const registration = await getServiceWorkerRegistration()
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) return { status: 'enabled' }
    await fetchConfig()
    return { status: 'disabled' }
  } catch (error) {
    return {
      status: 'unavailable',
      message: error instanceof Error ? error.message : '通知機能の準備状況を確認できませんでした。もう一度設定を押してください。',
    }
  }
}

export async function enablePushNotifications(goal: Goal, notificationTime: string) {
  if (!supportsPushNotifications()) throw new Error('この端末またはブラウザはWeb Push通知に対応していません。')
  if (!goal.title || !goal.deadline) throw new Error('先にホームで目標と期限を設定してください。')
  if (!isValidNotificationTime(notificationTime)) throw new Error('通知時刻は15分単位で設定してください。')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('通知が許可されていません。端末の設定から期限くんの通知を許可してください。')
  }

  const publicKey = await fetchConfig()
  const registration = await getServiceWorkerRegistration()
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  try {
    await saveSubscription(subscription, goal, notificationTime)
  } catch (error) {
    if (!existing) await subscription.unsubscribe().catch(() => false)
    throw error
  }
}

export async function syncPushSubscription(goal: Goal, notificationTime: string) {
  if (!supportsPushNotifications() || Notification.permission !== 'granted') return false
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return false
  await saveSubscription(subscription, goal, notificationTime)
  return true
}

export async function disablePushNotifications() {
  if (!supportsPushNotifications()) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return

  try {
    await fetch(`${API_ROOT}/subscription`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
  } finally {
    await subscription.unsubscribe()
  }
}
