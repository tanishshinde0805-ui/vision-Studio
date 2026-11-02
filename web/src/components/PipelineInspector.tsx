import React from 'react';
import { PipelineTrace } from '../types';
import { Activity, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../context/ThemeContext';

interface PipelineInspectorProps {
  trace: PipelineTrace;
  onClose?: () => void;
}

export const PipelineInspector: React.FC<PipelineInspectorProps> = ({ trace, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Prepare Waterfall ECharts data
  const stages = trace.stages || [];
  const stageNames = stages.map(s => s.name);
  const durations = stages.map(s => s.duration_ms);

  // Compute offset for waterfall
  let running = 0;
  const offsets: number[] = [];
  durations.forEach(d => {
    offsets.push(running);
    running += d;
  });

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[1] || params[0];
        return `${item.name}: <strong>${item.value} ms</strong>`;
      },
    },
    grid: {
      left: '3%',
      right: '6%',
      bottom: '5%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'Time (ms)',
      axisLabel: { color: isDark ? '#7FAAB2' : '#4B6E75', fontSize: 11 },
      splitLine: { lineStyle: { color: isDark ? 'rgba(14, 111, 124, 0.2)' : '#D0DFE2' } },
    },
    yAxis: {
      type: 'category',
      data: stageNames,
      axisLabel: { color: isDark ? '#EEF3F4' : '#0A2433', fontSize: 11 },
      axisLine: { lineStyle: { color: isDark ? '#0E6F7C' : '#8FB5BA' } },
    },
    series: [
      {
        name: 'Offset',
        type: 'bar',
        stack: 'total',
        itemStyle: { borderColor: 'transparent', color: 'transparent' },
        emphasis: { itemStyle: { borderColor: 'transparent', color: 'transparent' } },
        data: offsets,
      },
      {
        name: 'Duration',
        type: 'bar',
        stack: 'total',
        label: {
          show: true,
          position: 'right',
          formatter: '{c} ms',
          color: isDark ? '#BFE3E6' : '#0E6F7C',
          fontSize: 10,
        },
        itemStyle: {
          color: (param: any) => {
            const colors = ['#2CBFB1', '#0E6F7C', '#FF5A1F', '#BFE3E6', '#0E8F82'];
            return colors[param.dataIndex % colors.length];
          },
          borderRadius: 2,
        },
        data: durations,
      },
    ],
  };

  return (
    <div className="instrument-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[var(--accent-cyan)]" />
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">
            Pipeline Execution Inspector
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {trace.analysis_id}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-[var(--accent-cyan)]">
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>Total Latency: {trace.total_latency_ms.toFixed(2)} ms</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--bg-elevated)]"
              aria-label="Close Inspector"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Animated Signal Path */}
      <div>
        <span className="meta-label block mb-2">Signal Telemetry Path</span>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {stages.map((stage, idx) => (
            <div
              key={stage.name}
              className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)] relative flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  0{idx + 1}
                </span>
                {stage.status === 'ok' ? (
                  <CheckCircle2 size={13} className="text-[var(--accent-cyan)]" />
                ) : (
                  <AlertTriangle size={13} className="text-[var(--signal-alert)]" />
                )}
              </div>
              <div className="text-xs font-medium text-[var(--text-primary)] line-clamp-1 mb-1">
                {stage.name}
              </div>
              <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                {stage.duration_ms.toFixed(1)} ms
              </div>
              {idx < stages.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-[var(--text-muted)]">
                  <ArrowRight size={12} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Waterfall Visualization */}
      <div>
        <span className="meta-label block mb-1">Execution Waterfall Profile</span>
        <div className="h-44 w-full">
          <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </div>
  );
};
