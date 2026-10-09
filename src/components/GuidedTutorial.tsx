import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

type GuidedTutorialProps = {
  onClose: () => void
}

type GuideStep = {
  target: string
  title: string
  body: string
}

const steps: GuideStep[] = [
  {
    target: '[data-tour="goal"]',
    title: 'ここで目標を入力',
    body: '目標の名前と期限を設定します。入力すると、残り日数のカウントダウンが始まります。',
  },
  {
    target: '.deadline-card',
    title: '進み具合を確認',
    body: '残り日数、期間内の休日、TODOから計算した目標の達成度をここで確認できます。',
  },
  {
    target: '[data-tour="todo-add"]',
    title: 'ここからタスクを追加',
    body: '期限までにやる具体的なことをTODOとして追加します。小さな行動に分けるのがおすすめです。',
  },
  {
    target: '[data-tour="progress"]',
    title: '達成率を記録',
    body: 'TODOを追加すると、右側のスライダーで5段階の達成率を記録できます。',
  },
]

type Position = {
  top: number
  left: number
  arrowLeft: number
  placement: 'above' | 'below'
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function GuidedTutorial({ onClose }: GuidedTutorialProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [position, setPosition] = useState<Position>({ top: 0, left: 16, arrowLeft: 40, placement: 'below' })
  const popoverRef = useRef<HTMLDivElement>(null)
  const step = steps[stepIndex]

  const updatePosition = useCallback(() => {
    const target = document.querySelector<HTMLElement>(step.target)
    if (!target) {
      setTargetRect(null)
      setPosition({
        top: Math.max(24, (window.innerHeight - 180) / 2),
        left: 16,
        arrowLeft: 40,
        placement: 'below',
      })
      return
    }

    const rect = target.getBoundingClientRect()
    const popoverHeight = popoverRef.current?.offsetHeight ?? 180
    const popoverWidth = Math.min(320, window.innerWidth - 32)
    const gap = 16
    const canPlaceBelow = rect.bottom + gap + popoverHeight <= window.innerHeight - 16
    const placement = canPlaceBelow ? 'below' : 'above'
    const top = placement === 'below'
      ? rect.bottom + gap
      : Math.max(16, rect.top - gap - popoverHeight)
    const left = clamp(rect.left + (rect.width / 2) - (popoverWidth / 2), 16, window.innerWidth - popoverWidth - 16)

    setTargetRect(rect)
    setPosition({
      top,
      left,
      arrowLeft: clamp(rect.left + (rect.width / 2) - left, 24, popoverWidth - 24),
      placement,
    })
  }, [step.target])

  useLayoutEffect(() => {
    const target = document.querySelector<HTMLElement>(step.target)
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
    const frame = requestAnimationFrame(updatePosition)
    return () => cancelAnimationFrame(frame)
  }, [step.target, updatePosition])

  useEffect(() => {
    const handleViewportChange = () => updatePosition()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, updatePosition])

  const isLastStep = stepIndex === steps.length - 1

  return (
    <div className="guided-tutorial" role="dialog" aria-modal="true" aria-labelledby="guided-tutorial-title" aria-describedby="guided-tutorial-body">
      <div className="guided-tutorial-backdrop" aria-hidden="true" />
      {targetRect && (
        <div
          className="guided-tutorial-spotlight"
          aria-hidden="true"
          style={{
            top: Math.max(4, targetRect.top - 6),
            left: Math.max(4, targetRect.left - 6),
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}
      <div
        ref={popoverRef}
        className={`guided-tutorial-popover is-${position.placement}`}
        style={{
          top: position.top,
          left: position.left,
          '--arrow-left': `${position.arrowLeft}px`,
        } as CSSProperties}
      >
        <span className="guided-tutorial-step">{String(stepIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
        <h2 id="guided-tutorial-title">{step.title}</h2>
        <p id="guided-tutorial-body">{step.body}</p>
        <div className="guided-tutorial-actions">
          <button type="button" className="guided-tutorial-skip" onClick={onClose}>スキップ</button>
          <div className="guided-tutorial-navigation">
            {stepIndex > 0 && <button type="button" className="guided-tutorial-back" onClick={() => setStepIndex((current) => current - 1)}>戻る</button>}
            <button type="button" className="guided-tutorial-next" onClick={() => (isLastStep ? onClose() : setStepIndex((current) => current + 1))}>
              {isLastStep ? '完了' : '次へ'} <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
