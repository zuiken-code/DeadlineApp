export type Goal = {
  title: string
  deadline: string
}

export type ListItem = {
  id: number
  title: string
  completed: boolean
  progress: number
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
  localStorage.setItem(key, JSON.stringify(value))
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
  return readStorage<Partial<ListItem>[]>(STORAGE_KEYS.todos, DEFAULT_TODOS).map((item) => ({
    id: item.id ?? Date.now(),
    title: item.title ?? '',
    completed: item.completed ?? false,
    progress: Math.min(4, Math.max(0, Number.isFinite(item.progress) ? item.progress as number : 0)),
  }))
}

export function loadRoutines(todayKey: string) {
  const stored = readStorage<ListItem[]>(STORAGE_KEYS.routines, DEFAULT_ROUTINES)
  const lastDay = localStorage.getItem(STORAGE_KEYS.routineDay)
  const routines = lastDay && lastDay !== todayKey
    ? stored.map((item) => ({ ...item, completed: false }))
    : stored

  localStorage.setItem(STORAGE_KEYS.routineDay, todayKey)
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
