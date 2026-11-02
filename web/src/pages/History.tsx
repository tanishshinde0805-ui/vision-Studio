import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ChevronRight, 
  ExternalLink, 
  SlidersHorizontal,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { AnalysisRecord } from '../types';
import { ExplainBadge } from '../components/ExplainBadge';

interface HistoryProps {
  analyses: AnalysisRecord[];
  onSelectAnalysis: (id: string) => void;
  onDeleteAnalysis: (id: string) => void;
  onClearDemoData: () => void;
}

export const History: React.FC<HistoryProps> = ({
  analyses,
  onSelectAnalysis,
  onDeleteAnalysis,
  onClearDemoData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  const safeAnalyses = Array.isArray(analyses) ? analyses : [];

  // Filtered dataset
  const filtered = useMemo(() => {
    return safeAnalyses.filter(item => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = item.filename?.toLowerCase().includes(term) || item.id.toLowerCase().includes(term);
        if (!matchesName) return false;
      }
      if (modelFilter !== 'ALL' && item.model !== modelFilter) {
        return false;
      }
      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter.toLowerCase()) {
        return false;
      }
      if (sourceFilter !== 'ALL') {
        if (sourceFilter === 'DEMO' && !item.demo && item.source !== 'demo') return false;
        if (sourceFilter === 'REAL' && (item.demo || item.source === 'demo')) return false;
      }
      return true;
    });
  }, [safeAnalyses, searchTerm, modelFilter, priorityFilter, sourceFilter]);

  // Export to CSV
  const exportCSV = () => {
    const headers = ['ID', 'Filename', 'Model', 'Targets', 'Depth_m', 'Priority', 'Source', 'Latency_ms', 'Created_At'];
    const rows = filtered.map(a => [
      a.id,
      a.filename,
      a.model,
      a.detection_count || a.detections.length,
      a.depth_m || 2450,
      a.priority || 'medium',
      a.source || (a.demo ? 'demo' : 'upload'),
      a.timings?.inference_ms || 18.0,
      a.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vision_studio_survey_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vision_studio_survey_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Mission Historical Ingestion Log
            </h1>
            <ExplainBadge
              title="Survey Ingestion Log"
              rationale="Maintains audit trails of all deep-ocean acoustic scans and optical passes, tracking telemetry, models, and detection priority classification."
            />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '2px' }}>
            Auditable mission log of acoustic backscatter and optical ROV survey records
          </p>
        </div>

        {/* Action Buttons: Export & Clear Demo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={exportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportJSON}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            <FileSpreadsheet size={13} />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onClearDemoData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 90, 31, 0.1)',
              border: '1px solid var(--signal-alert)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--signal-alert)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            title="Purge synthetic demo-tagged entries"
          >
            <Trash2 size={13} />
            <span>Purge Demo Data</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: '12px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          flexWrap: 'wrap',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            flex: '1 1 220px',
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by mission ID or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              width: '100%',
              outline: 'none',
            }}
          />
        </div>

        {/* Model Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Model:</span>
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <option value="ALL">All Models</option>
            <option value="yolo11n-trashcan">YOLO11n TrashCan</option>
            <option value="yolo11n-deepplastic">YOLO11n DeepPlastic</option>
            <option value="yolov8n-control">YOLOv8n Control</option>
            <option value="synthetic-sonar">Synthetic Sonar</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Source Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Source:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              padding: '6px 8px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <option value="ALL">All Data Sources</option>
            <option value="REAL">Real Ingestions Only</option>
            <option value="DEMO">Demo Synthetic Only</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Showing <strong>{filtered.length}</strong> records
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border-hairline)',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              <th style={{ padding: '10px 14px' }}>MISSION FILE / ID</th>
              <th style={{ padding: '10px 14px' }}>MODEL</th>
              <th style={{ padding: '10px 14px' }}>TARGETS</th>
              <th style={{ padding: '10px 14px' }}>DEPTH</th>
              <th style={{ padding: '10px 14px' }}>PRIORITY</th>
              <th style={{ padding: '10px 14px' }}>DATA SOURCE</th>
              <th style={{ padding: '10px 14px' }}>LATENCY</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No mission analyses match your filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const priorityColors: Record<string, { bg: string; text: string }> = {
                  critical: { bg: 'rgba(255, 90, 31, 0.2)', text: '#FF5A1F' },
                  high: { bg: 'rgba(230, 159, 0, 0.2)', text: '#E69F00' },
                  medium: { bg: 'rgba(14, 111, 124, 0.2)', text: 'var(--text-secondary)' },
                  low: { bg: 'rgba(191, 227, 230, 0.1)', text: 'var(--text-muted)' },
                };
                const pColor = priorityColors[item.priority?.toLowerCase()] || priorityColors.medium;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectAnalysis(item.id)}
                    style={{
                      borderBottom: '1px solid var(--border-hairline)',
                      cursor: 'pointer',
                      transition: 'background-color 120ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Filename & ID */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.filename}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {item.id.slice(0, 12)}...
                      </div>
                    </td>

                    {/* Model */}
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      {item.model}
                    </td>

                    {/* Targets */}
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: (item.detection_count || item.detections.length) > 0 ? 'var(--signal-alert)' : 'var(--text-muted)',
                        }}
                      >
                        {item.detection_count || item.detections.length}
                      </span>
                    </td>

                    {/* Depth */}
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      -{item.depth_m ? Math.round(item.depth_m) : 2450} m
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: pColor.bg,
                          color: pColor.text,
                          fontWeight: 600,
                          fontSize: '10px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.priority || 'medium'}
                      </span>
                    </td>

                    {/* Source Tag */}
                    <td style={{ padding: '10px 14px' }}>
                      {item.demo || item.source === 'demo' ? (
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'rgba(255, 90, 31, 0.15)',
                            border: '1px solid var(--signal-alert)',
                            color: 'var(--signal-alert)',
                            fontSize: '10px',
                            fontWeight: 700,
                          }}
                        >
                          DEMO
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'rgba(44, 191, 177, 0.15)',
                            border: '1px solid var(--accent-cyan)',
                            color: 'var(--accent-cyan)',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          REAL INGEST
                        </span>
                      )}
                    </td>

                    {/* Latency */}
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {item.timings?.inference_ms ? `${item.timings.inference_ms.toFixed(1)}ms` : '18.0ms'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAnalysis(item.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Delete Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
