import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ActionLists } from './components/ActionLists'
import { AppHeader } from './components/AppHeader'
import { BottomNavigation } from './components/BottomNavigation'
import { DeadlineCard } from './components/DeadlineCard'
import { EditSheet } from './components/EditSheet'
import { TodoEditSheet } from './components/TodoEditSheet'
import { TutorialSheet } from './components/TutorialSheet'
import { GuidedTutorial } from './components/GuidedTutorial'
import { SettingsPage } from './components/SettingsPage'
import type { SheetMode } from './components/EditSheet'
import {
  formatDeadline,
  getDaysLeft,
  getTodoProgressPercentage,
  loadGoal,
  loadNotificationTime,
  loadTodos,
  saveGoal,
  saveItems,
  saveNotificationTime,
  toDateInputValue,
} from './data/appStorage'
import type { ListItem, ListKind, PageProgress } from './data/appStorage'
import { getHolidayCount } from './data/holidayApi'
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushStatus,
  syncPushSubscription,
} from './data/pushNotifications'
import type { PushStatus } from './data/pushNotifications'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState<'home' | 'settings'>('home')
  const [todayKey] = useState(() => toDateInputValue(new Date()))
  const [goal, setGoal] = useState(loadGoal)
  const [todos, setTodos] = useState(loadTodos)
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [draft, setDraft] = useState('')
  const [goalDraft, setGoalDraft] = useState(goal)
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [guidedTutorialOpen, setGuidedTutorialOpen] = useState(false)
  const [holidayCount, setHolidayCount] = useState(0)
  const [holidayAvailable, setHolidayAvailable] = useState(true)
  const [notificationTime, setNotificationTime] = useState(loadNotificationTime)
  const [pushStatus, setPushStatus] = useState<PushStatus>('loading')
  const [pushMessage, setPushMessage] = useState('')

  const deadlineText = useMemo(() => formatDeadline(goal.deadline), [goal.deadline])
  const daysLeft = useMemo(() => getDaysLeft(goal.deadline, todayKey), [goal.deadline, todayKey])
  const goalProgress = useMemo(() => {
    if (!todos.length) return 0
    return Math.round(todos.reduce((total, item) => total + getTodoProgressPercentage(item), 0) / todos.length)
  }, [todos])

  const editingTodo = editingTodoId === null ? null : todos.find((item) => item.id === editingTodoId) ?? null

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

  useEffect(() => {
    if (activePage !== 'settings') return
    let cancelled = false
    getPushStatus().then((status) => {
      if (!cancelled) setPushStatus(status)
    })
    return () => { cancelled = true }
  }, [activePage])

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

  const updateTodoCurrentPage = (id: number, currentPage: number | null) => {
    updateItems('todo', (items) => items.map((item) => (
      item.id === id && item.pageProgress
        ? { ...item, pageProgress: { ...item.pageProgress, currentPage } }
        : item
    )))
  }

  const saveTodoEdit = (id: number, title: string, pageProgress: PageProgress) => {
    updateItems('todo', (items) => items.map((item) => (
      item.id === id ? { ...item, title, pageProgress } : item
    )))
    setEditingTodoId(null)
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
    updateItems(sheet, (items) => [...items, { id: Date.now(), title, completed: false, progress: 0 }])
    closeSheet()
    setDraft('')
  }

  const updateGoal = (event: FormEvent) => {
    event.preventDefault()
    if (!goalDraft.title.trim() || !goalDraft.deadline) return
    const next = { ...goalDraft, title: goalDraft.title.trim() }
    setGoal(next)
    saveGoal(next)
    if (pushStatus === 'enabled') {
      syncPushSubscription(next, notificationTime).catch(() => {
        setPushStatus('error')
        setPushMessage('目標は保存しましたが、通知内容を更新できませんでした。オンラインで再度お試しください。')
      })
    }
    closeSheet()
  }

  const toggleNotifications = async () => {
    setPushStatus('busy')
    setPushMessage('')
    try {
      if (pushStatus === 'enabled') {
        await disablePushNotifications()
        setPushStatus('disabled')
        setPushMessage('通知をオフにし、サーバー上の通知情報を削除しました。')
      } else {
        await enablePushNotifications(goal, notificationTime)
        setPushStatus('enabled')
        setPushMessage(`毎日${notificationTime}ごろに通知します。`)
      }
    } catch (error) {
      const denied = 'Notification' in window && Notification.permission === 'denied'
      setPushStatus(denied ? 'denied' : 'error')
      setPushMessage(error instanceof Error ? error.message : '通知設定を変更できませんでした。')
    }
  }

  const updateNotificationTime = (value: string) => {
    setNotificationTime(value)
    saveNotificationTime(value)
    if (pushStatus !== 'enabled') return

    setPushStatus('busy')
    setPushMessage('通知時刻を更新しています…')
    syncPushSubscription(goal, value).then((synced) => {
      setPushStatus(synced ? 'enabled' : 'disabled')
      setPushMessage(synced ? `毎日${value}ごろに通知します。` : '通知が無効になっていたため、時刻だけ保存しました。')
    }).catch((error) => {
      setPushStatus('error')
      setPushMessage(error instanceof Error ? error.message : '通知時刻を更新できませんでした。')
    })
  }

  const navigate = (page: 'home' | 'settings') => {
    if (page === 'settings') {
      setPushStatus('loading')
      setPushMessage('')
    }
    setActivePage(page)
  }

  return (
    <main className="app-shell">
      <div className="app-content">
        {activePage === 'home' ? (
          <>
            <AppHeader onEditGoal={openGoal} onOpenTutorial={() => setTutorialOpen(true)} />
            <DeadlineCard goal={goal} deadlineText={deadlineText} daysLeft={daysLeft} holidayCount={holidayCount} holidayAvailable={holidayAvailable} goalProgress={goalProgress} onEditGoal={openGoal} />
            <ActionLists
              todos={todos}
              onToggle={toggleItem}
              onAdd={openAdd}
              onDelete={deleteItem}
              onEdit={setEditingTodoId}
              onCurrentPageChange={updateTodoCurrentPage}
            />
          </>
        ) : (
          <SettingsPage
            notificationTime={notificationTime}
            pushStatus={pushStatus}
            pushMessage={pushMessage}
            hasGoal={Boolean(goal.title && goal.deadline)}
            onNotificationTimeChange={updateNotificationTime}
            onToggleNotifications={toggleNotifications}
            onOpenTutorial={() => setTutorialOpen(true)}
          />
        )}
      </div>

      <BottomNavigation activePage={activePage} onNavigate={navigate} />

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
      {editingTodo && (
        <TodoEditSheet
          item={editingTodo}
          onSave={saveTodoEdit}
          onClose={() => setEditingTodoId(null)}
        />
      )}
      {tutorialOpen && (
        <TutorialSheet
          onClose={() => setTutorialOpen(false)}
          onStartGuide={() => {
            setTutorialOpen(false)
            setActivePage('home')
            setGuidedTutorialOpen(true)
          }}
        />
      )}
      {guidedTutorialOpen && <GuidedTutorial onClose={() => setGuidedTutorialOpen(false)} />}
    </main>
  )
}

export default App
