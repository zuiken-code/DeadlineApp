type AppHeaderProps = {
  onEditGoal: () => void
}

export function AppHeader({ onEditGoal }: AppHeaderProps) {
  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">MY DEADLINE</span>
        <h1>期限くん</h1>
      </div>
      <button className="icon-button" onClick={onEditGoal} aria-label="目標と期限を編集">
        <span /><span /><span />
      </button>
    </header>
  )
}
