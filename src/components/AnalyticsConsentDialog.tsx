type AnalyticsConsentDialogProps = {
  onAccept: () => void
  onDecline: () => void
}

export function AnalyticsConsentDialog({ onAccept, onDecline }: AnalyticsConsentDialogProps) {
  return (
    <div className="consent-layer" role="presentation">
      <section className="consent-dialog" role="dialog" aria-modal="true" aria-labelledby="consent-title" aria-describedby="consent-description">
        <span className="eyebrow">PRIVACY</span>
        <h2 id="consent-title">利用状況データについて</h2>
        <p id="consent-description">期限くんを改善するため、Google Analyticsで匿名化した利用状況を収集してもよいですか？</p>
        <div className="consent-summary">
          <p><strong>送信するもの</strong><span>目標設定、TODO追加、進捗更新などの操作種別と区分値</span></p>
          <p><strong>送信しないもの</strong><span>目標名、TODO本文、ページ番号、正確な期限</span></p>
        </div>
        <div className="consent-actions">
          <button type="button" className="secondary-button" onClick={onDecline}>同意しない</button>
          <button type="button" className="primary-button" onClick={onAccept}>同意して続ける</button>
        </div>
      </section>
    </div>
  )
}
