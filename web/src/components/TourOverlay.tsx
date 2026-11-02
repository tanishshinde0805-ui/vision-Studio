import React, { useState, useEffect } from 'react';
import { Compass, ArrowRight, X, Check } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  content: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'overview',
    title: 'Precision Operational Overview',
    content: 'Review telemetry health, detection counts over time, class rankings, and plain-language survey insights in real-time.',
  },
  {
    target: 'analyze',
    title: 'Analysis Viewer & Canvas',
    content: 'Upload acoustic or optical frames, test synthetic backscatter generators, zoom/pan with live graticules, and adjust confidence thresholds.',
  },
  {
    target: 'explain',
    title: 'Explain Mode & Data Lineage',
    content: 'Toggle Explain Mode via the topbar to inspect data lineage, formulas, and deep stage-by-stage pipeline waterfalls.',
  },
  {
    target: 'model-lab',
    title: 'Model Lab & Benchmarks',
    content: 'Compare model cards, PR curves, confusion matrices, and CPU latency across YOLO11n, YOLOv8n, and domain-adapted detectors.',
  },
  {
    target: 'command-palette',
    title: 'Global Command Launcher',
    content: 'Press Ctrl+K at any moment to search records, switch models, jump between views, or trigger synthetic scans.',
  },
];

interface TourOverlayProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const TourOverlay: React.FC<TourOverlayProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
    } else if (isOpen === false) {
      setActiveStep(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const done = localStorage.getItem('vs_tour_completed');
    if (!done && isOpen === undefined) {
      // Prompt tour on first load after 1.5s
      const timer = setTimeout(() => setActiveStep(0), 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const dismiss = () => {
    localStorage.setItem('vs_tour_completed', 'true');
    setActiveStep(null);
    if (onClose) onClose();
  };

  const next = () => {
    if (activeStep !== null) {
      if (activeStep < TOUR_STEPS.length - 1) {
        setActiveStep(activeStep + 1);
      } else {
        dismiss();
      }
    }
  };

  if (activeStep === null || !TOUR_STEPS[activeStep]) return null;

  const step = TOUR_STEPS[activeStep];
  const isLast = activeStep === TOUR_STEPS.length - 1;



  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-focus)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <button
          onClick={dismiss}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          aria-label="Dismiss tour"
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
          <Compass size={18} />
          <span>Operator Instrument Tour ({activeStep + 1}/{TOUR_STEPS.length})</span>
        </div>

        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {step.title}
          </h4>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {step.content}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-muted)' }}>
          <button
            onClick={dismiss}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px 10px',
            }}
          >
            Skip Tour
          </button>

          <button
            onClick={next}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: 'var(--raw-tide)',
              color: '#EEF3F4',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>{isLast ? 'Complete' : 'Next'}</span>
            {isLast ? <Check size={14} /> : <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};
