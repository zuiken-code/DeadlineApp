import { BellIcon, CloseIcon, GoalIcon, HelpIcon, PlusIcon } from './Icons';

type TutorialSheetProps = {
  onClose: () => void;
  onStartGuide: () => void;
};

const steps = [
  {
    number: '01',
    title: '目標と期限を設定する',
    body: 'まずは期限を決めたい目標を登録します。ホーム上部のカードから名前と期限を入力してください。',
    icon: GoalIcon,
  },
  {
    number: '02',
    title: '残り日数と休日を確認する',
    body: '目標を登録すると、期限までの残り日数と期間内の休日数がホームに表示されます。',
    icon: HelpIcon,
  },
  {
    number: '03',
    title: 'TODOを追加して完了する',
    body: '期限までに必要な具体的な行動をTODOに追加します。終わったら左側の項目をタップしてチェックできます。',
    icon: PlusIcon,
  },
  {
    number: '04',
    title: 'ページ・問題の進捗を記録する',
    body: 'TODOの編集ボタンからページ番号や問題番号の開始・終了を設定します。一覧で現在の番号を入力すると、達成率と上部の目標達成度が自動計算されます。',
    icon: HelpIcon,
  },
  {
    number: '05',
    title: 'ホーム画面に追加する',
    body: 'インストールするとホーム画面からすぐ開けます。iPhone・iPadではSafariの共有メニューから「ホーム画面に追加」を選びます。',
    icon: HelpIcon,
  },
  {
    number: '06',
    title: '毎日の通知を設定する',
    body: '目標を設定したら、期限リマインダーをオンにできます。選んだ時刻に目標名と残り日数を毎日お知らせします。',
    icon: BellIcon,
  },
  {
    number: '07',
    title: '削除とオフライン利用',
    body: 'スマートフォンではTODOを右へスワイプして削除できます。左へ戻すとキャンセルできます。アプリ本体はオフラインでも利用できます。',
    icon: HelpIcon,
  },
] as const;

export function TutorialSheet({ onClose, onStartGuide }: TutorialSheetProps) {
  return (
    <div className="tutorial-layer" role="presentation" onMouseDown={onClose}>
      <section className="tutorial-sheet" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <span className="eyebrow">HOW TO USE</span>
            <h2 id="tutorial-title">期限くんの使い方</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="使い方を閉じる"><CloseIcon /></button>
        </div>
        <p className="tutorial-lead">大きな目標を、今日できる一歩に変えていきましょう。</p>
        <div className="tutorial-steps">
          {steps.map(({ number, title, body, icon: Icon }) => (
            <article className="tutorial-step" key={number}>
              <div className="tutorial-step-icon"><Icon /></div>
              <div className="tutorial-step-copy">
                <span className="tutorial-number">{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="tutorial-actions">
          <button className="secondary-button" onClick={onStartGuide}>チュートリアルを開始</button>
          <button className="primary-button tutorial-close" onClick={onClose}>閉じる</button>
        </div>
      </section>
    </div>
  );
}
