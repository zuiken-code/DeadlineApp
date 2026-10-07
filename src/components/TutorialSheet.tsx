import { CloseIcon, GoalIcon, HelpIcon, PlusIcon } from './Icons';

type TutorialSheetProps = {
  onClose: () => void;
};

const steps = [
  {
    number: '01',
    title: '目標を決める',
    body: 'まずは、期限を決めたい抽象的な目標を登録します。画面右上の「目標」から名前と期限を入力してください。',
    icon: GoalIcon,
  },
  {
    number: '02',
    title: '残り日数を見る',
    body: '目標を登録すると、期限までの残り日数とTODOの進捗がホームに表示されます。',
    icon: HelpIcon,
  },
  {
    number: '03',
    title: 'TODOに分解する',
    body: '期限までに必要な具体的な行動をTODOに追加します。終わったら項目をタップしてチェックできます。',
    icon: PlusIcon,
  },
  {
    number: '04',
    title: '毎日の習慣にする',
    body: '目標のために毎日続けたいことはDaily Routineへ。チェックは毎日リセットされるので、今日の習慣として使えます。',
    icon: HelpIcon,
  },
] as const;

export function TutorialSheet({ onClose }: TutorialSheetProps) {
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
        <button className="primary-button tutorial-close" onClick={onClose}>はじめる</button>
      </section>
    </div>
  );
}
