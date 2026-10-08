import type { ListItem, ListKind } from '../data/appStorage'
import { TaskListColumn } from './TaskListColumn'

type ActionListsProps = {
  todos: ListItem[]
  onToggle: (kind: ListKind, id: number) => void
  onAdd: (kind: ListKind) => void
  onDelete: (kind: ListKind, id: number) => void
  onProgressChange: (id: number, value: number) => void
}

export function ActionLists({ todos, onToggle, onAdd, onDelete, onProgressChange }: ActionListsProps) {
  return (
    <section className="lists" aria-label="期限までの行動">
      <TaskListColumn kind="todo" items={todos} onToggle={onToggle} onAdd={onAdd} onDelete={onDelete} onProgressChange={onProgressChange} />
    </section>
  )
}
