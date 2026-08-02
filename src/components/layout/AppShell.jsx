import { HandCoins, Plus } from 'lucide-react';
import { navIcons } from '../../data/categories.js';
import { budgetStatus } from '../../lib/money.jsx';
import { IconSlot } from '../IconSlot.jsx';
import { Brand } from '../ui/index.js';

export function AppShell({
  children,
  activeRoute,
  isAdmin,
  metrics,
  syncError,
  locale,
  t,
  onAddExpense,
  onAddUdhar,
  onLogout,
  onRouteChange,
  onToggleLanguage,
}) {
  const tabs = isAdmin ? ['dashboard', 'expenses', 'budget', 'reports', 'udhar', 'users'] : ['dashboard', 'expenses', 'budget', 'reports', 'udhar'];

  return (
    <div className="app">
      <aside className="sidebar">
        <Brand t={t} />
        <nav>
          {tabs.map((tab) => (
            <button
              className={activeRoute === tab ? 'active' : ''}
              key={tab}
              aria-label={t(tab)}
              data-tab={tab}
              onClick={() => onRouteChange(tab)}
            >
              <IconSlot icon={navIcons[tab]} />
              {t(tab)}
            </button>
          ))}
        </nav>
        <div className="sidebarCard">
          <span>{t('budgetHealth')}</span>
          <strong>{Math.round(metrics.budgetUsed)}%</strong>
          <div className="tinyTrack">
            <i style={{ width: `${Math.min(metrics.budgetUsed, 100)}%` }} />
          </div>
          <p>{budgetStatus(metrics.budgetUsed, t)}</p>
        </div>
        <button className="language" onClick={onToggleLanguage}>
          {locale === 'hi' ? 'EN' : 'हिंदी'}
        </button>
        <button className="logoutBtn" onClick={onLogout}>
          {t('logout')}
        </button>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="kicker">Kharcha</p>
            <h2>{activeRoute === 'reports' ? t('reportTitle') : t(activeRoute)}</h2>
            {activeRoute === 'reports' && <p className="subhead">{t('reportSub')}</p>}
          </div>
          <div className="actions">
            <button className="softBtn iconBtn" onClick={onAddUdhar}>
              <HandCoins aria-hidden="true" />
              {t('addUdhar')}
            </button>
            <button className="primaryBtn iconBtn" onClick={onAddExpense}>
              <Plus aria-hidden="true" />
              {t('addExpense')}
            </button>
          </div>
        </header>

        {syncError && <div className="syncBanner">{syncError}</div>}
        {children}
      </main>
    </div>
  );
}
