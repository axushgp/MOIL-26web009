from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from api.routers.mines import _connection
from api.schemas import ForecastResponse, ProductionHistory

router = APIRouter()


def _require_mine(connection, mine_id: str):
    with connection.cursor() as cursor:
        cursor.execute("SELECT mine_id FROM mines WHERE mine_id = %s", (mine_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Mine not found.")


@router.get("/production/{mine_id}/history", response_model=list[ProductionHistory])
def production_history(mine_id: str, days: int = Query(default=90, ge=30, le=365)):
    with _connection() as connection:
        _require_mine(connection, mine_id)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT date, planned_tonnage, actual_tonnage, downtime_hours,
                       rainfall_mm, blast_delay_flag, data_provenance
                FROM production_history
                WHERE mine_id = %s ORDER BY date DESC LIMIT %s
                """,
                (mine_id, days),
            )
            rows = cursor.fetchall()
    return [
        ProductionHistory(
            date=row[0],
            planned_tonnage=row[1],
            actual_tonnage=row[2],
            downtime_hours=row[3],
            rainfall_mm=row[4],
            blast_delay_flag=row[5],
            data_provenance=row[6],
        )
        for row in reversed(rows)
    ]


@router.get("/production/{mine_id}/forecast", response_model=ForecastResponse)
def production_forecast(mine_id: str, horizon: int = Query(default=30, pattern="^(30|60|90)$")):
    with _connection() as connection:
        _require_mine(connection, mine_id)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT predicted_tonnage, planned_tonnage, shortfall_probability,
                       dominant_driver, local_reserve_confidence
                FROM shortfall_forecasts
                WHERE mine_id = %s AND horizon_days = %s
                ORDER BY created_at DESC LIMIT 1
                """,
                (mine_id, horizon),
            )
            row = cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Forecast not found.")
    return ForecastResponse(
        predicted_tonnage=row[0],
        planned_tonnage=row[1],
        shortfall_probability=row[2],
        dominant_driver=row[3],
        local_reserve_confidence=row[4],
    )