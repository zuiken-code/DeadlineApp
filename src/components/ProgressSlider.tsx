import type { CSSProperties } from 'react'

type ProgressSliderProps = {
  value: number
  onChange: (value: number) => void
  id: string
  ariaLabel: string
  compact?: boolean
}

const labels = ['未着手', '着手', '進行中', '終盤', '達成']

export function ProgressSlider({ value, onChange, id, ariaLabel, compact = false }: ProgressSliderProps) {
  const percentage = value * 25
  return (
    <div className={compact ? 'progress-control progress-control-compact' : 'progress-control'}>
      {!compact && <div className="progress-card-header"><div><span className="list-kicker">目標の達成度</span><h3>目標の達成度</h3></div><strong>{percentage}%</strong></div>}
      {compact && <span className="progress-value">{percentage}%</span>}
      <label className="progress-slider-label" htmlFor={id}>
        <span className="sr-only">{ariaLabel}</span>
        <input id={id} type="range" min="0" max="4" step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-valuetext={`${percentage}%、${labels[value]}`} style={{ '--progress': `${percentage}%` } as CSSProperties} />
        <span className="progress-ticks" aria-hidden="true">
          {labels.map((label, index) => <span key={label} className={index <= value ? 'is-filled' : ''}>{index === value ? label : ''}</span>)}
        </span>
      </label>
    </div>
  )
}
