"""Seed only mines with non-null coordinates from ingestion.config."""

from __future__ import annotations

import os

from ingestion.config import MINES, check_mine_coordinates


def seed_mines():
    try:
        import psycopg2
    except ImportError as exc:
        raise RuntimeError("psycopg2-binary is required to seed the database.") from exc
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL must be set before running db.seed.")

    check_mine_coordinates()
    with psycopg2.connect(database_url) as connection:
        with connection.cursor() as cursor:
            for mine_id, mine in MINES.items():
                if mine.get("lat") is None or mine.get("lon") is None:
                    print(f"[WARNING] Skipping {mine_id}: coordinates need user input.")
                    continue
                cursor.execute(
                    """
                    INSERT INTO mines
                      (mine_id, name, district, mine_type, coordinate_status, geom)
                    VALUES (%s, %s, %s, %s, %s,
                      ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography)
                    ON CONFLICT (mine_id) DO UPDATE SET
                      name = EXCLUDED.name,
                      district = EXCLUDED.district,
                      mine_type = EXCLUDED.mine_type,
                      coordinate_status = EXCLUDED.coordinate_status,
                      geom = EXCLUDED.geom
                    """,
                    (
                        mine_id,
                        mine_id.replace("_", " ").title(),
                        mine["district"],
                        mine.get("type", "unspecified"),
                        mine["confidence"],
                        mine["lon"],
                        mine["lat"],
                    ),
                )
    print("Mine seed complete; unresolved entries were not inserted.")


if __name__ == "__main__":
    seed_mines()