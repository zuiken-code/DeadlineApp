import ReactGA from 'react-ga4'
import type { ListItem } from './appStorage'

export type AnalyticsConsent = 'pending' | 'granted' | 'denied'
export type ProgressMode = 'steps' | 'pages'

type AnalyticsEventParameters = {
  goal_set: { deadline_bucket: 'd0_7' | 'd8_30' | 'd31_90' | 'd91_plus' }
  goal_edited: { changed_field: 'title' | 'deadline' | 'both' }
  todo_added: { progress_mode: ProgressMode; todo_count_bucket: 'n1' | 'n2_3' | 'n4_7' | 'n8_plus' }
  progress_saved: { progress_mode: ProgressMode; progress_bucket: 'p0' | 'p1_24' | 'p25_49' | 'p50_74' | 'p75_99' | 'p100' }
  todo_checked: Record<string, never>
  todo_unchecked: Record<string, never>
  tutorial_started: Record<string, never>
  tutorial_completed: Record<string, never>
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-R72TTQ72JZ'
const PRODUCTION_HOSTNAME = import.meta.env.VITE_GA_HOSTNAME || 'deadlineapp.zuiken.workers.dev'
const CONSENT_STORAGE_KEY = 'deadline-analytics-consent'
const SCHEMA_VERSION = 1
let sessionConsent: AnalyticsConsent | null = null

function isProductionAnalyticsHost() {
  return import.meta.env.PROD && window.location.hostname === PRODUCTION_HOSTNAME
}

function setGoogleAnalyticsDisabled(disabled: boolean) {
  const flags = window as unknown as Record<string, unknown>
  flags[`ga-disable-${MEASUREMENT_ID}`] = disabled
}

function deleteAnalyticsCookies() {
  const cookieNames = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0]?.trim())
    .filter((name) => name === '_ga' || name?.startsWith('_ga_'))

  for (const name of cookieNames) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
    document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}; SameSite=Lax`
  }
}

function installGoogleTag() {
  if (!isProductionAnalyticsHost() || !navigator.onLine || loadAnalyticsConsent() !== 'granted') return
  if (ReactGA.isInitialized) return

  setGoogleAnalyticsDisabled(false)
  ReactGA.initialize(MEASUREMENT_ID, {
    gaOptions: {
      allowAdFeatures: false,
      allowAdPersonalizationSignals: false,
    },
  })
}

function disableGoogleTag() {
  setGoogleAnalyticsDisabled(true)
  ReactGA.reset()
  document.querySelectorAll<HTMLScriptElement>('script[src*="googletagmanager.com/gtag/js"]')
    .forEach((script) => script.remove())
  window.dataLayer = []
  Reflect.deleteProperty(window, 'gtag')
  deleteAnalyticsCookies()
}

export function loadAnalyticsConsent(): AnalyticsConsent {
  if (sessionConsent) return sessionConsent
  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : 'pending'
  } catch {
    return 'pending'
  }
}

export function updateAnalyticsConsent(consent: Exclude<AnalyticsConsent, 'pending'>) {
  sessionConsent = consent
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, consent)
  } catch {
    // Consent still applies to the current page when storage is unavailable.
  }

  if (consent === 'granted') installGoogleTag()
  else disableGoogleTag()
}

export function initializeAnalytics() {
  if (loadAnalyticsConsent() === 'granted') installGoogleTag()
  else disableGoogleTag()

  const handleOnline = () => installGoogleTag()
  window.addEventListener('online', handleOnline)
  return () => window.removeEventListener('online', handleOnline)
}

export function trackAnalyticsEvent<Name extends keyof AnalyticsEventParameters>(
  name: Name,
  parameters: AnalyticsEventParameters[Name],
) {
  if (loadAnalyticsConsent() !== 'granted' || !isProductionAnalyticsHost() || !navigator.onLine) return
  installGoogleTag()
  ReactGA.event(name, { ...parameters, schema_version: SCHEMA_VERSION })
}

export function getDeadlineBucket(daysLeft: number): AnalyticsEventParameters['goal_set']['deadline_bucket'] {
  if (daysLeft <= 7) return 'd0_7'
  if (daysLeft <= 30) return 'd8_30'
  if (daysLeft <= 90) return 'd31_90'
  return 'd91_plus'
}

export function getTodoCountBucket(count: number): AnalyticsEventParameters['todo_added']['todo_count_bucket'] {
  if (count <= 1) return 'n1'
  if (count <= 3) return 'n2_3'
  if (count <= 7) return 'n4_7'
  return 'n8_plus'
}

export function getProgressBucket(percentage: number): AnalyticsEventParameters['progress_saved']['progress_bucket'] {
  if (percentage <= 0) return 'p0'
  if (percentage <= 24) return 'p1_24'
  if (percentage <= 49) return 'p25_49'
  if (percentage <= 74) return 'p50_74'
  if (percentage <= 99) return 'p75_99'
  return 'p100'
}

export function getProgressMode(item: ListItem): ProgressMode {
  return item.pageProgress ? 'pages' : 'steps'
}
