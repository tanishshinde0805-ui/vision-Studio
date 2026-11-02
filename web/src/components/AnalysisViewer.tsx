import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Grid, 
  Layers, 
  Sliders, 
  SplitSquareVertical, 
  Eye, 
  EyeOff,
  Navigation as CompassIcon
} from 'lucide-react';
import { Detection } from '../types';

interface AnalysisViewerProps {
  imageUrl?: string;
  compareImageUrl?: string;
  detections: Detection[];
  compareDetections?: Detection[];
  modelName?: string;
  compareModelName?: string;
  imageWidth?: number;
  imageHeight?: number;
  initialConfidence?: number;
  depthMeters?: number;
  latitude?: number | null;
  longitude?: number | null;
  onDetectionClick?: (det: Detection) => void;
  selectedDetectionId?: string | null;
}

// 12-class colorblind-safe categorical palette (Okabe-Ito & ColorBrewer adapted)
const CLASS_COLORS: Record<string, string> = {
  trash_can: '#FF5A1F',     // Signal
  plastic_bag: '#E69F00',   // Amber
  plastic_bottle: '#56B4E9',// Sky blue
  net: '#009E73',           // Teal green
  can: '#F0E442',           // Yellow
  cup: '#0072B2',           // Deep blue
  pipe: '#D55E00',          // Rust
  rov: '#CC79A7',           // Purple
  debris: '#FF5A1F',        // Signal
  bio: '#44AA99',           // Seafoam
  wood: '#999933',          // Olive
  metal: '#AA4499',         // Magenta
  default: '#2CBFB1'        // Shallows cyan
};

function getClassColor(className: string): string {
  const norm = className.toLowerCase().replace(/\s+/g, '_');
  for (const [key, color] of Object.entries(CLASS_COLORS)) {
    if (norm.includes(key)) return color;
  }
  return CLASS_COLORS.default;
}

