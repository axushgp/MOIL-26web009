CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS mines (
    mine_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    mine_type VARCHAR(30),
    coordinate_status VARCHAR(50) NOT NULL,
    geom GEOGRAPHY(POINT, 4326)
);

CREATE TABLE IF NOT EXISTS model_runs (
    model_version VARCHAR(50) PRIMARY KEY,
    module VARCHAR(40) NOT NULL,
    trained_at TIMESTAMP DEFAULT NOW(),
    n_positive_examples INT,
    loocv_avg_percentile FLOAT,
    in_sample_avg_percentile FLOAT,
    feature_importances JSONB,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS reserve_grid (
    id SERIAL PRIMARY KEY,
    geom GEOGRAPHY(POINT, 4326) NOT NULL,
    spectral_score FLOAT,
    dist_lineament_m FLOAT,
    dist_sausar_boundary_m FLOAT,
    reserve_probability FLOAT NOT NULL,
    model_version VARCHAR(50),
    computed_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reserve_grid_geom ON reserve_grid USING GIST (geom);

CREATE TABLE IF NOT EXISTS production_history (
    id SERIAL PRIMARY KEY,
    mine_id VARCHAR(50) REFERENCES mines(mine_id),
    date DATE NOT NULL,
    planned_tonnage FLOAT,
    actual_tonnage FLOAT,
    downtime_hours FLOAT,
    rainfall_mm FLOAT,
    blast_delay_flag BOOLEAN,
    data_provenance VARCHAR(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS shortfall_forecasts (
    id SERIAL PRIMARY KEY,
    mine_id VARCHAR(50) REFERENCES mines(mine_id),
    forecast_date DATE NOT NULL,
    horizon_days INT NOT NULL,
    predicted_tonnage FLOAT,
    planned_tonnage FLOAT,
    shortfall_probability FLOAT,
    dominant_driver VARCHAR(50),
    local_reserve_confidence FLOAT,
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    mine_id VARCHAR(50) REFERENCES mines(mine_id),
    forecast_id INT REFERENCES shortfall_forecasts(id),
    action VARCHAR(50) NOT NULL,
    detail TEXT NOT NULL,
    explanation_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);