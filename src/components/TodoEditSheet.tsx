import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ListItem, PageProgress } from '../data/appStorage'
import { CloseIcon } from './Icons'

type TodoEditSheetProps = {
  item: ListItem
  onSave: (id: number, title: string, pageProgress: PageProgress) => void
  onClose: () => void
  errorMessage?: string
}

const isPositiveInteger = (value: string) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) >= 1

export function TodoEditSheet({ item, onSave, onClose, errorMessage }: TodoEditSheetProps) {
  const [title, setTitle] = useState(item.title)
  const [startPage, setStartPage] = useState(item.pageProgress ? String(item.pageProgress.startPage) : '1')
  const [endPage, setEndPage] = useState(item.pageProgress ? String(item.pageProgress.endPage) : '')
  const [currentPage, setCurrentPage] = useState(item.pageProgress?.currentPage == null ? '' : String(item.pageProgress.currentPage))

  const start = Number(startPage)
  const end = Number(endPage)
  const current = currentPage === '' ? null : Number(currentPage)
  const hasValidRange = isPositiveInteger(startPage) && isPositiveInteger(endPage) && start <= end
  const hasValidCurrent = current === null || (isPositiveInteger(currentPage) && hasValidRange && current >= start && current <= end)
  const totalPages = hasValidRange ? end - start + 1 : 0
  const completedPages = hasValidRange && hasValidCurrent && current !== null ? current - start + 1 : 0
  const percentage = totalPages > 0 ? Math.round(completedPages / totalPages * 100) : 0
  const canSave = Boolean(title.trim()) && hasValidRange && hasValidCurrent

  const validationMessage = (() => {
    if (!title.trim()) return 'やることの名前を入力してください。'
    if (!startPage || !endPage) return '開始番号と終了番号を入力してください。'
    if (!isPositiveInteger(startPage) || !isPositiveInteger(endPage)) return '番号は1以上の整数で入力してください。'
    if (start > end) return '終了番号は開始番号以降にしてください。'
    if (!hasValidCurrent) return `現在の番号は${start}〜${end}の範囲で入力してください。`
    return ''
  })()
  const showValidation = !title.trim() || (Boolean(endPage) && (!hasValidRange || !hasValidCurrent))

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSave) return
    onSave(item.id, title.trim(), { startPage: start, endPage: end, currentPage: current })
  }

  return (
    <div className="sheet-layer" role="presentation" onMouseDown={onClose}>
      <section className="sheet todo-edit-sheet" role="dialog" aria-modal="true" aria-labelledby="todo-edit-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <span className="eyebrow">RANGE PROGRESS</span>
            <h2 id="todo-edit-title">やることを編集</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="編集画面を閉じる"><CloseIcon /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label>
            <span>やることの名前</span>
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：数学の問題集" />
          </label>

          <p id="range-unit-help" className="range-unit-hint">ページ番号でも問題番号でもOK。同じ単位で開始・終了・現在を入力してください。</p>

          <div className="page-range-fields">
            <label>
              <span>開始番号</span>
              <input inputMode="numeric" pattern="[0-9]*" value={startPage} onChange={(event) => setStartPage(event.target.value)} placeholder="1" aria-describedby="range-unit-help page-range-help" />
            </label>
            <label>
              <span>終了番号</span>
              <input inputMode="numeric" pattern="[0-9]*" value={endPage} onChange={(event) => setEndPage(event.target.value)} placeholder="100" aria-describedby="range-unit-help page-range-help" />
            </label>
          </div>

          <label>
            <span>現在の番号 <small>未着手なら空欄</small></span>
            <input inputMode="numeric" pattern="[0-9]*" value={currentPage} onChange={(event) => setCurrentPage(event.target.value)} placeholder={hasValidRange ? `${start}〜${end}` : '例：30'} aria-describedby="range-unit-help page-range-help" />
          </label>

          <div id="page-range-help" className={`page-range-summary ${showValidation ? 'has-error' : ''}`} aria-live="polite">
            {hasValidRange && hasValidCurrent ? (
              <>
                <div className="page-range-summary-header">
                  <span>全{totalPages}のうち{completedPages}完了</span>
                  <strong>{percentage}%</strong>
                </div>
                <div className="progress-track" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div>
                <p>{current === null ? '現在は未着手です。' : `${start}〜${current}までを達成として計算します。`}</p>
              </>
            ) : (
              <p>{showValidation ? validationMessage : '範囲を入力すると、全体数と達成率を確認できます。'}</p>
            )}
            {showValidation && hasValidRange && hasValidCurrent && <p className="sheet-form-error">{validationMessage}</p>}
          </div>

          {errorMessage && <p className="sheet-form-error" role="alert">{errorMessage}</p>}
          <button className="primary-button" type="submit" disabled={!canSave}>保存する</button>
        </form>
      </section>
    </div>
  )
}
