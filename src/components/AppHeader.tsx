import { HelpIcon } from './Icons';

type AppHeaderProps = {
  onEditGoal: () => void;
  onOpenTutorial: () => void;
};

export function AppHeader({ onEditGoal, onOpenTutorial }: AppHeaderProps) {
  return (
    <header className="topbar">
      <div>
        <h1>期限くん</h1>
      </div>
      <div className="topbar-actions">
        <button className="help-button" onClick={onOpenTutorial}>
          <HelpIcon />
          <span>使い方</span>
        </button>
        <button className="icon-button" onClick={onEditGoal} aria-label="目標と期限を編集">
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
