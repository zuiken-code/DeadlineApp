import { GoalIcon, HomeIcon } from './Icons'

type BottomNavigationProps = {
  onEditGoal: () => void
}

export function BottomNavigation({ onEditGoal }: BottomNavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="メインナビゲーション">
      <button className="nav-item active" aria-current="page">
        <HomeIcon />
        <span>ホーム</span>
      </button>
      <button className="nav-item" onClick={onEditGoal}>
        <GoalIcon />
        <span>目標</span>
      </button>
    </nav>
  )
}
