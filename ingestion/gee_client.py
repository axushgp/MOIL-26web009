"""Lazy Google Earth Engine adapter.

Importing this module never authenticates or performs a live request. The
human team must provide an approved project and a protected service-account
file before calling the ingestion functions.
"""

from __future__ import annotations

import os
import json
from pathlib import Path
from typing import Any


def _require_ee():
    try:
        import ee
    except ImportError as exc:
        raise RuntimeError(
            "Google Earth Engine is not installed. Install requirements.txt "
            "before running live ingestion."
        ) from exc
    return ee


def authenticate():
    """Authenticate with a service account configured through the environment."""
    ee = _require_ee()
    project_id = os.getenv("GEE_PROJECT_ID")
    key_path = os.getenv("GEE_SERVICE_ACCOUNT_JSON")
    if not project_id or not key_path:
        raise RuntimeError(
            "GEE is not configured. Set GEE_PROJECT_ID and "
            "GEE_SERVICE_ACCOUNT_JSON to a protected service-account JSON file."
        )
    path = Path(key_path)
    if not path.exists():
        raise RuntimeError(f"GEE service-account file was not found: {path}")
    try:
        service_account = json.loads(path.read_text())["client_email"]
    except (OSError, KeyError, json.JSONDecodeError) as exc:
        raise RuntimeError(
            f"GEE service-account file is not a valid JSON key: {path}"
        ) from exc
    credentials = ee.ServiceAccountCredentials(service_account, str(path))
    ee.Initialize(credentials, project=project_id)
    return ee


def _geometry(aoi: Any):
    ee = _require_ee()
    if hasattr(aoi, "getInfo"):
        return aoi
    if isinstance(aoi, dict):
        return ee.Geometry.Rectangle(
            [
                aoi["min_lon"],
                aoi["min_lat"],
                aoi["max_lon"],
                aoi["max_lat"],
            ]
        )
    raise TypeError("AOI must be an Earth Engine geometry or bounds dictionary.")


def get_sentinel2_composite(aoi, start_date: str, end_date: str, max_cloud_pct: int):
    ee = authenticate()
    return (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(_geometry(aoi))
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lte("CLOUDY_PIXEL_PERCENTAGE", max_cloud_pct))
        .median()
    )


def get_sentinel1_composite(aoi, start_date: str, end_date: str):
    ee = authenticate()
    return (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(_geometry(aoi))
        .filterDate(start_date, end_date)
        .select(["VV", "VH"])
        .median()
    )


def get_aster_scenes(aoi, start_date: str, end_date: str):
    ee = authenticate()
    return (
        ee.ImageCollection("ASTER/AST_L1T_003")
        .filterBounds(_geometry(aoi))
        .filterDate(start_date, end_date)
    )


def export_to_geotiff(image, aoi, filename: str):
    """Export one image locally with geemap; source metadata remains caller-owned."""
    try:
        import geemap
    except ImportError as exc:
        raise RuntimeError("geemap is required for GeoTIFF export.") from exc
    output_dir = Path("data/raw")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename
    geemap.ee_export_image(
        image,
        filename=str(output_path),
        scale=30,
        region=_geometry(aoi),
        file_per_band=False,
    )
    return output_path