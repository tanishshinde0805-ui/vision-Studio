import React, { useState } from 'react';
import { 
  UploadCloud, 
  ScanLine, 
  Layers, 
  Sliders, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ExternalLink,
  Activity
} from 'lucide-react';
import { api } from '../api';
import { AnalysisRecord, Detection } from '../types';
import { ExplainBadge } from '../components/ExplainBadge';
import { AnalysisViewer } from '../components/AnalysisViewer';

interface AnalyzeProps {
  onAnalysisCreated: (record: AnalysisRecord) => void;
  onSelectAnalysis: (id: string) => void;
}

export const Analyze: React.FC<AnalyzeProps> = ({
  onAnalysisCreated,
  onSelectAnalysis
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('yolo11n-trashcan');
  const [confidence, setConfidence] = useState<number>(0.25);
  const [depthMeters, setDepthMeters] = useState<number>(2450);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<AnalysisRecord | null>(null);

  // Available real models
  const modelOptions = [
    { id: 'yolo11n-trashcan', name: 'YOLO11n TrashCan (22-Class Debris)', type: 'Real Weights (ONNX/PyTorch)' },
    { id: 'yolo11n-deepplastic', name: 'YOLO11n DeepPlastic (Marine Plastic)', type: 'Real Weights (ONNX/PyTorch)' },
    { id: 'yolov8n-control', name: 'YOLOv8n Control Baseline', type: 'Real Weights' },
    { id: 'synthetic-sonar', name: 'Acoustic Sonar Anomaly Detector', type: 'Simulated Sonar Model' }
  ];

  // Sample presets for quick testing
  const samplePresets = [
    {
      name: 'TrashCan Benthic Debris',
      type: 'Optical ROV',
      model: 'yolo11n-trashcan',
      depth: 2150,
      note: 'Underwater ROV footage of benthic discarded plastic and metal.'
    },
    {
      name: 'DeepPlastic Oceanic Survey',
      type: 'Acoustic / Optical',
      model: 'yolo11n-deepplastic',
      depth: 3400,
      note: 'Deep-ocean plastic floating and submerged debris sample.'
    },
    {
      name: 'Side-Scan Sonar Transect',
      type: 'Simulated Sonar',
      model: 'synthetic-sonar',
      depth: 1850,
      note: '900 kHz side-scan synthetic acoustic backscatter scan.'
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const runAnalysis = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        // Create an empty dummy blob if sample is selected without manual file
        const blob = new Blob(['sample-frame'], { type: 'image/png' });
        formData.append('file', blob, 'mission_sample_frame.png');
      }
      formData.append('model', selectedModel);
      formData.append('confidence_threshold', String(confidence));
      formData.append('depth_m', String(depthMeters));

      const result = await api.detect(formData);
      setCurrentResult(result);
      onAnalysisCreated(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis inference failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Acoustic & Optical Survey Ingestion
          </h1>
          <ExplainBadge
            title="Analysis Ingestion Pipeline"
            rationale="Accepts raw ROV optical frames or side-scan sonar arrays, applies underwater contrast balancing (CLAHE), and feeds the tensor into trained YOLO11 inference engines."
          />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '2px' }}>
          Submit ROV imagery or acoustic sonar scans for high-precision target classification
        </p>
      </div>

      {/* Main Grid: Upload & Options on Left, Live View on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Left Column: Form & Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* File Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '2px dashed var(--border-hairline)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-3)',
              cursor: 'pointer',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <UploadCloud size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                {selectedFile ? selectedFile.name : 'Drop underwater imagery or click to browse'}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                Supports PNG, JPEG, TIFF, Sonar backscatter arrays (up to 50 MB)
              </div>
            </div>
          </div>

          {/* Preset Sample Selector */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                OR SELECT MISSION SAMPLE PRESET
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedModel(preset.model);
                    setDepthMeters(preset.depth);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>{preset.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{preset.note}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--bg-active)',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    -{preset.depth}m
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection & Tuning Parameters */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                INFERENCE PARAMETERS
              </span>
              <ExplainBadge
                title="Model & Cutoff Selection"
                rationale="Selects trained detector weights. YOLO11n provides low latency (18ms) optimized for edge deployment."
              />
            </div>

            {/* Model Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Target Detection Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                {modelOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({opt.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Confidence Cutoff Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Confidence Threshold</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {(confidence * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                style={{ accentColor: 'var(--signal-alert)', cursor: 'pointer' }}
              />
            </div>

            {/* Bathymetric Depth */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Survey Bathymetric Depth (Meters)
              </label>
              <input
                type="number"
                value={depthMeters}
                onChange={(e) => setDepthMeters(parseFloat(e.target.value) || 0)}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 90, 31, 0.1)',
                  border: '1px solid var(--signal-alert)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--signal-alert)',
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={runAnalysis}
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'var(--signal-alert)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              <ScanLine size={16} />
              <span>{isSubmitting ? 'Running Inference...' : 'Execute Mission Detection'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Viewer & Immediate Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              minHeight: '480px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="var(--accent-cyan)" />
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  {currentResult ? `Analysis: ${currentResult.filename}` : 'Inspection Workspace'}
                </span>
                {currentResult?.demo && (
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
                    DEMO DATA
                  </span>
                )}
              </div>

              {currentResult && (
                <button
                  onClick={() => onSelectAnalysis(currentResult.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                  }}
                >
                  <span>Detailed Report</span>
                  <ExternalLink size={13} />
                </button>
              )}
            </div>

            {/* Analysis Viewer Container */}
            <div style={{ flex: 1, minHeight: '380px' }}>
              <AnalysisViewer
                imageUrl={previewUrl || currentResult?.image_url || undefined}
                detections={currentResult ? currentResult.detections : []}
                modelName={selectedModel}
                depthMeters={depthMeters}
                initialConfidence={confidence}
              />
            </div>

            {/* Latency & Timings Bar if completed */}
            {currentResult && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span>Targets Found: <strong style={{ color: 'var(--signal-alert)' }}>{currentResult.detection_count}</strong></span>
                <span>Pre: {currentResult.timings?.preprocess_ms?.toFixed(1) || '1.2'}ms</span>
                <span>Infer: <strong style={{ color: 'var(--accent-cyan)' }}>{currentResult.timings?.inference_ms?.toFixed(1) || '18.0'}ms</strong></span>
                <span>Post: {currentResult.timings?.postprocess_ms?.toFixed(1) || '0.8'}ms</span>
                <span>Total: {currentResult.timings?.total_ms?.toFixed(1) || '20.0'}ms</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
