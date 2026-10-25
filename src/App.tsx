import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ActionLists } from './components/ActionLists'
import { AnalyticsConsentDialog } from './components/AnalyticsConsentDialog'
import { AppHeader } from './components/AppHeader'
import { BottomNavigation } from './components/BottomNavigation'
import { DeadlineCard } from './components/DeadlineCard'
import { EditSheet } from './components/EditSheet'
import { TodoEditSheet } from './components/TodoEditSheet'
import { TutorialSheet } from './components/TutorialSheet'
import { GuidedTutorial } from './components/GuidedTutorial'
import type { GuideFinishAction } from './components/GuidedTutorial'
import { NotificationPrompt } from './components/NotificationPrompt'
import { SettingsPage } from './components/SettingsPage'
import type { SheetMode } from './components/EditSheet'
import {
  formatDeadline,
  getDaysLeft,
  getTodoProgressPercentage,
  hasSeenGuidedTutorial,
  loadGoal,
  loadNotificationTime,
  loadTodos,
  markGuidedTutorialSeen,
  saveGoal,
  saveItems,
  saveNotificationTime,
  toDateInputValue,
} from './data/appStorage'
import type { ListItem, ListKind, PageProgress } from './data/appStorage'
import {
  getDeadlineBucket,
  getProgressBucket,
  getProgressMode,
  getTodoCountBucket,
  initializeAnalytics,
  loadAnalyticsConsent,
  trackAnalyticsEvent,
  updateAnalyticsConsent,
} from './data/analytics'
import type { AnalyticsConsent } from './data/analytics'
import { getHolidayCount } from './data/holidayApi'
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushStatus,
  sendTestNotification,
  syncPushSubscription,
} from './data/pushNotifications'
import type { PushStatus } from './data/pushNotifications'
import './App.css'

type InstallPromptEvent = Event & { prompt: () => Promise<void> }

