import type { FormEvent } from 'react'
import type { Goal, ListKind } from '../data/appStorage'
import { CloseIcon } from './Icons'

export type SheetMode = ListKind | 'goal' | null

type EditSheetProps = {
  mode: Exclude<SheetMode, null>
  todayKey: string
  draft: string
  goalDraft: Goal
  onDraftChange: (value: string) => void
  onGoalDraftChange: (goal: Goal) => void
  onAddItem: (event: FormEvent) => void
  onUpdateGoal: (event: FormEvent) => void
  onClose: () => void
}

export function EditSheet({
  mode,
  todayKey,
  draft,
  goalDraft,
  onDraftChange,
  onGoalDraftChange,
  onAddItem,
  onUpdateGoal,
  onClose,
}: EditSheetProps) {
  const isGoal = mode === 'goal'

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={onClose}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <span className="eyebrow">{isGoal ? 'DEADLINE' : mode === 'todo' ? 'TO DO' : 'DAILY ROUTINE'}</span>
            <h2 id="sheet-title">{isGoal ? '目標を編集' : mode === 'todo' ? 'TODOを追加' : '習慣を追加'}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="閉じる"><CloseIcon /></button>
        </div>

        {isGoal ? (
          <form onSubmit={onUpdateGoal}>
            <label>
              <span>目標の名前</span>
              <input autoFocus value={goalDraft.title} onChange={(event) => onGoalDraftChange({ ...goalDraft, title: event.target.value })} placeholder="例：資格試験に合格する" />
            </label>
            <label>
              <span>期限</span>
              <input type="date" value={goalDraft.deadline} min={todayKey} onChange={(event) => onGoalDraftChange({ ...goalDraft, deadline: event.target.value })} />
            </label>
            <button className="primary-button" type="submit">保存する</button>
          </form>
        ) : (
          <form onSubmit={onAddItem}>
            <label>
              <span>{mode === 'todo' ? '具体的にやること' : '毎日続けたいこと'}</span>
              <input autoFocus value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder={mode === 'todo' ? '例：模擬問題を1回解く' : '例：朝30分勉強する'} />
            </label>
            <button className="primary-button" type="submit" disabled={!draft.trim()}>追加する</button>
          </form>
        )}
      </section>
    </div>
  )
}
