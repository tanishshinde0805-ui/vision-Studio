import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Vision-Studio:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'var(--bg-app, #041017)',
            color: 'var(--text-primary, #EEF3F4)',
            padding: '24px',
            fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: 'var(--bg-surface, #0A2433)',
              border: '1px solid var(--signal-alert, #D9534F)',
              borderRadius: '8px',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(217, 83, 79, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--signal-alert, #D9534F)',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  Instrument Subsystem Fault
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted, #7FAAB2)' }}>
                  A UI component encountered an unexpected runtime fault.
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-app, #041017)',
                border: '1px solid var(--border-hairline, rgba(14, 111, 124, 0.3))',
                borderRadius: '6px',
                padding: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '12px',
                color: 'var(--signal-alert, #D9534F)',
                marginBottom: '20px',
                maxHeight: '150px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {this.state.error?.message || 'Unknown runtime error occurred.'}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: 'var(--bg-elevated, #0E3547)',
                  color: 'var(--text-primary, #EEF3F4)',
                  border: '1px solid var(--border-focus, #0E6F7C)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>Reset View</span>
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: 'var(--signal-alert, #D9534F)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={14} />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
