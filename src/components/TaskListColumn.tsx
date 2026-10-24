import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { getCompletedPageCount, getPageCount, getTodoProgressPercentage } from '../data/appStorage';
import type { ListItem, ListKind, PageProgress } from '../data/appStorage';
import { CheckIcon, EditIcon, PlusIcon, TrashIcon } from './Icons';

type TaskListColumnProps = {
  kind: ListKind;
  items: ListItem[];
  onToggle: (kind: ListKind, id: number) => void;
  onAdd: (kind: ListKind) => void;
  onDelete?: (kind: ListKind, id: number) => void;
  onEdit: (id: number) => void;
  onCurrentPageChange: (id: number, value: number | null) => void;
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
  onEdit,
  onCurrentPageChange,
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
        <span className="list-heading-progress" data-tour="progress">達成率</span>
      </div>
      <div className="items">
        {items.length === 0 && <p className="empty">{labels.empty}</p>}
        {items.map((item) => (
          <SwipeableListItem key={item.id} item={item} kind={kind} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onCurrentPageChange={onCurrentPageChange} />
        ))}
      </div>
      <button className="add-row" data-tour="todo-add" onClick={() => onAdd(kind)}>
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
  onEdit: (id: number) => void;
  onCurrentPageChange: (id: number, value: number | null) => void;
};

function SwipeableListItem({ item, kind, onToggle, onDelete, onEdit, onCurrentPageChange }: SwipeableListItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const startX = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const markSwipe = () => {
    suppressClick.current = true;
    window.setTimeout(() => { suppressClick.current = false; }, 400);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('.task-edit-button, .page-setup-button, input')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    suppressClick.current = false;
    startX.current = event.clientX;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some Android WebViews can release the pointer before capture completes.
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('.task-edit-button, .page-setup-button, input')) {
      startX.current = null;
      return;
    }
    if (startX.current === null) return;
    const deltaX = event.clientX - startX.current;
    startX.current = null;
    if (deltaX > 48) {
      markSwipe();
      setIsOpen(true);
    }
    if (deltaX < -48) {
      markSwipe();
      setIsOpen(false);
    }
  };

  const handlePointerCancel = () => {
    startX.current = null;
  };

  const handleTaskClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    onToggle(kind, item.id);
  };

  return (
    <div className={`swipe-item ${isOpen ? 'is-open' : ''}`}>
      {onDelete && <>
        <button type="button" className="delete-action" onClick={() => onDelete(kind, item.id)} aria-label={`${item.title}を削除`}>削除</button>
        <button type="button" className="desktop-delete-action" onClick={() => onDelete(kind, item.id)} aria-label={`${item.title}を削除`}><TrashIcon /></button>
      </>}
      <div className={`list-item ${item.completed ? 'is-complete' : ''}`} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel}>
        <div className="task-cell">
          <div className="task-main-row">
            <button type="button" className="task-toggle" onClick={handleTaskClick} aria-pressed={item.completed}>
              <span className="checkbox"><CheckIcon /></span>
              <span className="task-title">{item.title}</span>
            </button>
            <button type="button" className="task-edit-button" onClick={() => onEdit(item.id)} aria-label={`${item.title}を編集`} data-tour="todo-edit"><EditIcon /></button>
          </div>
          {item.pageProgress ? (
            <CurrentPageInput item={item} pageProgress={item.pageProgress} onChange={onCurrentPageChange} />
          ) : (
            <button type="button" className="page-setup-button" onClick={() => onEdit(item.id)}>ページ範囲を設定</button>
          )}
        </div>
        <TaskProgressSummary item={item} />
      </div>
    </div>
  );
}

type CurrentPageInputProps = {
  item: ListItem;
  pageProgress: PageProgress;
  onChange: (id: number, value: number | null) => void;
};

function CurrentPageInput({ item, pageProgress, onChange }: CurrentPageInputProps) {
  const persistedDraft = pageProgress.currentPage == null ? '' : String(pageProgress.currentPage);
  const [editState, setEditState] = useState({ draft: persistedDraft, baseCurrentPage: pageProgress.currentPage });
  const draft = editState.baseCurrentPage === pageProgress.currentPage ? editState.draft : persistedDraft;
  const draftNumber = Number(draft);
  const invalid = draft !== '' && (!/^\d+$/.test(draft) || !Number.isSafeInteger(draftNumber) || draftNumber < pageProgress.startPage || draftNumber > pageProgress.endPage);

  const handleChange = (value: string) => {
    setEditState({ draft: value, baseCurrentPage: pageProgress.currentPage });
    if (value === '') {
      onChange(item.id, null);
      return;
    }

    const next = Number(value);
    const isValid = /^\d+$/.test(value) && Number.isSafeInteger(next) && next >= pageProgress.startPage && next <= pageProgress.endPage;
    if (isValid) onChange(item.id, next);
  };

  const handleBlur = () => {
    if (!invalid) return;
    setEditState({ draft: persistedDraft, baseCurrentPage: pageProgress.currentPage });
  };

  return (
    <label className={`current-page-field ${invalid ? 'has-error' : ''}`}>
      <span>現在</span>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        aria-label={`${item.title}の現在ページ、${pageProgress.startPage}から${pageProgress.endPage}まで`}
        aria-invalid={invalid}
        placeholder="—"
      />
      <span>ページ</span>
    </label>
  );
}

function TaskProgressSummary({ item }: { item: ListItem }) {
  const percentage = getTodoProgressPercentage(item);
  const pageLabel = item.pageProgress
    ? `${getCompletedPageCount(item.pageProgress)}/${getPageCount(item.pageProgress)}ページ`
    : 'ページ未設定';

  return (
    <div className="task-progress-summary" aria-label={`${item.title}の達成率 ${percentage}%、${pageLabel}`}>
      <div className="task-progress-header"><strong>{percentage}%</strong><span>{pageLabel}</span></div>
      <div className="progress-track" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div>
      {item.pageProgress && <small>{item.pageProgress.startPage}〜{item.pageProgress.endPage}</small>}
    </div>
  );
}
