import React from 'react';
import { 
  LayoutDashboard, 
  ScanLine, 
  History as HistoryIcon, 
  FlaskConical, 
  Compass, 
  BookOpen, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  HelpCircle,
  Search,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useExplain } from '../context/ExplainContext';

interface NavigationProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
  onOpenCommandPalette: () => void;
  onStartTour: () => void;
  systemStatus?: string;
  demoCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentRoute,
  onRouteChange,
  onOpenCommandPalette,
  onStartTour,
  systemStatus = 'online',
  demoCount = 0
}) => {
  const { theme, toggleTheme } = useTheme();
  const { explainMode, toggleExplainMode } = useExplain();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze', icon: ScanLine },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'model-lab', label: 'Model Lab', icon: FlaskConical },
    { id: 'map', label: 'Survey Map', icon: Compass },
    { id: 'how-it-works', label: 'Architecture', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Top Header for Desktop & Tablet */}
      <header
        style={{
          height: '56px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-4)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button
            onClick={() => onRouteChange('overview')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 0,
              color: 'var(--text-primary)',
              textAlign: 'left'
            }}
            aria-label="Vision-Studio Home"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--raw-abyss)',
                border: '1px solid var(--raw-tide)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--raw-shallows)',
                fontWeight: 700,
                fontSize: 'var(--text-sm)'
              }}
            >
              VS
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', letterSpacing: '0.04em' }}>
                VISION-STUDIO
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Precision Underwater AI
              </div>
            </div>
          </button>

          {/* Desktop Nav Items */}
          <nav
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              marginLeft: 'var(--space-4)',
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onRouteChange(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--border-hairline)' : 'transparent',
                    backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <Icon size={15} color={isActive ? 'var(--text-primary)' : 'var(--text-muted)'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Quick Search Ctrl+K */}
          <button
            onClick={onOpenCommandPalette}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '6px 10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
            title="Open command palette (Ctrl+K)"
          >
            <Search size={13} />
            <span className="search-text">Search...</span>
            <kbd
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-xs)',
                padding: '1px 5px',
                fontSize: '10px',
              }}
            >
              Ctrl+K
            </kbd>
          </button>

          {/* Explain Mode Toggle */}
          <button
            onClick={toggleExplainMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: explainMode ? 'var(--signal-border)' : 'var(--border-hairline)',
              backgroundColor: explainMode ? 'var(--signal-bg)' : 'transparent',
              color: explainMode ? 'var(--signal-alert)' : 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Toggle Explain Mode with interactive widget architecture breakdowns"
          >
            <HelpCircle size={14} />
            <span>Explain</span>
            {explainMode && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--signal-alert)',
                }}
              />
            )}
          </button>

          {/* Tour Trigger */}
          <button
            onClick={onStartTour}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
            title="Start Interactive Guided Tour"
          >
            <Sparkles size={14} />
            <span className="tour-text">Tour</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Mobile 375px Bottom Navigation Bar */}
      <nav
        className="mobile-bottom-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '56px',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-hairline)',
          display: 'none', // enabled via media query below
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 50,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onRouteChange(item.id)}
              style={{
                flex: 1,
                minHeight: '44px', // 44px touch target requirement
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                gap: '2px',
                padding: '4px',
              }}
            >
              <Icon size={18} color={isActive ? 'var(--text-primary)' : 'var(--text-muted)'} />
              <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 500 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .search-text { display: none !important; }
          .tour-text { display: none !important; }
          .mobile-bottom-bar { display: flex !important; }
          body { padding-bottom: 60px; }
        }
      `}</style>
    </>
  );
};
