import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from config import DATABASE_URL

Base = declarative_base()


class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(String(64), primary_key=True, index=True)
    dataset_id = Column(String(64), index=True)
    filename = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    model = Column(String(64), nullable=False, default="fake")
    demo = Column(Boolean, default=False)
    source = Column(String(32), default="upload")  # upload | demo
    status = Column(String(32), default="completed")  # completed, processing, failed, deleted
    image_width = Column(Integer, default=0)
    image_height = Column(Integer, default=0)
    detection_count = Column(Integer, default=0)
    geolocated_count = Column(Integer, default=0)
    priority = Column(String(32), default="low")  # low, medium, high, critical
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    depth_m = Column(Float, default=2500.0)
    operator = Column(String(128), default="Operator Baseline")
    sonar_type = Column(String(128), default="Side-scan 900 kHz")
    timings = Column(Text, default="{}")  # JSON string
    detections = Column(Text, default="[]")  # JSON string
    trace = Column(Text, nullable=True)  # JSON string - pipeline trace
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        try:
            det_list = json.loads(self.detections) if self.detections else []
        except Exception:
            det_list = []

        try:
            timing_dict = json.loads(self.timings) if self.timings else {}
        except Exception:
            timing_dict = {}

        created_str = self.created_at.isoformat() if self.created_at else None
        completed_str = self.completed_at.isoformat() if self.completed_at else None

        return {
            "id": self.id,
            "dataset_id": self.dataset_id,
            "filename": self.filename,
            "name": self.name or f"Analysis ({self.filename})",
            "model": self.model,
            "demo": self.demo,
            "source": self.source or ("demo" if self.demo else "upload"),
            "status": self.status,
            "image_size": {
                "width": self.image_width,
                "height": self.image_height
            },
            "image_url": f"/api/v1/analyses/{self.id}/image",
            "detection_count": self.detection_count,
            "geolocated_count": self.geolocated_count,
            "priority": self.priority,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "depth_m": self.depth_m,
            "operator": self.operator,
            "sonar_type": self.sonar_type,
            "timings": timing_dict,
            "detections": det_list,
            "anomalies": det_list,  # alias for legacy compatibility
            "anomalies_detected": self.detection_count,  # alias for legacy tests
            "created_at": created_str,
            "completed_at": completed_str,
            "error": self.error
        }


# Engine & Session Setup
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    seed_initial_data()


