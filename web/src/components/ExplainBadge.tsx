import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { HelpCircle, Terminal } from 'lucide-react';
import { useExplain } from '../context/ExplainContext';

interface ExplainBadgeProps {
  title: string;
  formula?: string;
  lineage?: string;
  rationale?: string;
  notes?: string;
  bounds?: string;
}

export const ExplainBadge: React.FC<ExplainBadgeProps> = ({
  title,
  formula,
  lineage,
  rationale,
  notes,
  bounds
}) => {
  const { explainMode } = useExplain();
  if (!explainMode) return null;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="inline-flex items-center justify-center p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
          title={`Explain: ${title}`}
          aria-label={`Explain telemetry for ${title}`}
          style={{ minHeight: '24px', minWidth: '24px' }}
        >
          <HelpCircle size={14} className="animate-pulse text-[var(--accent-cyan)]" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-72 p-3 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-md shadow-lg text-[var(--text-primary)] text-xs animate-in fade-in-50 zoom-in-95"
          sideOffset={5}
          align="start"
        >
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-[var(--border-muted)] font-semibold text-[var(--accent-cyan)]">
            <Terminal size={14} />
            <span>{title} Telemetry Breakdown</span>
          </div>

          {formula && (
            <div className="mb-2">
              <span className="block text-[var(--text-muted)] font-medium mb-0.5">Formula / Model</span>
              <code className="block p-1 bg-[var(--bg-app)] text-[var(--text-primary)] rounded font-mono text-[11px] border border-[var(--border-muted)]">
                {formula}
              </code>
            </div>
          )}

          {(rationale || lineage) && (
            <div className="mb-2">
              <span className="block text-[var(--text-muted)] font-medium mb-0.5">Methodology & Lineage</span>
              <p className="text-[var(--text-secondary)] text-[11px] leading-tight">{rationale || lineage}</p>
            </div>
          )}

          {bounds && (
            <div className="mb-2">
              <span className="block text-[var(--text-muted)] font-medium mb-0.5">Confidence / Tolerance</span>
              <p className="text-[var(--text-primary)] text-[11px] font-mono">{bounds}</p>
            </div>
          )}

          {notes && (
            <div className="pt-1 text-[var(--text-muted)] text-[11px] italic">
              {notes}
            </div>
          )}

          <Popover.Arrow className="fill-[var(--border-hairline)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
