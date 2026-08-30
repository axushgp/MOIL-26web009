"""Forecast features and XGBoost model with a real reserve-grid SQL query."""

from __future__ import annotations

FEATURE_COLUMNS = [
    "downtime_hours",
    "rainfall_mm",
    "blast_delay_flag",
    "local_reserve_confidence",
    "lag_1",
    "lag_7",
    "lag_30",
    "rolling_7",
    "rolling_30",
]


def query_local_reserve_confidence(connection, latitude: float, longitude: float, radius_m: int = 2000):
    """Query Module 1 output; this is intentionally not a hardcoded stand-in."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT AVG(reserve_probability)
            FROM reserve_grid
            WHERE ST_DWithin(
              geom,
              ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
              %s
            )
            """,
            (longitude, latitude, radius_m),
        )
        result = cursor.fetchone()
    if not result or result[0] is None:
        raise ValueError(
            f"No reserve_grid output found near ({latitude}, {longitude}); "
            "run Module 1 before training the forecast."
        )
    return float(result[0])


def build_features(production_df, reserve_grid_db_connection):
    try:
        import pandas as pd
    except ImportError as exc:
        raise RuntimeError("pandas is required for forecast features.") from exc
    required = {
        "date",
        "mine_id",
        "actual_tonnage",
        "downtime_hours",
        "rainfall_mm",
        "blast_delay_flag",
        "latitude",
        "longitude",
    }
    missing = required - set(production_df.columns)
    if missing:
        raise ValueError(f"Production data is missing required columns: {sorted(missing)}")
    source = production_df.sort_values(["mine_id", "date"]).copy()
    source["date"] = pd.to_datetime(source["date"])
    feature_frames = []
    for mine_id, mine_frame in source.groupby("mine_id", sort=False):
        mine_frame = mine_frame.copy()
        mine_frame["lag_1"] = mine_frame["actual_tonnage"].shift(1)
        mine_frame["lag_7"] = mine_frame["actual_tonnage"].shift(7)
        mine_frame["lag_30"] = mine_frame["actual_tonnage"].shift(30)
        mine_frame["rolling_7"] = mine_frame["actual_tonnage"].rolling(7).mean()
        mine_frame["rolling_30"] = mine_frame["actual_tonnage"].rolling(30).mean()
        mine = mine_frame.iloc[0]
        confidence = query_local_reserve_confidence(
            reserve_grid_db_connection,
            float(mine["latitude"]),
            float(mine["longitude"]),
        )
        mine_frame["local_reserve_confidence"] = confidence
        mine_frame["target_next_30_day"] = (
            mine_frame["actual_tonnage"].shift(-1).rolling(30).sum().shift(-29)
        )
        feature_frames.append(mine_frame)
    return pd.concat(feature_frames, ignore_index=True).dropna(
        subset=FEATURE_COLUMNS + ["target_next_30_day"]
    )


def train_shortfall_model(features_df):
    try:
        from xgboost import XGBRegressor
    except ImportError as exc:
        raise RuntimeError("xgboost is required for forecast training.") from exc
    model = XGBRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        objective="reg:squarederror",
        random_state=42,
    )
    model.fit(features_df[FEATURE_COLUMNS], features_df["target_next_30_day"])
    print(
        "Forecast feature importances:",
        dict(zip(FEATURE_COLUMNS, model.feature_importances_)),
    )
    return model


def predict_shortfall_risk(model, mine_id: str, current_features: dict):
    try:
        import pandas as pd
    except ImportError as exc:
        raise RuntimeError("pandas is required for forecast prediction.") from exc
    row = pd.DataFrame([{column: current_features[column] for column in FEATURE_COLUMNS}])
    predicted = float(model.predict(row)[0])
    planned = float(current_features["planned_production"])
    shortfall_probability = max(0.0, min(1.0, 1 - predicted / planned)) if planned else 0.0
    try:
        import shap

        contributions = shap.TreeExplainer(model)(row).values[0]
        driver = FEATURE_COLUMNS[max(range(len(contributions)), key=lambda index: abs(contributions[index]))]
    except ImportError as exc:
        raise RuntimeError(
            "shap is required to identify the dominant forecast driver."
        ) from exc
    return {
        "mine_id": mine_id,
        "predicted_production": predicted,
        "planned_production": planned,
        "shortfall_probability": shortfall_probability,
        "dominant_driver": driver,
        "local_reserve_confidence": current_features["local_reserve_confidence"],
    }