"""ERA5/CDS client with explicit cache and provenance metadata."""

from __future__ import annotations

import json
import os
from pathlib import Path


def fetch_rainfall(
    latitude: float,
    longitude: float,
    start_date: str,
    end_date: str,
    cache_dir: str | Path = "data/raw/era5",
):
    if not os.getenv("CDS_API_KEY"):
        raise RuntimeError(
            "ERA5 is not configured. Store CDS_API_KEY as a protected secret "
            "after creating a Copernicus Climate Data Store account."
        )
    try:
        import cdsapi
    except ImportError as exc:
        raise RuntimeError("cdsapi is required for ERA5 ingestion.") from exc

    cache_path = Path(cache_dir)
    cache_path.mkdir(parents=True, exist_ok=True)
    key = f"{latitude:.4f}_{longitude:.4f}_{start_date}_{end_date}".replace("-", "")
    output = cache_path / f"rainfall_{key}.json"
    if output.exists():
        return json.loads(output.read_text())

    # CDS request details stay explicit so the downloaded result can be audited.
    client = cdsapi.Client()
    request = {
        "product_type": "reanalysis",
        "variable": ["total_precipitation"],
        "year": sorted({start_date[:4], end_date[:4]}),
        "month": [f"{month:02d}" for month in range(1, 13)],
        "day": [f"{day:02d}" for day in range(1, 32)],
        "time": ["00:00"],
        "area": [latitude, longitude, latitude, longitude],
        "format": "json",
    }
    target = output.with_suffix(".nc")
    client.retrieve("reanalysis-era5-single-levels", request, str(target))
    metadata = {
        "dataset": "reanalysis-era5-single-levels",
        "request": request,
        "retrieved_target": str(target),
        "note": "Parse the NetCDF into daily rainfall before model training.",
    }
    output.write_text(json.dumps(metadata, indent=2))
    return metadata