def seed_initial_data():
    db = SessionLocal()
    try:
        rec_139 = db.query(AnalysisRecord).filter(AnalysisRecord.id == "ANL-2026-0139").first()
        if rec_139 and rec_139.status == "deleted":
            rec_139.status = "failed"
            db.commit()

        count = db.query(AnalysisRecord).count()
        if count == 0:
            sample_anomalies_0142 = [
                {
                    "id": "ANM-0142-001",
                    "mission_id": "MSN-2026-0142",
                    "class_id": 8,
                    "class_name": "unidentified_object",
                    "confidence": 0.94,
                    "bbox": {"x": 19.5, "y": 28.0, "w": 12.0, "h": 12.0},
                    "polygon": None,
                    "geo": {"latitude": -6.31, "longitude": 71.21},
                    "latitude": -6.31,
                    "longitude": 71.21,
                    "priority": "critical",
                    "status": "pending_review",
                    "depth_m": 4180,
                    "description": "Metallic cylindrical contact with high backscatter return."
                },
                {
                    "id": "ANM-0142-002",
                    "mission_id": "MSN-2026-0142",
                    "class_id": 3,
                    "class_name": "shipwreck",
                    "confidence": 0.88,
                    "bbox": {"x": 58.0, "y": 42.0, "w": 22.0, "h": 16.0},
                    "polygon": None,
                    "geo": {"latitude": -6.34, "longitude": 71.18},
                    "latitude": -6.34,
                    "longitude": 71.18,
                    "priority": "high",
                    "status": "pending_review",
                    "depth_m": 4150,
                    "description": "Elongated hull structure with acoustic shadow."
                },
                {
                    "id": "ANM-0142-003",
                    "mission_id": "MSN-2026-0142",
                    "class_id": 13,
                    "class_name": "mine_like_contact",
                    "confidence": 0.81,
                    "bbox": {"x": 42.0, "y": 68.0, "w": 8.0, "h": 9.0},
                    "polygon": None,
                    "geo": {"latitude": -6.29, "longitude": 71.24},
                    "latitude": -6.29,
                    "longitude": 71.24,
                    "priority": "critical",
                    "status": "pending_review",
                    "depth_m": 4210,
                    "description": "Spherical object with distinct acoustic shadow."
                }
            ]

            initial_records = [
                AnalysisRecord(
                    id="ANL-2026-0142",
                    dataset_id="MSN-2026-0142",
                    filename="chagos_trench_sweep_900khz.sonar",
                    name="Chagos Trench Survey",
                    model="yolo11n-seg",
                    demo=False,
                    source="upload",
                    status="completed",
                    image_width=1200,
                    image_height=800,
                    detection_count=3,
                    geolocated_count=3,
                    priority="critical",
                    latitude=-6.3,
                    longitude=71.2,
                    depth_m=4200.0,
                    operator="Lt. R. Mehta",
                    sonar_type="Side-scan 900 kHz",
                    timings=json.dumps({"preprocess_ms": 12.4, "inference_ms": 45.2, "postprocess_ms": 8.1, "total_ms": 65.7}),
                    detections=json.dumps(sample_anomalies_0142),
                    created_at=datetime(2026, 8, 22, 14, 30, 0, tzinfo=timezone.utc),
                    completed_at=datetime(2026, 8, 22, 14, 32, 0, tzinfo=timezone.utc)
                ),
                AnalysisRecord(
                    id="ANL-2026-0141",
                    dataset_id="MSN-2026-0141",
                    filename="carlsberg_ridge_multibeam.sonar",
                    name="Carlsberg Ridge Sweep",
                    model="yolo11n-seg",
                    demo=False,
                    source="upload",
                    status="completed",
                    image_width=1920,
                    image_height=1080,
                    detection_count=12,
                    geolocated_count=12,
                    priority="high",
                    latitude=3.8,
                    longitude=64.5,
                    depth_m=3100.0,
                    operator="Cdr. A. Fernando",
                    sonar_type="Multibeam EM 302",
                    timings=json.dumps({"preprocess_ms": 15.0, "inference_ms": 62.0, "postprocess_ms": 10.0, "total_ms": 87.0}),
                    detections=json.dumps([]),
                    created_at=datetime(2026, 8, 20, 10, 15, 0, tzinfo=timezone.utc),
                    completed_at=datetime(2026, 8, 20, 10, 18, 0, tzinfo=timezone.utc)
                ),
                AnalysisRecord(
                    id="ANL-2026-0140",
                    dataset_id="MSN-2026-0140",
                    filename="bay_of_bengal_deep_shelf.sonar",
                    name="Bay of Bengal Survey",
                    model="yolo11n-seg",
                    demo=False,
                    source="upload",
                    status="processing",
                    image_width=1000,
                    image_height=600,
                    detection_count=0,
                    geolocated_count=0,
                    priority="medium",
                    latitude=13.0,
                    longitude=84.2,
                    depth_m=2800.0,
                    operator="Dr. S. Raman",
                    sonar_type="Side-scan 454 kHz",
                    timings=json.dumps({}),
                    detections=json.dumps([]),
                    created_at=datetime(2026, 9, 8, 18, 45, 0, tzinfo=timezone.utc),
                    completed_at=None
                ),
                AnalysisRecord(
                    id="ANL-2026-0139",
                    dataset_id="MSN-2026-0139",
                    filename="corrupted_hdr_signal.sonar",
                    name="Andaman Trench Test",
                    model="yolo11n-seg",
                    demo=False,
                    source="upload",
                    status="failed",
                    image_width=0,
                    image_height=0,
                    detection_count=0,
                    geolocated_count=0,
                    priority="low",
                    latitude=11.5,
                    longitude=92.7,
                    depth_m=3400.0,
                    operator="Operator Baseline",
                    sonar_type="Side-scan 900 kHz",
                    timings=json.dumps({}),
                    detections=json.dumps([]),
                    created_at=datetime(2026, 9, 7, 9, 12, 0, tzinfo=timezone.utc),
                    completed_at=None,
                    error="Acoustic telemetry frame header corrupted - CRC mismatch"
                )
            ]

            db.add_all(initial_records)
            db.commit()
    finally:
        db.close()
