import React, { useState } from 'react';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { useQueryClient } from '@tanstack/react-query';

interface DemoBannerProps {
  demoCount?: number;
  onClearDemo?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ demoCount = 0, onClearDemo }) => {
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);
  const [clearedMsg, setClearedMsg] = useState<string | null>(null);

  if (demoCount === 0 && !clearedMsg) return null;

  const handleClear = async () => {
    try {
      setClearing(true);
      const res = await api.clearDemoData();
      setClearedMsg(res.message || 'Demo records successfully purged.');
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setTimeout(() => setClearedMsg(null), 4000);
    } catch (err: any) {
      alert(`Failed to clear demo data: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--signal-bg)',
        borderBottom: '1px solid var(--signal-border)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 'var(--text-xs)',
        color: 'var(--signal-alert)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={15} />
        <span>
          <strong>SIMULATION / DEMO DATA ACTIVE:</strong> {demoCount} synthetic and benchmark demonstration records are currently populated in this workspace. Simulated telemetry is explicitly separated from real inference records.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {clearedMsg ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            <CheckCircle2 size={14} />
            {clearedMsg}
          </span>
        ) : (
          <button
            onClick={handleClear}
            disabled={clearing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'var(--signal-alert)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '11px',
              cursor: clearing ? 'not-allowed' : 'pointer',
              minHeight: '26px',
            }}
          >
            <Trash2 size={13} />
            <span>{clearing ? 'Purging...' : 'Purge Demo Data'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
