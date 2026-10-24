export type Goal = {
  title: string
  deadline: string
}

export type PageProgress = {
  startPage: number
  endPage: number
  currentPage: number | null
}

export type ListItem = {
  id: number
  title: string
  completed: boolean
  progress: number
  pageProgress?: PageProgress
}

export type ListKind = 'todo' | 'routine'

const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24

const STORAGE_KEYS = {
  goal: 'deadline-goal',
  todos: 'deadline-todos',
  routines: 'deadline-routines',
  routineDay: 'deadline-routine-day',
} as const

const DEFAULT_TODOS: ListItem[] = []

const DEFAULT_ROUTINES: ListItem[] = []

function normalizePageProgress(value: unknown): PageProgress | undefined {
  if (!value || typeof value !== 'object') return undefined

  const pageProgress = value as Partial<PageProgress>
  const startPage = Number(pageProgress.startPage)
  const endPage = Number(pageProgress.endPage)
  const currentPage = pageProgress.currentPage == null ? null : Number(pageProgress.currentPage)

  if (!Number.isSafeInteger(startPage) || startPage < 1) return undefined
  if (!Number.isSafeInteger(endPage) || endPage < startPage) return undefined
  if (currentPage !== null && (!Number.isSafeInteger(currentPage) || currentPage < startPage || currentPage > endPage)) return undefined

  return { startPage, endPage, currentPage }
}

export function getPageCount(pageProgress: PageProgress) {
  return pageProgress.endPage - pageProgress.startPage + 1
}

export function getCompletedPageCount(pageProgress: PageProgress) {
  if (pageProgress.currentPage === null) return 0
  return pageProgress.currentPage - pageProgress.startPage + 1
}

export function getTodoProgressPercentage(item: ListItem) {
  if (!item.pageProgress) return item.progress * 25
  return Math.round(getCompletedPageCount(item.pageProgress) / getPageCount(item.pageProgress) * 100)
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDefaultGoal(): Goal {
  return {
    title: '',
    deadline: '',
  }
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in private mode or after the quota is reached.
  }
}

export function loadGoal() {
  const goal = readStorage<Partial<Goal>>(STORAGE_KEYS.goal, getDefaultGoal())
  return {
    title: goal.title ?? '',
    deadline: goal.deadline ?? '',
  }
}

export function saveGoal(goal: Goal) {
  writeStorage(STORAGE_KEYS.goal, goal)
}

export function loadTodos() {
  return readStorage<Partial<ListItem>[]>(STORAGE_KEYS.todos, DEFAULT_TODOS).map((item) => {
    const pageProgress = normalizePageProgress(item.pageProgress)
    return {
      id: item.id ?? Date.now(),
      title: item.title ?? '',
      completed: item.completed ?? false,
      progress: Math.min(4, Math.max(0, Number.isFinite(item.progress) ? item.progress as number : 0)),
      ...(pageProgress ? { pageProgress } : {}),
    }
  })
}

export function loadRoutines(todayKey: string) {
  const stored = readStorage<ListItem[]>(STORAGE_KEYS.routines, DEFAULT_ROUTINES)
  let lastDay: string | null = null
  try { lastDay = localStorage.getItem(STORAGE_KEYS.routineDay) } catch { /* optional storage */ }
  const routines = lastDay && lastDay !== todayKey
    ? stored.map((item) => ({ ...item, completed: false }))
    : stored

  try { localStorage.setItem(STORAGE_KEYS.routineDay, todayKey) } catch { /* optional storage */ }
  writeStorage(STORAGE_KEYS.routines, routines)

  return routines
}

export function saveItems(kind: ListKind, items: ListItem[]) {
  writeStorage(kind === 'todo' ? STORAGE_KEYS.todos : STORAGE_KEYS.routines, items)
}

export function getDaysLeft(deadline: string, todayKey: string) {
  if (!deadline || !todayKey) return 0
  const deadlineDate = new Date(`${deadline}T00:00:00`)
  const today = new Date(`${todayKey}T00:00:00`)
  return Math.max(0, Math.round((deadlineDate.getTime() - today.getTime()) / DAY_IN_MILLISECONDS))
}

export function formatDeadline(deadline: string) {
  if (!deadline) return ''
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${deadline}T00:00:00`))
}
