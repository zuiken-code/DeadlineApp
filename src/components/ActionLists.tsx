import type { ListItem, ListKind } from '../data/appStorage'
import { TaskListColumn } from './TaskListColumn'
import { ProgressControl } from './ProgressControl'

type ActionListsProps = {
  todos: ListItem[]
  onToggle: (kind: ListKind, id: number) => void
  onAdd: (kind: ListKind) => void
  onDelete: (kind: ListKind, id: number) => void
  progress: number
  onProgressChange: (value: number) => void
  hasGoal: boolean
}

export function ActionLists({ todos, onToggle, onAdd, onDelete, progress, onProgressChange, hasGoal }: ActionListsProps) {
  return (
    <section className="lists" aria-label="期限までの行動">
      <TaskListColumn kind="todo" items={todos} onToggle={onToggle} onAdd={onAdd} onDelete={onDelete} />
      {hasGoal && <ProgressControl value={progress} onChange={onProgressChange} />}
    </section>
  )
}
