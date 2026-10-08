const API_ORIGIN = 'https://api.national-holidays.jp'
const CACHE_PREFIX = 'deadline-holidays:'
const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000

type HolidayCache = { dates: string[]; fetchedAt: number }

function readCache(year: number) {
  try {
    const value = localStorage.getItem(`${CACHE_PREFIX}${year}`)
    return value ? JSON.parse(value) as HolidayCache : null
  } catch { return null }
}

function writeCache(year: number, dates: string[]) {
  try { localStorage.setItem(`${CACHE_PREFIX}${year}`, JSON.stringify({ dates, fetchedAt: Date.now() })) } catch { /* optional cache */ }
}

async function fetchYear(year: number) {
  const cached = readCache(year)
  if ((cached && Date.now() - cached.fetchedAt < CACHE_MAX_AGE) || !navigator.onLine) return cached?.dates ?? null
  try {
    const response = await fetch(`${API_ORIGIN}/${year}`)
    if (!response.ok) throw new Error(`Holiday API returned ${response.status}`)
    const holidays = await response.json() as Array<{ date?: string }>
    const dates = holidays.flatMap((holiday) => holiday.date ? [holiday.date] : [])
    writeCache(year, dates)
    return dates
  } catch { return cached?.dates ?? null }
}

function getYears(from: string, to: string) {
  const firstYear = Number(from.slice(0, 4))
  const lastYear = Number(to.slice(0, 4))
  return Array.from({ length: Math.max(0, lastYear - firstYear + 1) }, (_, index) => firstYear + index)
}

export type HolidayCountResult = { count: number; available: boolean }

export async function getHolidayCount(from: string, to: string): Promise<HolidayCountResult> {
  if (!from || !to || from > to) return { count: 0, available: true }
  const yearResults = await Promise.all(getYears(from, to).map(fetchYear))
  if (yearResults.some((dates) => dates === null)) return { count: 0, available: false }
  const holidays = new Set(yearResults.flat())
  let count = 0
  const end = new Date(`${to}T00:00:00`)
  for (let date = new Date(`${from}T00:00:00`); date <= end; date.setDate(date.getDate() + 1)) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (date.getDay() === 0 || date.getDay() === 6 || holidays.has(key)) count += 1
  }
  return { count, available: true }
}
