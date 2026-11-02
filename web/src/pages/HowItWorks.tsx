import React from 'react';
import { 
  BookOpen, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Database, 
  Radio, 
  Eye, 
  Workflow,
  Sparkles
} from 'lucide-react';
import { ExplainBadge } from '../components/ExplainBadge';

export const HowItWorks: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '960px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            System Architecture & Methodology
          </h1>
          <ExplainBadge
            title="Oceanographic AI Methodology"
            rationale="Details the physical optics of underwater light attenuation, video-group leakage elimination, and deterministic edge inference architecture."
          />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '2px' }}>
          Acoustic backscatter phenomenology, leakage-free benchmark design, and precision-instrument UI principles
        </p>
      </div>

      {/* Architecture Signal Flow Diagram */}
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
          <Workflow size={18} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>
            End-to-End Survey Processing Flow
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>01 / INGESTION</div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginTop: '4px' }}>Optical & Acoustic Stream</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Accepts ROV HD video frames and side-scan sonar arrays.
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>02 / NORMALIZATION</div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginTop: '4px' }}>CLAHE & Depth Balancing</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Equalizes color attenuation and enhances high-frequency edges.
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>03 / INFERENCE</div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginTop: '4px' }}>YOLO11n Edge Tensor</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              18.0 ms CPU latency via ONNX Runtime with contiguous class mapping.
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>04 / TELEMETRY</div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginTop: '4px' }}>Instrument Panel</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Renders leader-line overlays, bathymetric contours, and pipeline traces.
            </div>
          </div>
        </div>
      </div>

      {/* Critical Discovery: Leakage-Free Partitioning */}
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
          <ShieldCheck size={18} color="var(--signal-alert)" />
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>
            Zero-Leakage Dataset Engineering
          </h2>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          During initial Phase 2 reconnaissance, a critical flaw in the official TrashCan dataset distribution was identified: <strong>113 of 115 validation videos leaked directly into the training partition</strong>. Because consecutive video frames in underwater surveys exhibit near-identical backgrounds, random frame splits create artificial 99%+ mAP scores that collapse in the field.
        </p>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-elevated)',
            borderLeft: '3px solid var(--signal-alert)',
            borderRadius: 'var(--radius-xs)',
            fontSize: 'var(--text-xs)',
            lineHeight: 1.6,
          }}
        >
          <strong>Methodological Resolution:</strong> We parsed the source video identifier (`vid_XXXXXX`) from every file name and regrouped all 7,212 TrashCan frames so that no video appears in more than one partition. Furthermore, a held-out test split (1,386 frames) was carved out for pure zero-leakage finalist evaluation.
        </div>
      </div>

      {/* Underwater Optics & Acoustic Phenomenology */}
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
          <Radio size={18} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>
            Underwater Optics & Sonar Phenomenology
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', fontSize: 'var(--text-xs)', lineHeight: 1.7 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Optical Absorption Spectrum</div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Water selectively absorbs electromagnetic radiation: red wavelengths (650-700 nm) are extinguished within the first 5 meters of depth, orange within 10 meters, and yellow within 20 meters. Beyond 30 meters, only blue-green photons penetrate, creating extreme monochrome low-contrast scattering.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Side-Scan Sonar Acoustic Physics</div>
            <p style={{ color: 'var(--text-secondary)' }}>
              High-frequency side-scan sonar (900 kHz) replaces optics with acoustic pressure pulses. The resulting scan records backscatter intensity: hard reflective objects (metals, discarded pipes) create bright highlights followed by distinct acoustic shadow voids.
            </p>
          </div>
        </div>
      </div>

      {/* Design System Principles */}
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
          <Layers size={18} color="var(--text-primary)" />
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>
            Design System: Survey Chart Meets Instrument Panel
          </h2>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Vision-Studio rejects generic SaaS aesthetics (gradient washes, cartoonish illustrations, oversized pastel pills) in favor of deep-ocean instrument rigor. Every pixel adheres to bathymetric depth hierarchy:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '8px', backgroundColor: '#0A2433', borderRadius: '4px', border: '1px solid #0E6F7C' }}>
            <div style={{ fontWeight: 700, fontSize: '11px', color: '#EEF3F4' }}>Abyss #0A2433</div>
            <div style={{ fontSize: '10px', color: '#BFE3E6' }}>Ocean floor foundation</div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#0E6F7C', borderRadius: '4px' }}>
            <div style={{ fontWeight: 700, fontSize: '11px', color: '#FFFFFF' }}>Tide #0E6F7C</div>
            <div style={{ fontSize: '10px', color: '#BFE3E6' }}>Hairline dividers & structural tiers</div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#BFE3E6', borderRadius: '4px', color: '#0A2433' }}>
            <div style={{ fontWeight: 700, fontSize: '11px' }}>Shallows #BFE3E6</div>
            <div style={{ fontSize: '10px' }}>Secondary readouts & accents</div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#EEF3F4', borderRadius: '4px', color: '#0A2433' }}>
            <div style={{ fontWeight: 700, fontSize: '11px' }}>Fog #EEF3F4</div>
            <div style={{ fontSize: '10px' }}>High-contrast typography</div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#FF5A1F', borderRadius: '4px', color: '#FFFFFF' }}>
            <div style={{ fontWeight: 700, fontSize: '11px' }}>Signal #FF5A1F</div>
            <div style={{ fontSize: '10px' }}>Target detections & alerts only</div>
          </div>
        </div>
      </div>
    </div>
  );
};