export const AnalysisViewer: React.FC<AnalysisViewerProps> = ({
  imageUrl,
  compareImageUrl,
  detections,
  compareDetections = [],
  modelName = 'YOLO11n Underwater Debris',
  compareModelName = 'YOLOv8n Control Baseline',
  imageWidth = 640,
  imageHeight = 480,
  initialConfidence = 0.25,
  depthMeters = 2450,
  latitude = 24.8123,
  longitude = -78.4321,
  onDetectionClick,
  selectedDetectionId
}) => {
  // Transform state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Viewer toggles
  const [showGraticule, setShowGraticule] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showMasks, setShowMasks] = useState(true);
  const [confidenceCutoff, setConfidenceCutoff] = useState(initialConfidence);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareSplitPercent, setCompareSplitPercent] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Readout state
  const [mousePixel, setMousePixel] = useState<{ x: number; y: number } | null>(null);

  // Overlay resolved trigger (only decorative motion)
  const [hasResolved, setHasResolved] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter detections by confidence
  const visibleDetections = useMemo(() => {
    return detections.filter(d => d.confidence >= confidenceCutoff);
  }, [detections, confidenceCutoff]);

  const visibleCompareDetections = useMemo(() => {
    return compareDetections.filter(d => d.confidence >= confidenceCutoff);
  }, [compareDetections, confidenceCutoff]);

  // Trigger one-time resolve animation when detections change
  useEffect(() => {
    setHasResolved(false);
    const timer = setTimeout(() => setHasResolved(true), 30);
    return () => clearTimeout(timer);
  }, [detections]);

  // Fit image to container on initial load
  useEffect(() => {
    if (containerRef.current && imageWidth && imageHeight) {
      const { clientWidth, clientHeight } = containerRef.current;
      const scaleW = clientWidth / imageWidth;
      const scaleH = clientHeight / imageHeight;
      const initialScale = Math.min(scaleW, scaleH, 1.0) * 0.95;
      setScale(Math.max(initialScale, 0.2));
      setPan({
        x: (clientWidth - imageWidth * initialScale) / 2,
        y: (clientHeight - imageHeight * initialScale) / 2
      });
    }
  }, [imageWidth, imageHeight, imageUrl]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '+' || e.key === '=') {
        setScale(s => Math.min(s * 1.25, 10));
      } else if (e.key === '-' || e.key === '_') {
        setScale(s => Math.max(s / 1.25, 0.2));
      } else if (e.key === '0') {
        setScale(1);
        setPan({ x: 0, y: 0 });
      } else if (e.key.toLowerCase() === 'g') {
        setShowGraticule(g => !g);
      } else if (e.key.toLowerCase() === 'l') {
        setShowLabels(l => !l);
      } else if (e.key === 'ArrowLeft') {
        setPan(p => ({ ...p, x: p.x + 30 }));
      } else if (e.key === 'ArrowRight') {
        setPan(p => ({ ...p, x: p.x - 30 }));
      } else if (e.key === 'ArrowUp') {
        setPan(p => ({ ...p, y: p.y + 30 }));
      } else if (e.key === 'ArrowDown') {
        setPan(p => ({ ...p, y: p.y - 30 }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mouse pan & zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.max(0.2, Math.min(12, scale * zoomFactor));

    setPan({
      x: mouseX - (mouseX - pan.x) * (newScale / scale),
      y: mouseY - (mouseY - pan.y) * (newScale / scale)
    });
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      setCompareSplitPercent(pct);
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - pan.x) / scale;
      const clickY = (e.clientY - rect.top - pan.y) / scale;
      if (clickX >= 0 && clickX <= imageWidth && clickY >= 0 && clickY <= imageHeight) {
        setMousePixel({ x: Math.round(clickX), y: Math.round(clickY) });
      } else {
        setMousePixel(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  // Minimap click to jump pan
  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const miniX = (e.clientX - rect.left) / rect.width;
    const miniY = (e.clientY - rect.top) / rect.height;
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setPan({
        x: clientWidth / 2 - miniX * imageWidth * scale,
        y: clientHeight / 2 - miniY * imageHeight * scale
      });
    }
  };

  // Compute non-overlapping leader-line label positions
  const labelSlots = useMemo(() => {
    // Sort boxes vertically to prevent label line crosses
    const sorted = [...visibleDetections].sort((a, b) => a.bbox.y - b.bbox.y);
    const slots: { det: Detection; labelX: number; labelY: number; anchorX: number; anchorY: number }[] = [];
    
    sorted.forEach((det, idx) => {
      const anchorX = det.bbox.x + det.bbox.w;
      const anchorY = det.bbox.y;
      
      // Default label offset +20px right
      let labelX = anchorX + 24;
      let labelY = Math.max(16, anchorY - 6);

      // Simple collision pushdown
      if (slots.length > 0) {
        const last = slots[slots.length - 1];
        if (Math.abs(last.labelX - labelX) < 120 && labelY - last.labelY < 24) {
          labelY = last.labelY + 26;
        }
      }
      slots.push({ det, labelX, labelY, anchorX, anchorY });
    });
    return slots;
  }, [visibleDetections]);

  // Geo coordinate interpolation
  const currentGeo = useMemo(() => {
    if (latitude === null || longitude === null || !mousePixel) return null;
    // 0.00001 deg ~ 1.1 meters
    const latOffset = ((mousePixel.y - imageHeight / 2) / imageHeight) * -0.0005;
    const lonOffset = ((mousePixel.x - imageWidth / 2) / imageWidth) * 0.0005;
    return {
      lat: (latitude + latOffset).toFixed(6),
      lon: (longitude + lonOffset).toFixed(6)
    };
  }, [mousePixel, latitude, longitude, imageWidth, imageHeight]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: '480px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Viewer Precision Instrument Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-hairline)',
          flexWrap: 'wrap',
          gap: '8px',
          zIndex: 20,
        }}
      >
        {/* Left: Model & Count Readout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '2px 8px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-xs)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {isCompareMode ? `${modelName} vs ${compareModelName}` : modelName}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{visibleDetections.length}</strong> of {detections.length} targets
          </span>
        </div>

        {/* Center: Confidence Slider with Live Cutoff */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={13} color="var(--text-muted)" />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Confidence:
          </span>
          <input
            type="range"
            min="0.05"
            max="0.95"
            step="0.05"
            value={confidenceCutoff}
            onChange={(e) => setConfidenceCutoff(parseFloat(e.target.value))}
            style={{
              width: '100px',
              accentColor: 'var(--signal-alert)',
              cursor: 'pointer',
            }}
          />
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              width: '38px',
            }}
          >
            {(confidenceCutoff * 100).toFixed(0)}%
          </span>
        </div>

        {/* Right: Inspection Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Graticule Toggle */}
          <button
            onClick={() => setShowGraticule(g => !g)}
            style={{
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: showGraticule ? 'var(--border-focus)' : 'var(--border-hairline)',
              backgroundColor: showGraticule ? 'var(--bg-active)' : 'transparent',
              color: showGraticule ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'var(--text-xs)',
            }}
            title="Toggle Graticule Grid (G)"
          >
            <Grid size={13} />
            <span style={{ fontSize: '11px' }}>Grid</span>
          </button>

          {/* Labels Toggle */}
          <button
            onClick={() => setShowLabels(l => !l)}
            style={{
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: showLabels ? 'var(--border-focus)' : 'var(--border-hairline)',
              backgroundColor: showLabels ? 'var(--bg-active)' : 'transparent',
              color: showLabels ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'var(--text-xs)',
            }}
            title="Toggle Leader-line Labels (L)"
          >
            {showLabels ? <Eye size={13} /> : <EyeOff size={13} />}
            <span style={{ fontSize: '11px' }}>Labels</span>
          </button>

          {/* Swipe Compare Toggle */}
          <button
            onClick={() => setIsCompareMode(c => !c)}
            style={{
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: isCompareMode ? 'var(--signal-border)' : 'var(--border-hairline)',
              backgroundColor: isCompareMode ? 'var(--signal-bg)' : 'transparent',
              color: isCompareMode ? 'var(--signal-alert)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'var(--text-xs)',
            }}
            title="Toggle Split-Screen Model Comparison"
          >
            <SplitSquareVertical size={13} />
            <span style={{ fontSize: '11px' }}>Compare</span>
          </button>

          {/* Zoom controls */}
          <button
            onClick={() => setScale(s => Math.min(s * 1.25, 12))}
            style={{
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title="Zoom In (+)"
          >
            <ZoomIn size={13} />
          </button>

          <button
            onClick={() => setScale(s => Math.max(s / 1.25, 0.2))}
            style={{
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title="Zoom Out (-)"
          >
            <ZoomOut size={13} />
          </button>

          <button
            onClick={() => {
              if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                const scaleW = clientWidth / imageWidth;
                const scaleH = clientHeight / imageHeight;
                const initialScale = Math.min(scaleW, scaleH, 1.0) * 0.95;
                setScale(initialScale);
                setPan({
                  x: (clientWidth - imageWidth * initialScale) / 2,
                  y: (clientHeight - imageHeight * initialScale) / 2
                });
              }
            }}
            style={{
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title="Reset Fit (0)"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Main Viewport Workspace */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : 'crosshair',
          backgroundColor: '#04131C', // Deep abyss floor
        }}
      >
        {/* Transformable Canvas Group */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 80ms ease-out',
          }}
        >
          {/* Base Image or Synthetic Sonar Canvas */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Survey frame"
              draggable={false}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('/image')) {
                  target.src = '/api/v1/analyses/fallback/image';
                }
              }}
              style={{
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                display: 'block',
                objectFit: 'contain',
                backgroundColor: '#04131C',
              }}
            />
          ) : (
            <img
              src="/api/v1/analyses/fallback/image"
              alt="Survey frame"
              draggable={false}
              style={{
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                display: 'block',
                objectFit: 'contain',
                backgroundColor: '#04131C',
              }}
            />
          )}

          {/* Graticule Grid Lines & Depth Legend */}
          {showGraticule && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              <defs>
                <pattern id="graticule-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path
                    d="M 80 0 L 0 0 0 80"
                    fill="none"
                    stroke="rgba(191, 227, 230, 0.15)"
                    strokeWidth="1"
                    strokeDasharray="2,4"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#graticule-pattern)" />
              {/* Bathymetric crosshair centers */}
              <circle cx={imageWidth / 2} cy={imageHeight / 2} r="18" fill="none" stroke="rgba(191, 227, 230, 0.3)" strokeWidth="1" />
              <line x1={imageWidth / 2 - 24} y1={imageHeight / 2} x2={imageWidth / 2 + 24} y2={imageHeight / 2} stroke="rgba(191, 227, 230, 0.3)" strokeWidth="1" />
              <line x1={imageWidth / 2} y1={imageHeight / 2 - 24} x2={imageWidth / 2} y2={imageHeight / 2 + 24} stroke="rgba(191, 227, 230, 0.3)" strokeWidth="1" />
            </svg>
          )}

          {/* Primary Model Detections SVG Layer */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${imageWidth}px`,
              height: `${imageHeight}px`,
              pointerEvents: 'none',
            }}
          >
            {/* Draw Polygon Masks if available */}
            {showMasks && visibleDetections.map((det, idx) => {
              if (!det.polygon || det.polygon.length < 3) return null;
              const pointsStr = det.polygon.map(pt => `${pt[0]},${pt[1]}`).join(' ');
              const color = getClassColor(det.class_name);
              return (
                <polygon
                  key={`poly-${idx}`}
                  points={pointsStr}
                  fill={color}
                  fillOpacity="0.22"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  className={hasResolved ? 'overlay-resolved' : 'overlay-resolving'}
                />
              );
            })}

            {/* Draw Bounding Boxes with Precision Hairlines */}
            {visibleDetections.map((det, idx) => {
              const { x, y, w, h } = det.bbox;
              const color = getClassColor(det.class_name);
              const isSelected = selectedDetectionId === (det.id || String(idx));
              return (
                <g key={`bbox-${idx}`}>
                  {/* Subtle corner ticks for instrument aesthetic */}
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill={isSelected ? 'rgba(255, 90, 31, 0.15)' : 'rgba(14, 111, 124, 0.08)'}
                    stroke={isSelected ? 'var(--signal-alert)' : color}
                    strokeWidth={isSelected ? '2' : '1.5'}
                    strokeDasharray={isSelected ? 'none' : '4,2'}
                    className={hasResolved ? 'overlay-resolved' : 'overlay-resolving'}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={() => onDetectionClick?.(det)}
                  />
                  {/* Corner brackets */}
                  <path
                    d={`M ${x} ${y + 8} L ${x} ${y} L ${x + 8} ${y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${x + w - 8} ${y} L ${x + w} ${y} L ${x + w} ${y + 8}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${x} ${y + h - 8} L ${x} ${y + h} L ${x + 8} ${y + h}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${x + w - 8} ${y + h} L ${x + w} ${y + h} L ${x + w} ${y + h - 8}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                  />
                </g>
              );
            })}

            {/* Non-overlapping Leader Lines */}
            {showLabels && labelSlots.map((slot, idx) => {
              const color = getClassColor(slot.det.class_name);
              return (
                <g key={`leader-${idx}`}>
                  {/* Diagonal connector to horizontal shelf */}
                  <polyline
                    points={`${slot.anchorX},${slot.anchorY} ${slot.labelX - 8},${slot.labelY} ${slot.labelX},${slot.labelY}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.2"
                    strokeOpacity="0.8"
                  />
                  <circle cx={slot.anchorX} cy={slot.anchorY} r="2.5" fill={color} />
                </g>
              );
            })}
          </svg>

          {/* HTML Overlay for Text Labels with Anti-Collision */}
          {showLabels && labelSlots.map((slot, idx) => {
            const color = getClassColor(slot.det.class_name);
            const isSelected = selectedDetectionId === (slot.det.id || String(idx));
            return (
              <div
                key={`chip-${idx}`}
                onClick={() => onDetectionClick?.(slot.det)}
                style={{
                  position: 'absolute',
                  left: `${slot.labelX}px`,
                  top: `${slot.labelY - 12}px`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  backgroundColor: 'rgba(10, 36, 51, 0.92)',
                  border: `1px solid ${isSelected ? 'var(--signal-alert)' : color}`,
                  borderRadius: 'var(--radius-xs)',
                  color: '#EEF3F4',
                  fontSize: '10.5px',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
                  pointerEvents: 'auto',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: color,
                  }}
                />
                <span>{slot.det.class_name}</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {(slot.det.confidence * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Swipe Compare Overlay (Divider slider) */}
        {isCompareMode && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${compareSplitPercent}%`,
              width: '2px',
              backgroundColor: 'var(--signal-alert)',
              zIndex: 30,
              cursor: 'col-resize',
              boxShadow: '0 0 8px rgba(255, 90, 31, 0.6)',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '-12px',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--raw-abyss)',
                border: '2px solid var(--signal-alert)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--signal-alert)',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              ↔
            </div>
            {/* Split Labels */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '8px',
                padding: '2px 6px',
                backgroundColor: 'rgba(10, 36, 51, 0.85)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              Model A: {modelName}
            </div>
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '8px',
                padding: '2px 6px',
                backgroundColor: 'rgba(10, 36, 51, 0.85)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              Model B: {compareModelName}
            </div>
          </div>
        )}

        {/* Minimap in Bottom Right */}
        <div
          onClick={handleMinimapClick}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            width: '120px',
            height: '90px',
            backgroundColor: 'rgba(10, 36, 51, 0.85)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xs)',
            overflow: 'hidden',
            cursor: 'pointer',
            zIndex: 25,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
          }}
          title="Minimap: click to center viewport"
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Minimap"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
            />
          )}
          {/* Viewport Box */}
          {containerRef.current && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.max(0, -pan.x / (imageWidth * scale)) * 100}%`,
                top: `${Math.max(0, -pan.y / (imageHeight * scale)) * 100}%`,
                width: `${Math.min(100, (containerRef.current.clientWidth / (imageWidth * scale)) * 100)}%`,
                height: `${Math.min(100, (containerRef.current.clientHeight / (imageHeight * scale)) * 100)}%`,
                border: '1.5px solid var(--signal-alert)',
                backgroundColor: 'rgba(255, 90, 31, 0.2)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Scale Factor Indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            padding: '2px 8px',
            backgroundColor: 'rgba(10, 36, 51, 0.85)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            zIndex: 25,
          }}
        >
          {(scale * 100).toFixed(0)}% ZOOM | {imageWidth}×{imageHeight}px
        </div>
      </div>

      {/* Bottom Precision Telemetry Readout Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border-hairline)',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '8px',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>
            PIXEL: {mousePixel ? `${mousePixel.x}, ${mousePixel.y} px` : '--, --'}
          </span>
          <span>DEPTH: -{depthMeters.toFixed(1)} m</span>
          {currentGeo && (
            <span>
              GEO: {currentGeo.lat}° N, {currentGeo.lon}° W
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>KEYS: [+/-] Zoom [G] Grid [L] Labels [0] Fit</span>
        </div>
      </div>

      {/* Decorative Overlays Entrance Animation (The only decorative motion) */}
      <style>{`
        .overlay-resolving {
          opacity: 0;
          stroke-dashoffset: 100;
        }
        .overlay-resolved {
          opacity: 1;
          stroke-dashoffset: 0;
          transition: opacity 280ms cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 280ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};
