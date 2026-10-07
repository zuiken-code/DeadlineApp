import type { ListItem, ListKind } from '../data/appStorage'
import { CheckIcon, PlusIcon } from './Icons'

type TaskListColumnProps = {
  kind: ListKind
  items: ListItem[]
  onToggle: (kind: ListKind, id: number) => void
  onAdd: (kind: ListKind) => void
}

const content = {
  todo: {
    kicker: 'TO DO',
    heading: 'やること',
    empty: '最初のTODOを追加しましょう',
    add: 'TODOを追加',
  },
  routine: {
    kicker: 'DAILY ROUTINE',
    heading: '毎日の習慣',
    empty: '続けたい習慣を追加しましょう',
    add: '習慣を追加',
  },
} as const

export function TaskListColumn({ kind, items, onToggle, onAdd }: TaskListColumnProps) {
  const labels = content[kind]
  const completedCount = items.filter((item) => item.completed).length

  return (
    <div className={`list-column ${kind === 'todo' ? 'todo-column' : 'routine-column'}`}>
      <div className="list-heading">
        <div>
          <span className="list-kicker">{labels.kicker}</span>
          <h3>{labels.heading}</h3>
        </div>
        <span className="count">{completedCount}/{items.length}</span>
      </div>
      <div className="items">
        {items.length === 0 && <p className="empty">{labels.empty}</p>}
        {items.map((item) => (
          <button
            key={item.id}
            className={`list-item ${item.completed ? 'is-complete' : ''}`}
            onClick={() => onToggle(kind, item.id)}
            aria-pressed={item.completed}
          >
            <span className="checkbox"><CheckIcon /></span>
            <span>{item.title}</span>
          </button>
        ))}
      </div>
      <button className="add-row" onClick={() => onAdd(kind)}><PlusIcon />{labels.add}</button>
    </div>
  )
}
