"""ASTER spectral features for the first reserve-mapping pass.

No literature-derived manganese ratio is hardcoded here because the source
papers and equation numbers have not been supplied. The candidate ratios are
therefore evaluated empirically against the available public-source mine
locations before one is selected.
"""

from __future__ import annotations

import argparse
from pathlib import Path

CANDIDATE_RATIOS = [
    ("swir_ratio_a", 4, 6),
    ("swir_ratio_b", 4, 7),
    ("swir_ratio_c", 6, 8),
    ("swir_ratio_d", 5, 8),
]
DEFAULT_RATIOS = CANDIDATE_RATIOS


def _numpy():
    try:
        import numpy as np
    except ImportError as exc:
        raise RuntimeError("numpy is required for spectral processing.") from exc
    return np


def load_aster_bands(geotiff_path: str | Path):
    try:
        import rasterio
    except ImportError as exc:
        raise RuntimeError("rasterio is required to load ASTER GeoTIFFs.") from exc
    path = Path(geotiff_path)
    if not path.exists():
        raise FileNotFoundError(f"ASTER GeoTIFF was not found: {path}")
    with rasterio.open(path) as dataset:
        if dataset.count < 14:
            raise ValueError(
                f"{path} contains {dataset.count} bands; the ASTER input must "
                "contain bands 1 through 14 or be prepared as a documented stack."
            )
        return {
            band_number: dataset.read(band_number).astype("float32")
            for band_number in range(1, 15)
        }


def compute_band_ratios(bands: dict, ratio_definitions: list[tuple]):
    np = _numpy()
    ratios = {}
    for name, numerator_band, denominator_band in ratio_definitions:
        if numerator_band not in bands or denominator_band not in bands:
            raise KeyError(f"Missing ASTER band for ratio {name}.")
        numerator = np.asarray(bands[numerator_band], dtype="float32")
        denominator = np.asarray(bands[denominator_band], dtype="float32")
        if numerator.shape != denominator.shape:
            raise ValueError(f"Ratio {name} has mismatched band shapes.")
        ratios[name] = np.divide(
            numerator,
            denominator,
            out=np.full(numerator.shape, np.nan, dtype="float32"),
            where=np.abs(denominator) > 1e-8,
        )
    return ratios


def _sample_at_mines(ratio_array, mines: dict, geotransform):
    try:
        from rasterio.transform import rowcol
    except ImportError as exc:
        raise RuntimeError("rasterio is required to sample mine locations.") from exc
    samples = []
    for mine in mines.values():
        if mine.get("lat") is None or mine.get("lon") is None:
            continue
        if mine.get("confidence") == "NEEDS_USER_INPUT":
            continue
        row, column = rowcol(geotransform, mine["lon"], mine["lat"])
        if 0 <= row < ratio_array.shape[0] and 0 <= column < ratio_array.shape[1]:
            value = ratio_array[row, column]
            if value == value:
                samples.append(float(value))
    return samples


def score_ratio_at_known_mines(
    ratio_array,
    mines: dict,
    geotransform,
    background_samples: int = 20,
    random_seed: int = 42,
):
    """Return a Cohen's d and Welch p-value against reproducible background pixels."""
    np = _numpy()
    positive = _sample_at_mines(ratio_array, mines, geotransform)
    if not positive:
        raise ValueError("No coordinate-bearing mine falls inside the ratio raster.")
    valid_rows, valid_columns = np.where(np.isfinite(ratio_array))
    rng = np.random.default_rng(random_seed)
    count = min(background_samples * len(positive), len(valid_rows))
    selected = rng.choice(len(valid_rows), size=count, replace=False)
    background = ratio_array[valid_rows[selected], valid_columns[selected]].astype(float)
    background = background[np.isfinite(background)]
    if len(background) < 2 or len(positive) < 2:
        return {
            "positive_count": len(positive),
            "background_count": len(background),
            "cohens_d": float("nan"),
            "p_value": float("nan"),
        }
    pooled = np.sqrt((np.var(positive, ddof=1) + np.var(background, ddof=1)) / 2)
    cohens_d = (np.mean(positive) - np.mean(background)) / pooled if pooled else 0.0
    try:
        from scipy.stats import ttest_ind

        p_value = float(ttest_ind(positive, background, equal_var=False).pvalue)
    except ImportError:
        p_value = float("nan")
    return {
        "positive_count": len(positive),
        "background_count": len(background),
        "cohens_d": float(cohens_d),
        "p_value": p_value,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("geotiff", type=Path)
    parser.add_argument("--output", type=Path, default=Path("data/processed/manganese_spectral_score.tif"))
    args = parser.parse_args()
    try:
        import rasterio
    except ImportError as exc:
        raise RuntimeError("rasterio is required for the spectral CLI.") from exc
    from ingestion.config import MINES

    with rasterio.open(args.geotiff) as source:
        bands = {
            band_number: source.read(band_number).astype("float32")
            for band_number in range(1, source.count + 1)
        }
        profile = source.profile.copy()
        transform = source.transform
    results = compute_band_ratios(bands, DEFAULT_RATIOS)
    scored = []
    for name, ratio in results.items():
        score = score_ratio_at_known_mines(ratio, MINES, transform)
        scored.append((name, score))
        print(f"{name}: Cohen's d={score['cohens_d']:.3f}, p={score['p_value']:.4g}")
    best_name, _ = max(
        scored,
        key=lambda item: abs(item[1]["cohens_d"])
        if item[1]["cohens_d"] == item[1]["cohens_d"]
        else float("-inf"),
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    profile.update(count=1, dtype="float32")
    with rasterio.open(args.output, "w", **profile) as destination:
        destination.write(results[best_name].astype("float32"), 1)
    print(f"Selected {best_name}; wrote {args.output}")


if __name__ == "__main__":
    main()