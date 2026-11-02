import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  ChevronRight,
  ExternalLink,
  Sliders
} from 'lucide-react';
import { AnalysisRecord } from '../types';
import { ExplainBadge } from '../components/ExplainBadge';

interface MapViewProps {
  analyses: AnalysisRecord[];
  onSelectAnalysis: (id: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  analyses,
  onSelectAnalysis
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [selectedPin, setSelectedPin] = useState<AnalysisRecord | null>(null);
  const [showSwaths, setShowSwaths] = useState(true);
  const [showContours, setShowContours] = useState(true);

  // SVG Coordinate Box: 24.5N to 25.5N, 78.0W to 79.0W
  const minLat = 24.5;
  const maxLat = 25.5;
  const minLon = -79.0;
  const maxLon = -78.0;

  // Convert lat/lon to 800x600 SVG coordinates
  const projectGeo = (lat?: number | null, lon?: number | null) => {
    const defaultLat = 24.8123;
    const defaultLon = -78.4321;
    const l = lat !== null && lat !== undefined ? lat : defaultLat;
    const g = lon !== null && lon !== undefined ? lon : defaultLon;

    const x = ((g - minLon) / (maxLon - minLon)) * 800;
    const y = ((maxLat - l) / (maxLat - minLat)) * 600;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Bathymetric Survey Chart
            </h1>
            <ExplainBadge
              title="Self-Drawn Bathymetry Chart"
              rationale="Renders deep-ocean depth contours, acoustic swath transects, and georeferenced anomaly coordinates directly via SVG without external tile servers."
            />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '2px' }}>
            Autonomous ROV survey transects, depth contours, and acoustic anomaly geolocations
          </p>
        </div>

        {/* Chart Map Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setShowContours(c => !c)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: showContours ? 'var(--border-focus)' : 'var(--border-hairline)',
              backgroundColor: showContours ? 'var(--bg-active)' : 'transparent',
              color: showContours ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            Contours
          </button>
          <button
            onClick={() => setShowSwaths(s => !s)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: showSwaths ? 'var(--border-focus)' : 'var(--border-hairline)',
              backgroundColor: showSwaths ? 'var(--bg-active)' : 'transparent',
              color: showSwaths ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            Sonar Swath
          </button>
          <button
            onClick={() => setZoom(z => Math.min(z * 1.3, 5))}
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z / 1.3, 0.6))}
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            title="Reset Map View"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div
        style={{
          position: 'relative',
          height: '560px',
          width: '100%',
          backgroundColor: '#04131C', // Deep Trench Foundation
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          style={{
            width: '100%',
            height: '100%',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '400px 300px',
            transition: isPanning ? 'none' : 'transform 100ms ease-out',
          }}
          viewBox="0 0 800 600"
        >
          <defs>
            {/* Bathymetric Graticule */}
            <pattern id="chart-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(14, 111, 124, 0.18)" strokeWidth="1" strokeDasharray="3,3" />
            </pattern>
            {/* Depth ramp gradient */}
            <radialGradient id="depth-trench" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#04131C" />
              <stop offset="60%" stopColor="#0A2433" />
              <stop offset="100%" stopColor="#0E2C3D" />
            </radialGradient>
          </defs>

          {/* Seabed Bathymetric Gradient Background */}
          <rect width="800" height="600" fill="url(#depth-trench)" />
          <rect width="800" height="600" fill="url(#chart-grid)" />

