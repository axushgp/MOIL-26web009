from __future__ import annotations

from fastapi import APIRouter, HTTPException

from api.schemas import Mine

router = APIRouter()


def _connection():
    import os
    import psycopg2

    url = os.getenv("DATABASE_URL")
    if not url:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured.")
    return psycopg2.connect(url)


@router.get("/mines", response_model=list[Mine])
def list_mines():
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT mine_id, name, district, mine_type, coordinate_status,
                       ST_Y(geom::geometry), ST_X(geom::geometry)
                FROM mines ORDER BY name
                """
            )
            rows = cursor.fetchall()
    return [
        Mine(
            mine_id=row[0],
            name=row[1],
            district=row[2],
            mine_type=row[3],
            coordinate_status=row[4],
            latitude=row[5],
            longitude=row[6],
        )
        for row in rows
    ]