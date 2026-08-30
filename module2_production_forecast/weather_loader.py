"""Mine-specific ERA5 weather loading boundary."""

from __future__ import annotations

from ingestion.era5_client import fetch_rainfall


def load_weather_for_mine(
    mine: dict,
    start_date: str,
    end_date: str,
    cache_dir: str = "data/raw/era5",
):
    if mine.get("lat") is None or mine.get("lon") is None:
        raise ValueError(
            "Cannot request mine-specific weather until the mine coordinates "
            "are confirmed by the team."
        )
    return fetch_rainfall(
        mine["lat"],
        mine["lon"],
        start_date,
        end_date,
        cache_dir=cache_dir,
    )