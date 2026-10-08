import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ActionLists } from './components/ActionLists'
import { AppHeader } from './components/AppHeader'
import { BottomNavigation } from './components/BottomNavigation'
import { DeadlineCard } from './components/DeadlineCard'
import { EditSheet } from './components/EditSheet'
import { TutorialSheet } from './components/TutorialSheet'
import type { SheetMode } from './components/EditSheet'
import {
  formatDeadline,
  getDaysLeft,
  loadGoal,
  loadTodos,
  saveGoal,
  saveItems,
  toDateInputValue,
} from './data/appStorage'
import type { ListItem, ListKind } from './data/appStorage'
import { getHolidayCount } from './data/holidayApi'
import './App.css'

function App() {
  const [todayKey] = useState(() => toDateInputValue(new Date()))
  const [goal, setGoal] = useState(loadGoal)
  const [todos, setTodos] = useState(loadTodos)
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [draft, setDraft] = useState('')
  const [goalDraft, setGoalDraft] = useState(goal)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [holidayCount, setHolidayCount] = useState(0)
  const [holidayAvailable, setHolidayAvailable] = useState(true)

  const deadlineText = useMemo(() => formatDeadline(goal.deadline), [goal.deadline])
  const daysLeft = useMemo(() => getDaysLeft(goal.deadline, todayKey), [goal.deadline, todayKey])
  const completedTodos = todos.filter((item) => item.completed).length
  const progress = todos.length ? Math.round((completedTodos / todos.length) * 100) : 0

  const updateProgress = (value: number) => {
    const next = { ...goal, progress: value }
    setGoal(next)
    saveGoal(next)
  }

  useEffect(() => {
    let cancelled = false
    if (!goal.deadline) {
      return () => { cancelled = true }
    }
    getHolidayCount(todayKey, goal.deadline).then((result) => {
      if (!cancelled) {
        setHolidayCount(result.count)
        setHolidayAvailable(result.available)
      }
    })
    return () => { cancelled = true }
  }, [goal.deadline, todayKey])

  const updateItems = (kind: ListKind, update: (items: ListItem[]) => ListItem[]) => {
    if (kind !== 'todo') return
    const setter = setTodos
    setter((current) => {
      const next = update(current)
      saveItems(kind, next)
      return next
    })
  }

  const toggleItem = (kind: ListKind, id: number) => {
    updateItems(kind, (items) => items.map((item) => (
      item.id === id ? { ...item, completed: !item.completed } : item
    )))
  }

  const deleteItem = (kind: ListKind, id: number) => {
    updateItems(kind, (items) => items.filter((item) => item.id !== id))
  }

  const openAdd = (kind: ListKind) => {
    setDraft('')
    setSheet(kind)
  }

  const openGoal = () => {
    setGoalDraft(goal)
    setSheet('goal')
  }

  const closeSheet = () => setSheet(null)

  const addItem = (event: FormEvent) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title || sheet !== 'todo') return
    updateItems(sheet, (items) => [...items, { id: Date.now(), title, completed: false }])
    closeSheet()
    setDraft('')
  }

  const updateGoal = (event: FormEvent) => {
    event.preventDefault()
    if (!goalDraft.title.trim() || !goalDraft.deadline) return
    const next = { ...goalDraft, title: goalDraft.title.trim() }
    setGoal(next)
    saveGoal(next)
    closeSheet()
  }

  return (
    <main className="app-shell">
      <div className="app-content">
        <AppHeader onEditGoal={openGoal} onOpenTutorial={() => setTutorialOpen(true)} />
        <DeadlineCard goal={goal} deadlineText={deadlineText} daysLeft={daysLeft} holidayCount={holidayCount} holidayAvailable={holidayAvailable} progress={progress} onEditGoal={openGoal} />
        <ActionLists todos={todos} onToggle={toggleItem} onAdd={openAdd} onDelete={deleteItem} progress={goal.progress} onProgressChange={updateProgress} hasGoal={Boolean(goal.title && goal.deadline)} />
      </div>

      <BottomNavigation onEditGoal={openGoal} />

      {sheet && (
        <EditSheet
          mode={sheet}
          todayKey={todayKey}
          draft={draft}
          goalDraft={goalDraft}
          onDraftChange={setDraft}
          onGoalDraftChange={setGoalDraft}
          onAddItem={addItem}
          onUpdateGoal={updateGoal}
          onClose={closeSheet}
        />
      )}
      {tutorialOpen && <TutorialSheet onClose={() => setTutorialOpen(false)} />}
    </main>
  )
}

export default App
