import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Goal = { title: string; deadline: string }
type ListItem = { id: number; title: string; completed: boolean }
type SheetMode = 'todo' | 'routine' | 'goal' | null

const DAY = 1000 * 60 * 60 * 24

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function initialDeadline() {
  return toDateInputValue(new Date(Date.now() + DAY * 53))
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function saveStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function CheckIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10.4 3.1 3.1L15.4 6" /></svg>
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
}

function App() {
  const [todayKey] = useState(() => toDateInputValue(new Date()))
  const [goal, setGoal] = useState<Goal>(() => readStorage('deadline-goal', {
    title: '資格試験に合格する',
    deadline: initialDeadline(),
  }))
  const [todos, setTodos] = useState<ListItem[]>(() => readStorage('deadline-todos', [
    { id: 1, title: '参考書を1章進める', completed: true },
    { id: 2, title: '模擬問題を解く', completed: false },
    { id: 3, title: '苦手な範囲を整理する', completed: false },
  ]))
  const [routines, setRoutines] = useState<ListItem[]>(() => {
    const stored = readStorage('deadline-routines', [
      { id: 1, title: '朝、30分勉強する', completed: true },
      { id: 2, title: '寝る前に復習する', completed: false },
    ])
    const lastDay = localStorage.getItem('deadline-routine-day')
    const next = lastDay && lastDay !== todayKey
      ? stored.map((item) => ({ ...item, completed: false }))
      : stored
    localStorage.setItem('deadline-routine-day', todayKey)
    saveStorage('deadline-routines', next)
    return next
  })
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [draft, setDraft] = useState('')
  const [goalDraft, setGoalDraft] = useState(goal)

  const deadline = useMemo(() => new Date(`${goal.deadline}T00:00:00`), [goal.deadline])
  const today = new Date(`${todayKey}T00:00:00`)
  const daysLeft = Math.max(0, Math.round((deadline.getTime() - today.getTime()) / DAY))
  const deadlineText = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(deadline)
  const completedTodos = todos.filter((item) => item.completed).length
  const completedRoutines = routines.filter((item) => item.completed).length
  const progress = todos.length ? Math.round((completedTodos / todos.length) * 100) : 0

  const toggleItem = (type: 'todo' | 'routine', id: number) => {
    const setter = type === 'todo' ? setTodos : setRoutines
    setter((current) => {
      const next = current.map((item) => item.id === id ? { ...item, completed: !item.completed } : item)
      saveStorage(type === 'todo' ? 'deadline-todos' : 'deadline-routines', next)
      return next
    })
  }

  const openAdd = (mode: 'todo' | 'routine') => {
    setDraft('')
    setSheet(mode)
  }

  const openGoal = () => {
    setGoalDraft(goal)
    setSheet('goal')
  }

  const addItem = (event: FormEvent) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title || (sheet !== 'todo' && sheet !== 'routine')) return
    const nextItem = { id: Date.now(), title, completed: false }
    if (sheet === 'todo') {
      setTodos((current) => {
        const next = [...current, nextItem]
        saveStorage('deadline-todos', next)
        return next
      })
    } else {
      setRoutines((current) => {
        const next = [...current, nextItem]
        saveStorage('deadline-routines', next)
        return next
      })
    }
    setSheet(null)
    setDraft('')
  }

  const updateGoal = (event: FormEvent) => {
    event.preventDefault()
    if (!goalDraft.title.trim() || !goalDraft.deadline) return
    const next = { ...goalDraft, title: goalDraft.title.trim() }
    setGoal(next)
    saveStorage('deadline-goal', next)
    setSheet(null)
  }

  return (
    <main className="app-shell">
      <div className="app-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">MY DEADLINE</span>
            <h1>期限くん</h1>
          </div>
          <button className="icon-button" onClick={openGoal} aria-label="目標と期限を編集">
            <span /><span /><span />
          </button>
        </header>

        <section className="deadline-card" aria-labelledby="goal-title">
          <button className="goal-edit" onClick={openGoal} aria-label="目標を編集">
            <span>GOAL</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.7 6.3 3 3M5 19l3.6-.7L18 8.9a1.4 1.4 0 0 0 0-2l-.9-.9a1.4 1.4 0 0 0-2 0l-9.4 9.4L5 19Z" /></svg>
          </button>
          <h2 id="goal-title">{goal.title}</h2>
          <p className="deadline-date">{deadlineText}まで</p>
          <div className="remaining">
            <span className="remaining-label">残り</span>
            <strong>{daysLeft}</strong>
            <span className="remaining-unit">日</span>
          </div>
          <div className="progress-row">
            <div className="progress-track" aria-label={`TODOの進捗 ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
            <span>{progress}%</span>
          </div>
        </section>

        <section className="lists" aria-label="期限までの行動">
          <div className="list-column todo-column">
            <div className="list-heading">
              <div><span className="list-kicker">TO DO</span><h3>やること</h3></div>
              <span className="count">{completedTodos}/{todos.length}</span>
            </div>
            <div className="items">
              {todos.length === 0 && <p className="empty">最初のTODOを追加しましょう</p>}
              {todos.map((item) => (
                <button key={item.id} className={`list-item ${item.completed ? 'is-complete' : ''}`} onClick={() => toggleItem('todo', item.id)} aria-pressed={item.completed}>
                  <span className="checkbox"><CheckIcon /></span><span>{item.title}</span>
                </button>
              ))}
            </div>
            <button className="add-row" onClick={() => openAdd('todo')}><PlusIcon />TODOを追加</button>
          </div>

          <div className="list-column routine-column">
            <div className="list-heading">
              <div><span className="list-kicker">DAILY ROUTINE</span><h3>毎日の習慣</h3></div>
              <span className="count">{completedRoutines}/{routines.length}</span>
            </div>
            <div className="items">
              {routines.length === 0 && <p className="empty">続けたい習慣を追加しましょう</p>}
              {routines.map((item) => (
                <button key={item.id} className={`list-item ${item.completed ? 'is-complete' : ''}`} onClick={() => toggleItem('routine', item.id)} aria-pressed={item.completed}>
                  <span className="checkbox"><CheckIcon /></span><span>{item.title}</span>
                </button>
              ))}
            </div>
            <button className="add-row" onClick={() => openAdd('routine')}><PlusIcon />習慣を追加</button>
          </div>
        </section>
      </div>

      <nav className="bottom-nav" aria-label="メインナビゲーション">
        <button className="nav-item active" aria-current="page">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" /></svg><span>ホーム</span>
        </button>
        <button className="nav-item" onClick={openGoal}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v16M5 5h11l-2 3 2 3H5" /></svg><span>目標</span>
        </button>
      </nav>

      {sheet && (
        <div className="sheet-layer" role="presentation" onMouseDown={() => setSheet(null)}>
          <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div>
                <span className="eyebrow">{sheet === 'goal' ? 'DEADLINE' : sheet === 'todo' ? 'TO DO' : 'DAILY ROUTINE'}</span>
                <h2 id="sheet-title">{sheet === 'goal' ? '目標を編集' : sheet === 'todo' ? 'TODOを追加' : '習慣を追加'}</h2>
              </div>
              <button className="close-button" onClick={() => setSheet(null)} aria-label="閉じる"><CloseIcon /></button>
            </div>

            {sheet === 'goal' ? (
              <form onSubmit={updateGoal}>
                <label><span>目標の名前</span><input autoFocus value={goalDraft.title} onChange={(event) => setGoalDraft({ ...goalDraft, title: event.target.value })} placeholder="例：資格試験に合格する" /></label>
                <label><span>期限</span><input type="date" value={goalDraft.deadline} min={todayKey} onChange={(event) => setGoalDraft({ ...goalDraft, deadline: event.target.value })} /></label>
                <button className="primary-button" type="submit">保存する</button>
              </form>
            ) : (
              <form onSubmit={addItem}>
                <label><span>{sheet === 'todo' ? '具体的にやること' : '毎日続けたいこと'}</span><input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={sheet === 'todo' ? '例：模擬問題を1回解く' : '例：朝30分勉強する'} /></label>
                <button className="primary-button" type="submit" disabled={!draft.trim()}>追加する</button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default App
