import { BellIcon, ChevronIcon } from './Icons'
import type { PushStatus } from '../data/pushNotifications'

type NotificationPromptProps = {
  status: PushStatus
  onEnable: () => void
  onOpenSettings: () => void
}

export function NotificationPrompt({ status, onEnable, onOpenSettings }: NotificationPromptProps) {
  if (status === 'enabled') return null

  const canEnable = status === 'disabled'

  return (
    <section className="notification-prompt" data-tour="notifications" aria-labelledby="notification-prompt-title">
      <span className="notification-prompt-icon"><BellIcon /></span>
      <div className="notification-prompt-copy">
        <h2 id="notification-prompt-title">期限を毎日お知らせ</h2>
        <p>通知をオンにすると、設定した時刻に目標までの残り日数を確認できます。</p>
      </div>
      <button type="button" onClick={canEnable ? onEnable : onOpenSettings} disabled={status === 'busy'}>
        {status === 'busy' ? '設定中' : canEnable ? '通知をオン' : '設定を見る'}
        {status !== 'busy' && <ChevronIcon />}
      </button>
    </section>
  )
}
