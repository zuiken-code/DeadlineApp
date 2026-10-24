import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { PushStatus } from '../data/pushNotifications'

export type GuideFinishAction = 'create-goal' | 'enable-notifications' | 'open-settings' | 'none'

type GuidedTutorialProps = {
  onClose: () => void
  onComplete: (action: GuideFinishAction) => void
  hasGoal: boolean
  pushStatus: PushStatus
  isInstalled: boolean
  canPromptInstall: boolean
  onInstall: () => void
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
    title: 'ページ進捗を記録',
    body: 'TODOの編集ボタンからページ範囲を設定し、一覧の現在ページを入力すると達成率が自動で計算されます。',
  },
  {
    target: '',
    title: 'ホーム画面に追加',
    body: '',
  },
  {
    target: '[data-tour="settings-tab"]',
    title: '毎日の通知を設定',
    body: '',
  },
]

type Position = {
  top: number
  left: number
  arrowLeft: number
  placement: 'above' | 'below' | 'center'
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function GuidedTutorial({ onClose, onComplete, hasGoal, pushStatus, isInstalled, canPromptInstall, onInstall }: GuidedTutorialProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [position, setPosition] = useState<Position>({ top: 0, left: 16, arrowLeft: 40, placement: 'below' })
  const popoverRef = useRef<HTMLDivElement>(null)
  const isInstallStep = stepIndex === steps.length - 2
  const isNotificationStep = stepIndex === steps.length - 1
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(navigator.userAgent)
  const installBody = isInstalled
    ? 'すでにアプリとして起動しています。ホーム画面からいつでも開けます。'
    : isIOS
      ? 'Safariの共有ボタンから「ホーム画面に追加」を選ぶと、アプリとして開けます。iPhone・iPadで通知を使う場合もホーム画面への追加が必要です。'
      : canPromptInstall
        ? '「インストールする」を押すと、ホーム画面やアプリ一覧からすぐ開けるようになります。後からブラウザのメニューから追加することもできます。'
        : isAndroid
          ? 'ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選べます。'
          : '対応ブラウザでは、アドレスバーのインストールアイコンやブラウザのメニューから追加できます。'
  const notificationBody = hasGoal
    ? '期限リマインダーをオンにすると、選んだ時刻に目標名と残り日数を毎日お知らせします。時刻は設定で変更できます。'
    : '通知をオンにすると、選んだ時刻に目標名と残り日数を毎日お知らせします。先に目標と期限を設定しましょう。'
  const step = {
    ...steps[stepIndex],
    target: isNotificationStep && hasGoal && pushStatus !== 'enabled' ? '[data-tour="notifications"]' : steps[stepIndex].target,
    body: isInstallStep ? installBody : isNotificationStep ? notificationBody : steps[stepIndex].body,
  }
  const finishAction: GuideFinishAction = !hasGoal
    ? 'create-goal'
    : pushStatus === 'enabled'
      ? 'none'
      : pushStatus === 'disabled'
        ? 'enable-notifications'
        : 'open-settings'
  const finishLabel = finishAction === 'create-goal'
    ? '目標を設定'
    : finishAction === 'enable-notifications'
      ? '通知をオン'
      : finishAction === 'open-settings'
        ? '通知設定を見る'
        : '完了'

  const updatePosition = useCallback(() => {
    const target = step.target ? document.querySelector<HTMLElement>(step.target) : null
    if (!target) {
      const popoverHeight = popoverRef.current?.offsetHeight ?? 180
      setTargetRect(null)
      setPosition({
        top: Math.max(16, (window.innerHeight - popoverHeight) / 2),
        left: Math.max(16, (window.innerWidth - Math.min(320, window.innerWidth - 32)) / 2),
        arrowLeft: 0,
        placement: 'center',
      })
      return
    }

    const rect = target.getBoundingClientRect()
    const popoverHeight = popoverRef.current?.offsetHeight ?? 180
    const popoverWidth = Math.min(320, window.innerWidth - 32)
    const gap = 16
    const canPlaceBelow = rect.bottom + gap + popoverHeight <= window.innerHeight - 16
    const placement = canPlaceBelow ? 'below' : 'above'
    const desiredTop = placement === 'below'
      ? rect.bottom + gap
      : Math.max(16, rect.top - gap - popoverHeight)
    const top = clamp(desiredTop, 16, Math.max(16, window.innerHeight - popoverHeight - 16))
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
    const target = step.target ? document.querySelector<HTMLElement>(step.target) : null
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
    const frame = requestAnimationFrame(updatePosition)
    return () => cancelAnimationFrame(frame)
  }, [step.target, step.body, canPromptInstall, updatePosition])

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
      <div className={`guided-tutorial-backdrop${targetRect ? '' : ' is-untargeted'}`} aria-hidden="true" />
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
        {isInstallStep && !isInstalled && canPromptInstall && (
          <button type="button" className="guided-tutorial-install" onClick={onInstall}>インストールする</button>
        )}
        <div className="guided-tutorial-actions">
          <button type="button" className="guided-tutorial-skip" onClick={onClose}>スキップ</button>
          <div className="guided-tutorial-navigation">
            {stepIndex > 0 && <button type="button" className="guided-tutorial-back" onClick={() => setStepIndex((current) => current - 1)}>戻る</button>}
            <button type="button" className="guided-tutorial-next" onClick={() => (isLastStep ? onComplete(finishAction) : setStepIndex((current) => current + 1))}>
              {isLastStep ? finishLabel : '次へ'} <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
