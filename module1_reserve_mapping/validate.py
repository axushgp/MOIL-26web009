"""Honest leave-one-out validation for the small positive mine set."""

from __future__ import annotations

from .fusion_model import (
    build_training_table,
    predict_reserve_surface,
    train_fusion_model,
)


def leave_one_out_validation(
    spectral_score,
    dist_lineament,
    dist_sausar_boundary,
    mines,
    geotransform,
):
    coordinate_mines = {
        mine_id: mine
        for mine_id, mine in mines.items()
        if mine.get("lat") is not None and mine.get("lon") is not None
        and mine.get("confidence") != "NEEDS_USER_INPUT"
    }
    if len(coordinate_mines) < 2:
        raise ValueError("LOOCV needs at least two coordinate-bearing mine locations.")
    try:
        from rasterio.transform import rowcol
    except ImportError as exc:
        raise RuntimeError("rasterio is required for LOOCV sampling.") from exc
    results = []
    for held_out_id, held_out in coordinate_mines.items():
        training_mines = {
            mine_id: mine for mine_id, mine in coordinate_mines.items() if mine_id != held_out_id
        }
        table = build_training_table(
            spectral_score,
            dist_lineament,
            dist_sausar_boundary,
            training_mines,
            geotransform,
        )
        model = train_fusion_model(table)
        surface = predict_reserve_surface(
            model, spectral_score, dist_lineament, dist_sausar_boundary
        )
        row, column = rowcol(geotransform, held_out["lon"], held_out["lat"])
        held_out_score = float(surface[row, column])
        percentile = float((surface <= held_out_score).mean() * 100)
        results.append({"mine_id": held_out_id, "percentile": percentile})
    average = sum(item["percentile"] for item in results) / len(results)
    return {
        "confirmed_mines_checked": len(results),
        "avg_percentile_rank": average,
        "per_mine": results,
        "method": "leave-one-out percentile ranking",
    }