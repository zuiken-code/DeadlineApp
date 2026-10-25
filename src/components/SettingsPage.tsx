import { BellIcon, ChevronIcon, HelpIcon, InfoIcon } from './Icons'
import type { AnalyticsConsent } from '../data/analytics'
import type { PushStatus } from '../data/pushNotifications'

type SettingsPageProps = {
  notificationTime: string
  pushStatus: PushStatus
  pushMessage: string
  pushMessageIsError: boolean
  analyticsConsent: AnalyticsConsent
  hasGoal: boolean
  onNotificationTimeChange: (value: string) => void
  onToggleNotifications: () => void
  onSendTestNotification: () => void
  onAnalyticsConsentChange: (enabled: boolean) => void
  onOpenTutorial: () => void
}

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

const STATUS_LABELS: Record<PushStatus, string> = {
  loading: '確認中',
  unsupported: '未対応',
  unavailable: '準備が必要',
  disabled: 'オフ',
  enabled: 'オン',
  denied: 'ブロック中',
  busy: '設定中',
  error: 'エラー',
}

export function SettingsPage({
  notificationTime,
  pushStatus,
  pushMessage,
  pushMessageIsError,
  analyticsConsent,
  hasGoal,
  onNotificationTimeChange,
  onToggleNotifications,
  onSendTestNotification,
  onAnalyticsConsentChange,
  onOpenTutorial,
}: SettingsPageProps) {
  const [hour, minute] = notificationTime.split(':')
  const isEnabled = pushStatus === 'enabled'
  const isBusy = pushStatus === 'loading' || pushStatus === 'busy'
  const cannotToggle = pushStatus === 'unsupported' || pushStatus === 'unavailable' || pushStatus === 'denied'
  const analyticsEnabled = analyticsConsent === 'granted'

  return (
    <section className="settings-page" aria-labelledby="settings-title">
      <header className="settings-header">
        <p className="eyebrow">PREFERENCES</p>
        <h1 id="settings-title">設定</h1>
        <p>通知やアプリの使い方を管理します。</p>
      </header>

      <section className="settings-section" aria-labelledby="notification-settings-title">
        <h2 id="notification-settings-title">通知</h2>
        <div className="settings-group">
          <div className="settings-row settings-toggle-row">
            <span className="settings-icon"><BellIcon /></span>
            <span className="settings-row-copy">
              <strong>期限リマインダー</strong>
              <small>{hasGoal ? '目標までの残り日数を毎日お知らせ' : '先に目標と期限を設定してください'}</small>
            </span>
            <span className={`settings-status status-${pushStatus}`}>{STATUS_LABELS[pushStatus]}</span>
            <button
              type="button"
              className="setting-switch"
              role="switch"
              aria-checked={isEnabled}
              aria-label="期限リマインダー"
              disabled={isBusy || cannotToggle || !hasGoal}
              onClick={onToggleNotifications}
            >
              <span />
            </button>
          </div>

          <div className="settings-row settings-time-row">
            <span className="settings-row-copy">
              <strong>通知時刻</strong>
              <small>端末の現地時間・15分単位</small>
            </span>
            <div className="time-picker" aria-label="通知時刻">
              <label>
                <span className="sr-only">時</span>
                <select
                  value={hour}
                  disabled={isBusy}
                  onChange={(event) => onNotificationTimeChange(`${event.target.value}:${minute}`)}
                >
                  {HOURS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <span aria-hidden="true">:</span>
              <label>
                <span className="sr-only">分</span>
                <select
                  value={minute}
                  disabled={isBusy}
                  onChange={(event) => onNotificationTimeChange(`${hour}:${event.target.value}`)}
                >
                  {MINUTES.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            </div>
          </div>
          {isEnabled && (
            <button type="button" className="settings-link-row" onClick={onSendTestNotification}>
              <span className="settings-icon"><BellIcon /></span>
              <span className="settings-row-copy">
                <strong>テスト通知を送る</strong>
                <small>実際のWeb Pushで届くか確認</small>
              </span>
              <ChevronIcon />
            </button>
          )}
        </div>
        <p className={`settings-footnote${pushMessage && (pushMessageIsError || pushStatus === 'error' || pushStatus === 'denied' || pushStatus === 'unavailable') ? ' has-error' : ''}`} aria-live="polite">
          {pushMessage || '通知をオンにすると、目標名・期限・通知情報をCloudflareへ保存します。通知をオフにすると削除します。'}
        </p>
      </section>

      <section className="settings-section" aria-labelledby="privacy-settings-title">
        <h2 id="privacy-settings-title">プライバシー</h2>
        <div className="settings-group">
          <div className="settings-row settings-toggle-row">
            <span className="settings-icon"><InfoIcon /></span>
            <span className="settings-row-copy">
              <strong>利用状況の共有</strong>
              <small>匿名化した操作データをアプリ改善に利用</small>
            </span>
            <span className={`settings-status ${analyticsEnabled ? 'status-enabled' : ''}`}>{analyticsEnabled ? 'オン' : 'オフ'}</span>
            <button
              type="button"
              className="setting-switch"
              role="switch"
              aria-checked={analyticsEnabled}
              aria-label="Google Analyticsによる利用状況の共有"
              onClick={() => onAnalyticsConsentChange(!analyticsEnabled)}
            >
              <span />
            </button>
          </div>
        </div>
        <p className="settings-footnote">Google Analyticsへ目標名、TODO本文、ページ番号、正確な期限は送信しません。オフにすると以後の計測を停止します。</p>
      </section>

      <section className="settings-section" aria-labelledby="support-settings-title">
        <h2 id="support-settings-title">サポート</h2>
        <div className="settings-group">
          <button type="button" className="settings-link-row" onClick={onOpenTutorial}>
            <span className="settings-icon"><HelpIcon /></span>
            <span>使い方</span>
            <ChevronIcon />
          </button>
          <div className="settings-row">
            <span className="settings-icon"><InfoIcon /></span>
            <span className="settings-row-copy">
              <strong>このアプリについて</strong>
              <small>期限から逆算して進捗を管理</small>
            </span>
            <span className="settings-value">期限くん</span>
          </div>
        </div>
      </section>

      <p className="settings-future-note">アカウント、利用規約などの設定は今後ここへ追加できます。</p>
    </section>
  )
}
