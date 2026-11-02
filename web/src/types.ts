export interface PixelBbox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Detection {
  id?: string;
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: PixelBbox;
  polygon?: number[][] | null;
  geo?: GeoLocation | null;
}

export interface Timings {
  preprocess_ms: number;
  inference_ms: number;
  postprocess_ms: number;
  total_ms: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface AnalysisRecord {
  id: string;
  dataset_id?: string;
  filename: string;
  name?: string;
  model: string;
  demo: boolean;
  source: 'upload' | 'demo' | 'simulated';
  status: 'completed' | 'processing' | 'failed' | 'deleted';
  image_size?: ImageSize;
  image_url?: string;
  detection_count: number;
  geolocated_count?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  latitude?: number | null;
  longitude?: number | null;
  depth_m: number;
  operator?: string;
  sonar_type?: string;
  timings: Timings;
  detections: Detection[];
  anomalies?: Detection[];
  created_at: string;
  completed_at?: string | null;
  error?: string | null;
}

export interface PipelineTraceStage {
  name: string;
  duration_ms: number;
  description: string;
  status: 'ok' | 'degraded' | 'failed';
  details?: Record<string, any>;
}

export interface PipelineTrace {
  analysis_id: string;
  model: string;
  timestamp: string;
  total_latency_ms: number;
  stages: PipelineTraceStage[];
}

export interface ModelRegistryItem {
  name: string;
  framework: string;
  available: boolean;
  weights_path?: string | null;
  description: string;
}

export interface SystemHealth {
  status: string;
  system: string;
  database: string;
  demo_mode: boolean;
  timestamp: string;
}

export interface AnalysesStats {
  total_analyses: number;
  total_detections: number;
  avg_inference_ms: number;
  critical_count: number;
  high_count: number;
  models_used: Record<string, number>;
  classes_distribution: Record<string, number>;
}
