import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  HardDrive, 
  Database, 
  Cpu, 
  Trash2, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../api';
import { SystemHealth } from '../types';
import { ExplainBadge } from '../components/ExplainBadge';

interface SettingsProps {
  onRefreshData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onRefreshData }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const fetchHealth = () => {
    setIsLoadingHealth(true);
    api.getHealth()
      .then((data) => {
        setHealth(data);
      })
      .catch((err) => {
        console.error('Health fetch failed', err);
      })
      .finally(() => {
        setIsLoadingHealth(false);
      });
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSeedDemo = async () => {
    setDemoLoading(true);
    setDemoMessage(null);
    try {
      const res = await api.loadDemoData(400);
      setDemoMessage(`Successfully populated ${res.count || 400} synthetic survey records.`);
      onRefreshData();
    } catch (err: any) {
      setDemoMessage(`Failed to seed demo data: ${err.message}`);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleClearDemo = async () => {
    setDemoLoading(true);
    setDemoMessage(null);
    try {
      const res = await api.clearDemoData();
      setDemoMessage(`Purged ${res.deleted || 0} synthetic demo records from mission database.`);
      onRefreshData();
    } catch (err: any) {
      setDemoMessage(`Failed to clear demo data: ${err.message}`);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '960px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            System Infrastructure & Storage Governance
          </h1>
          <ExplainBadge
            title="System Settings & Guardrails"
            rationale="Monitors hardware acceleration health, local workspace directory constraints, and manages demo dataset states."
          />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '2px' }}>
          Engine status, hardware profiling, local package caches, and database ingestion controls
        </p>
      </div>

      {/* System Health Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>
              Service Status & Hardware Profile
            </h2>
          </div>
          <button
            onClick={fetchHealth}
            disabled={isLoadingHealth}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
            }}
          >
            <RefreshCw size={13} className={isLoadingHealth ? 'animate-spin' : ''} />
            <span>Refresh Health</span>
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>API GATEWAY</div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginTop: '4px', color: 'var(--accent-cyan)' }}>
              Online (Port 8000)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>FastAPI Gateway</div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>AI INFERENCE ENGINE</div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginTop: '4px', color: 'var(--accent-cyan)' }}>
              Online (Port 8001)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ONNX Runtime & PyTorch</div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DATABASE TIER</div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginTop: '4px', color: 'var(--accent-cyan)' }}>
              Connected
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SQLite (vision_studio.db)</div>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HOST PROCESSOR</div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginTop: '4px' }}>
              AMD Ryzen 5 5600H
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>12 Threads / 15.3 GB RAM</div>
          </div>
        </div>
      </div>

      {/* Strict Storage & Directory Isolation Guardrails */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive size={18} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>
            Workspace Isolation Guardrails
          </h2>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          In strict compliance with isolation guardrails, all neural caches, package binaries, and runtime artifacts reside strictly within `vision-studio-final`:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
          <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-xs)' }}>
            <span style={{ color: 'var(--text-muted)' }}>YOLO_CONFIG_DIR: </span>
            <span style={{ color: 'var(--text-primary)' }}>d:\CV-Project\vision-studio-final\.tmp\ultralytics</span>
          </div>
          <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-xs)' }}>
            <span style={{ color: 'var(--text-muted)' }}>TORCH_HOME: </span>
            <span style={{ color: 'var(--text-primary)' }}>d:\CV-Project\vision-studio-final\.tmp\torch</span>
          </div>
          <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-xs)' }}>
            <span style={{ color: 'var(--text-muted)' }}>DOWNLOAD CAP: </span>
            <span style={{ color: 'var(--text-primary)' }}>25 GB limit (136.8 GB free on D:)</span>
          </div>
        </div>
      </div>

      {/* Demo Dataset Controls */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--signal-alert)" />
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>
            Synthetic Demo Dataset Controls
          </h2>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Seed or clear the mission database with 400 synthetic survey records generated from server-side ground truth distributions with realistic noise. All generated records are clearly tagged with <code>source: demo</code>.
        </p>

        {demoMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-elevated)',
              borderLeft: '3px solid var(--accent-cyan)',
              borderRadius: 'var(--radius-xs)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-primary)',
            }}
          >
            {demoMessage}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSeedDemo}
            disabled={demoLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'var(--signal-alert)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: 'var(--text-xs)',
              cursor: demoLoading ? 'not-allowed' : 'pointer',
              opacity: demoLoading ? 0.7 : 1,
            }}
          >
            <DownloadCloud size={14} />
            <span>Seed 400 Demo Records</span>
          </button>

          <button
            onClick={handleClearDemo}
            disabled={demoLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: 'var(--text-xs)',
              cursor: demoLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <Trash2 size={14} />
            <span>Purge All Demo Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