          {/* Bathymetric Depth Contour Curves */}
          {showContours && (
            <g opacity="0.65">
              {/* -1,000m contour */}
              <path
                d="M 50 120 C 220 80, 480 180, 750 90"
                fill="none"
                stroke="#BFE3E6"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />
              <text x="60" y="115" fill="#BFE3E6" fontSize="9" fontFamily="var(--font-mono)">-1,000m</text>

              {/* -2,000m contour */}
              <path
                d="M 30 240 C 260 200, 520 290, 780 210"
                fill="none"
                stroke="#0E6F7C"
                strokeWidth="1.5"
              />
              <text x="40" y="235" fill="#0E6F7C" fontSize="9" fontFamily="var(--font-mono)">-2,000m</text>

              {/* -3,000m contour */}
              <path
                d="M 20 380 C 200 350, 460 420, 760 360"
                fill="none"
                stroke="#0E6F7C"
                strokeWidth="1.2"
                strokeDasharray="6,3"
              />
              <text x="30" y="375" fill="#0E6F7C" fontSize="9" fontFamily="var(--font-mono)">-3,000m</text>

              {/* -4,000m contour */}
              <path
                d="M 40 490 C 280 470, 540 520, 770 480"
                fill="none"
                stroke="#0A2433"
                strokeWidth="2"
              />
              <text x="50" y="485" fill="#7FAAB2" fontSize="9" fontFamily="var(--font-mono)">-4,000m</text>
            </g>
          )}

          {/* Autonomous ROV Survey Swath Track Lines */}
          {showSwaths && (
            <g>
              {/* Transect Line 1 */}
              <path
                d="M 120 180 L 320 280 L 520 220 L 680 340"
                fill="none"
                stroke="rgba(44, 191, 177, 0.4)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 120 180 L 320 280 L 520 220 L 680 340"
                fill="none"
                stroke="#2CBFB1"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />

              {/* Transect Line 2 */}
              <path
                d="M 160 390 L 380 430 L 620 400"
                fill="none"
                stroke="rgba(14, 111, 124, 0.4)"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <path
                d="M 160 390 L 380 430 L 620 400"
                fill="none"
                stroke="#0E6F7C"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
            </g>
          )}

          {/* Georeferenced Survey Analysis Waypoints */}
          {(Array.isArray(analyses) ? analyses : []).map((a, idx) => {
            const { x, y } = projectGeo(a.latitude, a.longitude);
            const isSelected = selectedPin?.id === a.id;
            const detCount = a.detection_count || (Array.isArray(a.detections) ? a.detections.length : 0);

            return (
              <g
                key={a.id || idx}
                transform={`translate(${x}, ${y})`}
                onClick={() => setSelectedPin(a)}
                style={{ cursor: 'pointer' }}
              >
                {/* Sonar beacon pulse for critical anomaly targets */}
                {detCount > 0 && (
                  <circle
                    r="12"
                    fill="none"
                    stroke="var(--signal-alert)"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                )}
                {/* Pin core */}
                <circle
                  r={isSelected ? 7 : 5}
                  fill={detCount > 0 ? 'var(--signal-alert)' : 'var(--accent-cyan)'}
                  stroke="#EEF3F4"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>

        {/* Selected Anomaly Pin Popover Card */}
        {selectedPin && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '280px',
              backgroundColor: 'rgba(10, 36, 51, 0.95)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              zIndex: 30,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: '#EEF3F4' }}>
                  {selectedPin.filename}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ID: {selectedPin.id.slice(0, 14)}...
                </div>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>DEPTH: </span>
                <span>-{selectedPin.depth_m ? Math.round(selectedPin.depth_m) : 2450}m</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>TARGETS: </span>
                <span style={{ color: 'var(--signal-alert)', fontWeight: 600 }}>
                  {selectedPin.detection_count || selectedPin.detections.length}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectAnalysis(selectedPin.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: 'var(--signal-alert)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              <span>Inspect in Detail</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Bathymetry Depth Ramp Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            backgroundColor: 'rgba(10, 36, 51, 0.85)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 'var(--radius-xs)',
            padding: '8px 12px',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '10px' }}>DEPTH COLOR RAMP</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#BFE3E6', fontSize: '10px' }}>-500m</span>
            <div
              style={{
                width: '100px',
                height: '8px',
                borderRadius: '2px',
                background: 'linear-gradient(to right, #BFE3E6, #0E6F7C, #0A2433, #04131C)',
              }}
            />
            <span style={{ color: '#7FAAB2', fontSize: '10px' }}>-6,000m</span>
          </div>
        </div>
      </div>
    </div>
  );
};
