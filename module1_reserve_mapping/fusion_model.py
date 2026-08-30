"""Positive-unlabeled reserve fusion model."""

from __future__ import annotations


def _numpy():
    try:
        import numpy as np
    except ImportError as exc:
        raise RuntimeError("numpy is required for reserve fusion.") from exc
    return np


def _mine_pixels(mines, geotransform, shape):
    try:
        from rasterio.transform import rowcol
    except ImportError as exc:
        raise RuntimeError("rasterio is required to locate mine pixels.") from exc
    locations = []
    for mine_id, mine in mines.items():
        if mine.get("lat") is None or mine.get("lon") is None:
            continue
        row, column = rowcol(geotransform, mine["lon"], mine["lat"])
        if 0 <= row < shape[0] and 0 <= column < shape[1]:
            locations.append((mine_id, row, column, mine))
    return locations


def build_training_table(
    spectral_score,
    dist_lineament,
    dist_sausar_boundary,
    mines: dict,
    geotransform=None,
    positive_radius_m: float = 500,
    exclusion_radius_m: float = 2000,
):
    """Build a small PU-learning table; probabilities are relative rankings."""
    if geotransform is None:
        raise ValueError("geotransform is required to map mine coordinates to pixels.")
    np = _numpy()
    try:
        import pandas as pd
        from rasterio.transform import rowcol
    except ImportError as exc:
        raise RuntimeError("pandas and rasterio are required for training tables.") from exc
    arrays = [np.asarray(value) for value in (spectral_score, dist_lineament, dist_sausar_boundary)]
    if len({array.shape for array in arrays}) != 1:
        raise ValueError("All fusion features must have identical shapes.")
    shape = arrays[0].shape
    locations = _mine_pixels(mines, geotransform, shape)
    if len(locations) < 1:
        raise ValueError("No coordinate-bearing mine overlaps the common grid.")
    positive_mask = np.zeros(shape, dtype=bool)
    all_mine_mask = np.zeros(shape, dtype=bool)
    pixel_size_m = max(abs(float(geotransform.a)), abs(float(geotransform.e)))
    positive_radius_px = max(1, int(positive_radius_m / pixel_size_m))
    exclusion_radius_px = max(1, int(exclusion_radius_m / pixel_size_m))
    for _mine_id, row, column, _mine in locations:
        all_mine_mask[
            max(0, row - exclusion_radius_px) : row + exclusion_radius_px + 1,
            max(0, column - exclusion_radius_px) : column + exclusion_radius_px + 1,
        ] = True
        if _mine.get("confidence") != "NEEDS_USER_INPUT":
            yy, xx = np.ogrid[: shape[0], : shape[1]]
            positive_mask |= (yy - row) ** 2 + (xx - column) ** 2 <= positive_radius_px**2
    valid = np.isfinite(arrays[0]) & np.isfinite(arrays[1]) & np.isfinite(arrays[2])
    positive_rows, positive_columns = np.where(positive_mask & valid)
    negative_pool = valid & ~all_mine_mask & ~positive_mask
    negative_rows, negative_columns = np.where(negative_pool)
    rng = np.random.default_rng(42)
    negative_count = min(len(negative_rows), max(1, 10 * len(positive_rows)))
    if negative_count:
        selected = rng.choice(len(negative_rows), negative_count, replace=False)
        negative_rows = negative_rows[selected]
        negative_columns = negative_columns[selected]
    rows = np.concatenate([positive_rows, negative_rows])
    columns = np.concatenate([positive_columns, negative_columns])
    return pd.DataFrame(
        {
            "spectral_score": arrays[0][rows, columns],
            "dist_lineament": arrays[1][rows, columns],
            "dist_sausar_boundary": arrays[2][rows, columns],
            "label": np.concatenate(
                [np.ones(len(positive_rows), dtype="int8"), np.zeros(len(negative_rows), dtype="int8")]
            ),
        }
    )


def train_fusion_model(training_table):
    try:
        from sklearn.ensemble import RandomForestClassifier
    except ImportError as exc:
        raise RuntimeError("scikit-learn is required for reserve fusion.") from exc
    features = ["spectral_score", "dist_lineament", "dist_sausar_boundary"]
    model = RandomForestClassifier(
        n_estimators=300,
        class_weight="balanced",
        max_depth=8,
        random_state=42,
    )
    model.fit(training_table[features], training_table["label"])
    print(
        "Reserve feature importances:",
        dict(zip(features, model.feature_importances_)),
    )
    return model


def predict_reserve_surface(model, spectral_score, dist_lineament, dist_sausar_boundary):
    np = _numpy()
    shape = spectral_score.shape
    import pandas as pd

    values = pd.DataFrame(
        {
            "spectral_score": np.asarray(spectral_score).ravel(),
            "dist_lineament": np.asarray(dist_lineament).ravel(),
            "dist_sausar_boundary": np.asarray(dist_sausar_boundary).ravel(),
        }
    )
    probabilities = model.predict_proba(values)[:, 1]
    return probabilities.reshape(shape)


def save_to_postgis(
    probability_raster,
    geotransform,
    db_connection,
    spectral_score=None,
    dist_lineament=None,
    dist_sausar_boundary=None,
    model_version: str = "fusion-v0.1",
    stride: int = 4,
):
    """Persist a downsampled WGS84-point representation of the probability surface."""
    try:
        from rasterio.warp import transform
    except ImportError as exc:
        raise RuntimeError("rasterio is required to write reserve points.") from exc
    rows = []
    for row in range(0, probability_raster.shape[0], stride):
        for column in range(0, probability_raster.shape[1], stride):
            x, y = geotransform * (column + 0.5, row + 0.5)
            longitude, latitude = transform("EPSG:32644", "EPSG:4326", [x], [y])
            rows.append(
                (
                    longitude[0],
                    latitude[0],
                    float(spectral_score[row, column]) if spectral_score is not None else None,
                    float(dist_lineament[row, column]) if dist_lineament is not None else None,
                    float(dist_sausar_boundary[row, column])
                    if dist_sausar_boundary is not None
                    else None,
                    float(probability_raster[row, column]),
                    model_version,
                )
            )
    with db_connection.cursor() as cursor:
        cursor.executemany(
            """
            INSERT INTO reserve_grid
              (geom, spectral_score, dist_lineament_m, dist_sausar_boundary_m,
               reserve_probability, model_version)
            VALUES (ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                    %s, %s, %s, %s, %s)
            """,
            rows,
        )
    db_connection.commit()