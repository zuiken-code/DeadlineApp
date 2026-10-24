import { HomeIcon, SettingsIcon } from './Icons'

type BottomNavigationProps = {
  activePage: 'home' | 'settings'
  onNavigate: (page: 'home' | 'settings') => void
}

export function BottomNavigation({ activePage, onNavigate }: BottomNavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="メインナビゲーション">
      <button className={`nav-item${activePage === 'home' ? ' active' : ''}`} aria-current={activePage === 'home' ? 'page' : undefined} onClick={() => onNavigate('home')}>
        <HomeIcon />
        <span>ホーム</span>
      </button>
      <button className={`nav-item${activePage === 'settings' ? ' active' : ''}`} data-tour="settings-tab" aria-current={activePage === 'settings' ? 'page' : undefined} onClick={() => onNavigate('settings')}>
        <SettingsIcon />
        <span>設定</span>
      </button>
    </nav>
  )
}
