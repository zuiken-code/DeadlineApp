import type { ListItem, ListKind } from '../data/appStorage'
import { TaskListColumn } from './TaskListColumn'

type ActionListsProps = {
  todos: ListItem[]
  routines: ListItem[]
  onToggle: (kind: ListKind, id: number) => void
  onAdd: (kind: ListKind) => void
}

export function ActionLists({ todos, routines, onToggle, onAdd }: ActionListsProps) {
  return (
    <section className="lists" aria-label="期限までの行動">
      <TaskListColumn kind="todo" items={todos} onToggle={onToggle} onAdd={onAdd} />
      <TaskListColumn kind="routine" items={routines} onToggle={onToggle} onAdd={onAdd} />
    </section>
  )
}
