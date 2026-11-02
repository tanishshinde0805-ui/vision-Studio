import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Compass, Eye, History, Cpu, Map, HelpCircle, Settings, Moon, Sun, Terminal } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useExplain } from '../context/ExplainContext';

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate: (route: string) => void;
  analyses?: any[];
  onSelectAnalysis?: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  analyses = [],
  onSelectAnalysis
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isEffectiveOpen = isOpen !== undefined ? isOpen : internalOpen;
  const setEffectiveOpen = (val: boolean) => {
    if (!val && onClose) onClose();
    setInternalOpen(val);
  };
  const [query, setQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { explainMode, toggleExplainMode } = useExplain();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setEffectiveOpen(!isEffectiveOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEffectiveOpen]);

  const commands = [
    { id: 'overview', title: 'Overview', category: 'Navigation', icon: Compass, action: () => onNavigate('overview') },
    { id: 'analyze', title: 'Analyze & Sonar Canvas', category: 'Navigation', icon: Eye, action: () => onNavigate('analyze') },
    { id: 'history', title: 'Survey History', category: 'Navigation', icon: History, action: () => onNavigate('history') },
    { id: 'model-lab', title: 'Model Lab & Benchmarks', category: 'Navigation', icon: Cpu, action: () => onNavigate('model-lab') },
    { id: 'map', title: 'Bathymetric Contact Map', category: 'Navigation', icon: Map, action: () => onNavigate('map') },
    { id: 'how-it-works', title: 'How It Works', category: 'Navigation', icon: HelpCircle, action: () => onNavigate('how-it-works') },
    { id: 'settings', title: 'Instrument Settings', category: 'Navigation', icon: Settings, action: () => onNavigate('settings') },
    {
      id: 'theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Preferences',
      icon: theme === 'dark' ? Sun : Moon,
      action: toggleTheme
    },
    {
      id: 'explain',
      title: `${explainMode ? 'Deactivate' : 'Activate'} Explain Mode`,
      category: 'Telemetry',
      icon: Terminal,
      action: toggleExplainMode
    },
  ];

  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (action: () => void) => {
    action();
    setEffectiveOpen(false);
    setQuery('');
  };

  return (
    <Dialog.Root open={isEffectiveOpen} onOpenChange={setEffectiveOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
            width: '100%',
            maxWidth: '520px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-muted)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Type an instrument command or route..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                minHeight: '32px',
              }}
            />
            <kbd
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              ESC
            </kbd>
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                No commands matching "{query}"
              </div>
            ) : (
              filtered.map(cmd => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd.action)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                      cursor: 'pointer',
                      minHeight: '36px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={16} color="var(--text-secondary)" />
                      <span>{cmd.title}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {cmd.category}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
