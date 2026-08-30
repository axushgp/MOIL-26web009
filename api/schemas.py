"""Pydantic response models matching Section 8 of the build specification."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel


class Mine(BaseModel):
    mine_id: str
    name: str
    district: str | None = None
    mine_type: str | None = None
    coordinate_status: str
    latitude: float | None = None
    longitude: float | None = None


class ReservePoint(BaseModel):
    latitude: float
    longitude: float
    reserve_probability: float
    spectral_score: float | None = None
    dist_lineament_m: float | None = None
    dist_sausar_boundary_m: float | None = None


class HeatmapResponse(BaseModel):
    type: str = "FeatureCollection"
    features: list[dict[str, Any]]
    model_version: str
    computed_at: datetime | None = None


class ValidationMine(BaseModel):
    mine_id: str
    percentile: float


class ValidationResponse(BaseModel):
    confirmed_mines_checked: int
    avg_percentile_rank: float
    per_mine: list[ValidationMine]


class ProductionHistory(BaseModel):
    date: date
    planned_tonnage: float
    actual_tonnage: float
    downtime_hours: float
    rainfall_mm: float
    blast_delay_flag: bool
    data_provenance: str


class ForecastResponse(BaseModel):
    predicted_tonnage: float
    planned_tonnage: float
    shortfall_probability: float
    dominant_driver: str
    local_reserve_confidence: float


class RecommendationResponse(BaseModel):
    action: str
    detail: str
    explanation_text: str | None = None
    driver: str