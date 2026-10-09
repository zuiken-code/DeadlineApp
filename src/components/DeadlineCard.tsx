import type { Goal } from "../data/appStorage";
import { EditIcon } from "./Icons";

type DeadlineCardProps = {
  goal: Goal;
  deadlineText: string;
  daysLeft: number;
  holidayCount: number;
  holidayAvailable: boolean;
  goalProgress: number;
  onEditGoal: () => void;
};

export function DeadlineCard({
  goal,
  deadlineText,
  daysLeft,
  holidayCount,
  holidayAvailable,
  goalProgress,
  onEditGoal,
}: DeadlineCardProps) {
  const hasGoal = Boolean(goal.title && goal.deadline);

  return (
    <section className="deadline-card" aria-labelledby="goal-title">
      <button
        className="goal-edit"
        data-tour="goal"
        onClick={onEditGoal}
        aria-label="目標を編集"
      >
        <span>目標</span>
        <EditIcon />
      </button>
      <h2 id="goal-title">{hasGoal ? goal.title : 'まずは目標を設定しましょう'}</h2>
      <p className="deadline-date">{hasGoal ? `${deadlineText}まで` : '目標と期限を入力するとカウントダウンが始まります'}</p>
      <div className="remaining">
        <span className="remaining-label">残り</span>
        <strong>{hasGoal ? daysLeft : '—'}</strong>
        {hasGoal && <span className="remaining-unit">日</span>}
      </div>
      {hasGoal && <p className="holiday-count">{holidayAvailable ? `休日 ${holidayCount}日` : '休日データ未取得'}</p>}
      {hasGoal && <div className="goal-progress-summary" aria-label={`目標の達成度 ${goalProgress}%`}>
        <div className="goal-progress-header"><span>目標の達成度</span><strong>{goalProgress}%</strong></div>
        <div className="progress-track"><span style={{ width: `${goalProgress}%` }} /></div>
      </div>}
    </section>
  );
}
