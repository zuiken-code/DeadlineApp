import type { Goal } from '../data/appStorage'
import { EditIcon } from './Icons'

type DeadlineCardProps = {
  goal: Goal
  deadlineText: string
  daysLeft: number
  progress: number
  onEditGoal: () => void
}

export function DeadlineCard({ goal, deadlineText, daysLeft, progress, onEditGoal }: DeadlineCardProps) {
  return (
    <section className="deadline-card" aria-labelledby="goal-title">
      <button className="goal-edit" onClick={onEditGoal} aria-label="目標を編集">
        <span>GOAL</span>
        <EditIcon />
      </button>
      <h2 id="goal-title">{goal.title}</h2>
      <p className="deadline-date">{deadlineText}まで</p>
      <div className="remaining">
        <span className="remaining-label">残り</span>
        <strong>{daysLeft}</strong>
        <span className="remaining-unit">日</span>
      </div>
      <div className="progress-row">
        <div className="progress-track" aria-label={`TODOの進捗 ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <span>{progress}%</span>
      </div>
    </section>
  )
}
