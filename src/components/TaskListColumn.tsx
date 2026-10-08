import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { ListItem, ListKind } from '../data/appStorage';
import { CheckIcon, PlusIcon, TrashIcon } from './Icons';
import { ProgressSlider } from './ProgressSlider';

type TaskListColumnProps = {
  kind: ListKind;
  items: ListItem[];
  onToggle: (kind: ListKind, id: number) => void;
  onAdd: (kind: ListKind) => void;
  onDelete?: (kind: ListKind, id: number) => void;
  onProgressChange: (id: number, value: number) => void;
};

const content = {
  todo: {
    kicker: "TO DO",
    heading: "やること",
    empty: "最初のTODOを追加しましょう",
    add: "TODOを追加",
  },
  routine: {
    kicker: "DAILY ROUTINE",
    heading: "毎日の習慣",
    empty: "続けたい習慣を追加しましょう",
    add: "習慣を追加",
  },
} as const;

export function TaskListColumn({
  kind,
  items,
  onToggle,
  onAdd,
  onDelete,
  onProgressChange,
}: TaskListColumnProps) {
  const labels = content[kind];
  const completedCount = items.filter((item) => item.completed).length;

  return (
    <div
      className={`list-column ${kind === "todo" ? "todo-column" : "routine-column"}`}
    >
      <div className="list-heading">
        <div className="list-heading-task">
          <h3>{labels.heading}</h3>
          <span className="count">
            {completedCount}/{items.length}
          </span>
        </div>
        <span className="list-heading-progress">達成率</span>
      </div>
      <div className="items">
        {items.length === 0 && <p className="empty">{labels.empty}</p>}
        {items.map((item) => (
          <SwipeableListItem key={item.id} item={item} kind={kind} onToggle={onToggle} onDelete={onDelete} onProgressChange={onProgressChange} />
        ))}
      </div>
      <button className="add-row" onClick={() => onAdd(kind)}>
        <PlusIcon />
        {labels.add}
      </button>
    </div>
  );
}

type SwipeableListItemProps = {
  item: ListItem;
  kind: ListKind;
  onToggle: (kind: ListKind, id: number) => void;
  onDelete?: (kind: ListKind, id: number) => void;
  onProgressChange: (id: number, value: number) => void;
};

function SwipeableListItem({ item, kind, onToggle, onDelete, onProgressChange }: SwipeableListItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const startX = useRef<number | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement) return;
    if (startX.current === null) return;
    const deltaX = event.clientX - startX.current;
    startX.current = null;
    if (deltaX > 48) setIsOpen(true);
    if (deltaX < -48) setIsOpen(false);
  };

  return (
    <div className={`swipe-item ${isOpen ? 'is-open' : ''}`}>
      {onDelete && <>
        <button type="button" className="delete-action" onClick={() => onDelete(kind, item.id)} aria-label={`${item.title}を削除`}>削除</button>
        <button type="button" className="desktop-delete-action" onClick={() => onDelete(kind, item.id)} aria-label={`${item.title}を削除`}><TrashIcon /></button>
      </>}
      <div className={`list-item ${item.completed ? 'is-complete' : ''}`} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        <button type="button" className="task-toggle" onClick={() => (isOpen ? setIsOpen(false) : onToggle(kind, item.id))} aria-pressed={item.completed}>
          <span className="checkbox"><CheckIcon /></span>
          <span>{item.title}</span>
        </button>
        <ProgressSlider compact value={item.progress} onChange={(value) => onProgressChange(item.id, value)} id={`todo-progress-${item.id}`} ariaLabel={`${item.title}の達成度を5段階で選択`} />
      </div>
    </div>
  );
}
