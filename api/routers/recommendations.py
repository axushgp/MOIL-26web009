from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from api.routers.mines import _connection
from api.schemas import RecommendationResponse

router = APIRouter()


@router.get("/recommendations/{mine_id}", response_model=RecommendationResponse)
def recommendation(mine_id: str, horizon: int = Query(default=30, pattern="^(30|60|90)$")):
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT r.action, r.detail, r.explanation_text, f.dominant_driver
                FROM recommendations r
                JOIN shortfall_forecasts f ON f.id = r.forecast_id
                WHERE r.mine_id = %s AND f.horizon_days = %s
                ORDER BY r.created_at DESC LIMIT 1
                """,
                (mine_id, horizon),
            )
            row = cursor.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Recommendation not found.")
    return RecommendationResponse(
        action=row[0],
        detail=row[1],
        explanation_text=row[2],
        driver=row[3],
    )