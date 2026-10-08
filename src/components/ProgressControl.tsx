type ProgressControlProps = {
  value: number
  onChange: (value: number) => void
}

const labels = ['未着手', '着手', '進行中', '終盤', '達成']

export function ProgressControl({ value, onChange }: ProgressControlProps) {
  const percentage = value * 25

  return (
    <aside className="progress-card" aria-labelledby="progress-title">
      <div className="progress-card-header">
        <div>
          <span className="list-kicker">GOAL PROGRESS</span>
          <h3 id="progress-title">目標の達成度</h3>
        </div>
        <strong>{percentage}%</strong>
      </div>
      <label className="progress-slider-label" htmlFor="goal-progress">
        <span className="sr-only">目標の達成度を5段階で選択</span>
        <input
          id="goal-progress"
          type="range"
          min="0"
          max="4"
          step="1"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-valuetext={`${percentage}%、${labels[value]}`}
        />
        <span className="progress-ticks" aria-hidden="true">
          {labels.map((label, index) => <span key={label} className={index <= value ? 'is-filled' : ''}>{index === value ? label : ''}</span>)}
        </span>
      </label>
    </aside>
  )
}
