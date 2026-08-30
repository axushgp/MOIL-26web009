"""Generate calibrated illustrative operations around real ERA5 rainfall."""

from __future__ import annotations

ANNUAL_TONNAGE_ANCHOR = 1_800_000  # Illustrative order-of-magnitude anchor; confirm.


def generate_synthetic_daily_production(
    mine_id: str,
    start_date: str,
    end_date: str,
    annual_tonnage_share: float,
    rainfall_by_date: dict,
):
    """Return synthetic operations with a real-ERA5 rainfall input.

    Downtime and blast delays are generic reliability assumptions, not
    MOIL-specific observations. A missing rainfall date is rejected so the
    caller cannot silently replace real weather with a synthetic series.
    """
    try:
        import numpy as np
        import pandas as pd
    except ImportError as exc:
        raise RuntimeError("numpy and pandas are required for operations data.") from exc
    dates = pd.date_range(start=start_date, end=end_date, freq="D")
    rng = np.random.default_rng(42)
    daily_plan = ANNUAL_TONNAGE_ANCHOR * annual_tonnage_share / 365
    rows = []
    for date in dates:
        date_key = date.strftime("%Y-%m-%d")
        if date_key not in rainfall_by_date:
            raise ValueError(f"Missing real ERA5 rainfall for {mine_id} on {date_key}.")
        rainfall = float(rainfall_by_date[date_key])
        downtime = float(rng.weibull(1.5) * 4)  # Generic reliability assumption.
        blast_delay = bool(rng.poisson(1 / 7) > 0)  # Roughly one delay per week.
        rainfall_penalty = 0.12 if rainfall > 40 else min(rainfall / 40 * 0.05, 0.05)
        actual = daily_plan * (
            1
            - min(downtime / 100, 0.5)
            - rainfall_penalty
            - (0.06 if blast_delay else 0)
        )
        rows.append(
            {
                "date": date_key,
                "mine_id": mine_id,
                "planned_tonnage": round(daily_plan, 2),
                "actual_tonnage": round(max(actual, 0), 2),
                "downtime_hours": round(downtime, 2),
                "rainfall_mm": rainfall,
                "blast_delay_flag": blast_delay,
                "data_provenance": "real_era5_weather",
            }
        )
    return pd.DataFrame(rows)