function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

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
  const [pushMessageIsError, setPushMessageIsError] = useState(false)
  const [pushStatusCheckId, setPushStatusCheckId] = useState(0)
  const [analyticsConsent, setAnalyticsConsent] = useState<AnalyticsConsent>(loadAnalyticsConsent)
  const [storageMessage, setStorageMessage] = useState('')
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isAppInstalled)
  const pushOperationInProgress = useRef(false)

  const deadlineText = useMemo(() => formatDeadline(goal.deadline), [goal.deadline])
  const daysLeft = useMemo(() => getDaysLeft(goal.deadline, todayKey), [goal.deadline, todayKey])
  const goalProgress = useMemo(() => {
    if (!todos.length) return 0
    return Math.round(todos.reduce((total, item) => total + getTodoProgressPercentage(item), 0) / todos.length)
  }, [todos])

  const editingTodo = editingTodoId === null ? null : todos.find((item) => item.id === editingTodoId) ?? null

  useEffect(() => {
    return initializeAnalytics()
  }, [])

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }
    const handleDisplayModeChange = () => setInstalled(isAppInstalled())

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    displayMode.addEventListener('change', handleDisplayModeChange)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      displayMode.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

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
    if (pushOperationInProgress.current) return
    let cancelled = false
    getPushStatus().then((result) => {
      if (!cancelled && !pushOperationInProgress.current) {
        setPushStatus(result.status)
        setPushMessage(result.message ?? '')
        setPushMessageIsError(result.status === 'unavailable' || result.status === 'denied')
      }
    })
    return () => { cancelled = true }
  }, [activePage, pushStatusCheckId])

  const promptInstall = () => {
    if (!installPrompt) return
    const prompt = installPrompt
    setInstallPrompt(null)
    void prompt.prompt().catch(() => {
      // The browser menu remains available if its installation prompt cannot open.
    })
  }

  const updateItems = (kind: ListKind, update: (items: ListItem[]) => ListItem[]) => {
    if (kind !== 'todo') return null
    const next = update(todos)
    if (!saveItems(kind, next)) {
      setStorageMessage('端末に保存できませんでした。空き容量やブラウザの保存設定を確認してください。')
      return null
    }
    setTodos(next)
    setStorageMessage('')
    return next
  }

  const toggleItem = (kind: ListKind, id: number) => {
    const previous = todos.find((item) => item.id === id)
    const next = updateItems(kind, (items) => items.map((item) => (
      item.id === id ? { ...item, completed: !item.completed } : item
    )))
    if (previous && next) {
      trackAnalyticsEvent(previous.completed ? 'todo_unchecked' : 'todo_checked', {})
    }
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

  const commitTodoCurrentPage = (id: number, previousValue: number | null, currentPage: number | null) => {
    if (previousValue === currentPage) return
    const item = todos.find((todo) => todo.id === id)
    if (!item?.pageProgress || item.pageProgress.currentPage !== currentPage) return
    trackAnalyticsEvent('progress_saved', {
      progress_mode: getProgressMode(item),
      progress_bucket: getProgressBucket(getTodoProgressPercentage(item)),
    })
  }

  const saveTodoEdit = (id: number, title: string, pageProgress: PageProgress) => {
    const previous = todos.find((item) => item.id === id)
    const nextItem = previous ? { ...previous, title, pageProgress } : null
    const next = updateItems('todo', (items) => items.map((item) => (
      item.id === id && nextItem ? nextItem : item
    )))
    if (!next || !previous || !nextItem) return
    if (getTodoProgressPercentage(previous) !== getTodoProgressPercentage(nextItem)) {
      trackAnalyticsEvent('progress_saved', {
        progress_mode: getProgressMode(nextItem),
        progress_bucket: getProgressBucket(getTodoProgressPercentage(nextItem)),
      })
    }
    setEditingTodoId(null)
  }

  const openAdd = (kind: ListKind) => {
    setStorageMessage('')
    setDraft('')
    setSheet(kind)
  }

  const openGoal = () => {
    setStorageMessage('')
    setGoalDraft(goal)
    setSheet('goal')
  }

  const closeSheet = () => setSheet(null)

  const addItem = (event: FormEvent) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title || sheet !== 'todo') return
    const newItem: ListItem = { id: Date.now(), title, completed: false, progress: 0 }
    const next = updateItems(sheet, (items) => [...items, newItem])
    if (!next) return
    trackAnalyticsEvent('todo_added', {
      progress_mode: getProgressMode(newItem),
      todo_count_bucket: getTodoCountBucket(next.length),
    })
    closeSheet()
    setDraft('')
  }

  const updateGoal = (event: FormEvent) => {
    event.preventDefault()
    if (!goalDraft.title.trim() || !goalDraft.deadline) return
    const next = { ...goalDraft, title: goalDraft.title.trim() }
    const hadGoal = Boolean(goal.title && goal.deadline)
    const titleChanged = goal.title !== next.title
    const deadlineChanged = goal.deadline !== next.deadline
    if (!saveGoal(next)) {
      setStorageMessage('目標を端末に保存できませんでした。空き容量やブラウザの保存設定を確認してください。')
      return
    }
    setGoal(next)
    setStorageMessage('')
    if (!hadGoal) {
      trackAnalyticsEvent('goal_set', { deadline_bucket: getDeadlineBucket(getDaysLeft(next.deadline, todayKey)) })
    } else if (titleChanged || deadlineChanged) {
      trackAnalyticsEvent('goal_edited', {
        changed_field: titleChanged && deadlineChanged ? 'both' : titleChanged ? 'title' : 'deadline',
      })
    }
    if (pushStatus === 'enabled') {
      syncPushSubscription(next, notificationTime).catch(() => {
        setPushStatus('error')
        setPushMessage('目標は保存しましたが、通知内容を更新できませんでした。オンラインで再度お試しください。')
      })
    }
    closeSheet()
  }

  const toggleNotifications = async () => {
    if (pushOperationInProgress.current) return
    pushOperationInProgress.current = true
    setPushStatus('busy')
    setPushMessage('')
    setPushMessageIsError(false)
    try {
      if (pushStatus === 'enabled') {
        await disablePushNotifications()
        setPushStatus('disabled')
        setPushMessage('通知をオフにし、サーバー上の通知情報を削除しました。')
      } else {
        await enablePushNotifications(goal, notificationTime)
        setPushStatus('enabled')
        setPushMessage(`テスト通知を送信しました。毎日${notificationTime}ごろに通知します。届かない場合は端末の通知設定と集中モードを確認してください。`)
      }
    } catch (error) {
      const denied = 'Notification' in window && Notification.permission === 'denied'
      setPushStatus(denied ? 'denied' : 'error')
      setPushMessage(error instanceof Error ? error.message : '通知設定を変更できませんでした。')
      setPushMessageIsError(true)
    } finally {
      pushOperationInProgress.current = false
    }
  }

  const testNotifications = async () => {
    if (pushOperationInProgress.current) return
    pushOperationInProgress.current = true
    setPushStatus('busy')
    setPushMessage('テスト通知を送信しています…')
    setPushMessageIsError(false)
    try {
      await sendTestNotification(goal, notificationTime)
      setPushStatus('enabled')
      setPushMessage('テスト通知を送信しました。届かない場合は端末の通知設定と集中モードを確認してください。')
    } catch (error) {
      const status = await getPushStatus()
      setPushStatus(status.status)
      setPushMessage(error instanceof Error ? error.message : 'テスト通知を送れませんでした。')
      setPushMessageIsError(true)
    } finally {
      pushOperationInProgress.current = false
    }
  }

  const updateNotificationTime = (value: string) => {
    setNotificationTime(value)
    saveNotificationTime(value)
    if (pushStatus !== 'enabled') return

    setPushStatus('busy')
    setPushMessage('通知時刻を更新しています…')
    setPushMessageIsError(false)
    syncPushSubscription(goal, value).then((synced) => {
      setPushStatus(synced ? 'enabled' : 'disabled')
      setPushMessage(synced ? `毎日${value}ごろに通知します。` : '通知が無効になっていたため、時刻だけ保存しました。')
    }).catch((error) => {
      setPushStatus('error')
      setPushMessage(error instanceof Error ? error.message : '通知時刻を更新できませんでした。')
      setPushMessageIsError(true)
    })
  }

  const navigate = (page: 'home' | 'settings') => {
    if (page === 'settings') {
      setPushStatus('loading')
      setPushMessage('')
      setPushMessageIsError(false)
      if (activePage === 'settings') {
        setPushStatusCheckId((current) => current + 1)
      }
    }
    setActivePage(page)
  }

  const changeAnalyticsConsent = (enabled: boolean) => {
    const isInitialChoice = analyticsConsent === 'pending'
    const nextConsent = enabled ? 'granted' : 'denied'
    updateAnalyticsConsent(nextConsent)
    setAnalyticsConsent(nextConsent)
    if (isInitialChoice && !hasSeenGuidedTutorial() && !goal.title && !goal.deadline && todos.length === 0) {
      markGuidedTutorialSeen()
      setActivePage('home')
      setGuidedTutorialOpen(true)
      trackAnalyticsEvent('tutorial_started', {})
    }
  }

  const completeGuidedTutorial = (action: GuideFinishAction) => {
    trackAnalyticsEvent('tutorial_completed', {})
    setGuidedTutorialOpen(false)
    if (action === 'create-goal') openGoal()
    if (action === 'open-settings') navigate('settings')
    if (action === 'enable-notifications') {
      setActivePage('settings')
      void toggleNotifications()
    }
  }

  return (
    <main className="app-shell">
      <div className="app-content">
        {activePage === 'home' ? (
          <>
            <AppHeader onEditGoal={openGoal} onOpenTutorial={() => setTutorialOpen(true)} />
            <DeadlineCard goal={goal} deadlineText={deadlineText} daysLeft={daysLeft} holidayCount={holidayCount} holidayAvailable={holidayAvailable} goalProgress={goalProgress} onEditGoal={openGoal} />
            {goal.title && goal.deadline && (
              <NotificationPrompt
                status={pushStatus}
                onEnable={() => { void toggleNotifications() }}
                onOpenSettings={() => navigate('settings')}
              />
            )}
            <ActionLists
              todos={todos}
              onToggle={toggleItem}
              onAdd={openAdd}
              onDelete={deleteItem}
              onEdit={setEditingTodoId}
              onCurrentPageChange={updateTodoCurrentPage}
              onCurrentPageCommit={commitTodoCurrentPage}
            />
          </>
        ) : (
          <SettingsPage
            notificationTime={notificationTime}
            pushStatus={pushStatus}
            pushMessage={pushMessage}
            pushMessageIsError={pushMessageIsError}
            analyticsConsent={analyticsConsent}
            hasGoal={Boolean(goal.title && goal.deadline)}
            onNotificationTimeChange={updateNotificationTime}
            onToggleNotifications={toggleNotifications}
            onSendTestNotification={testNotifications}
            onAnalyticsConsentChange={changeAnalyticsConsent}
            onOpenTutorial={() => setTutorialOpen(true)}
          />
        )}
        <footer className="app-version">
          v{__APP_VERSION__}{__APP_COMMIT__ && ` · ${__APP_COMMIT__}`}
        </footer>
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
          errorMessage={storageMessage}
        />
      )}
      {editingTodo && (
        <TodoEditSheet
          item={editingTodo}
          onSave={saveTodoEdit}
          onClose={() => setEditingTodoId(null)}
          errorMessage={storageMessage}
        />
      )}
      {tutorialOpen && (
        <TutorialSheet
          onClose={() => setTutorialOpen(false)}
          onStartGuide={() => {
            markGuidedTutorialSeen()
            trackAnalyticsEvent('tutorial_started', {})
            setTutorialOpen(false)
            setActivePage('home')
            setGuidedTutorialOpen(true)
          }}
        />
      )}
      {guidedTutorialOpen && (
        <GuidedTutorial
          onClose={() => setGuidedTutorialOpen(false)}
          onComplete={completeGuidedTutorial}
          hasGoal={Boolean(goal.title && goal.deadline)}
          pushStatus={pushStatus}
          isInstalled={installed}
          canPromptInstall={Boolean(installPrompt)}
          onInstall={promptInstall}
        />
      )}
      {analyticsConsent === 'pending' && (
        <AnalyticsConsentDialog
          onAccept={() => changeAnalyticsConsent(true)}
          onDecline={() => changeAnalyticsConsent(false)}
        />
      )}
    </main>
  )
}

export default App
