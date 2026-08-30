from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from api.routers.mines import _connection
from api.schemas import HeatmapResponse, ValidationResponse

router = APIRouter()


@router.get("/reserves/heatmap", response_model=HeatmapResponse)
def reserve_heatmap(bbox: str | None = Query(default=None)):
    params: list[float] = []
    where = ""
    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = [float(value) for value in bbox.split(",")]
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="bbox must be four comma-separated numbers.") from exc
        if min_lon >= max_lon or min_lat >= max_lat:
            raise HTTPException(status_code=400, detail="bbox bounds are invalid.")
        where = """
          WHERE ST_X(geom::geometry) BETWEEN %s AND %s
            AND ST_Y(geom::geometry) BETWEEN %s AND %s
        """
        params = [min_lon, max_lon, min_lat, max_lat]
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT ST_Y(geom::geometry), ST_X(geom::geometry),
                       spectral_score, dist_lineament_m,
                       dist_sausar_boundary_m, reserve_probability,
                       model_version, computed_at
                FROM reserve_grid
                {where}
                ORDER BY id
                """,
                params,
            )
            rows = cursor.fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail="reserve_grid has no output.")
    return HeatmapResponse(
        features=[
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [row[1], row[0]]},
                "properties": {
                    "reserve_probability": row[5],
                    "spectral_score": row[2],
                    "dist_lineament_m": row[3],
                    "dist_sausar_boundary_m": row[4],
                },
            }
            for row in rows
        ],
        model_version=rows[0][6],
        computed_at=rows[0][7],
    )


@router.get("/reserves/validation", response_model=ValidationResponse)
def reserve_validation():
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT n_positive_examples, loocv_avg_percentile
                FROM model_runs
                WHERE module = 'reserve_mapping'
                ORDER BY trained_at DESC LIMIT 1
                """
            )
            row = cursor.fetchone()
    if not row or row[1] is None:
        raise HTTPException(status_code=404, detail="No LOOCV validation result is stored.")
    return ValidationResponse(
        confirmed_mines_checked=row[0] or 0,
        avg_percentile_rank=row[1],
        per_mine=[],
    )