import { CloseIcon, GoalIcon, HelpIcon, PlusIcon } from './Icons';

type TutorialSheetProps = {
  onClose: () => void;
  onStartGuide: () => void;
};

const steps = [
  {
    number: '01',
    title: '目標と期限を設定する',
    body: 'まずは期限を決めたい目標を登録します。画面右上の「目標」から名前と期限を入力してください。',
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
    title: 'TODOごとの達成率を記録する',
    body: '右側のスライダーで各TODOの達成度を5段階で記録できます。上部の目標達成度は、その平均から自動計算されます。',
    icon: HelpIcon,
  },
  {
    number: '05',
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
