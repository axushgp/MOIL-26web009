"""Validated loader for manually downloaded GSI Bhukosh shapefiles."""

from __future__ import annotations

from pathlib import Path


def load_bhukosh_layer(data_dir: str | Path, layer_name: str | None = None):
    try:
        import geopandas as gpd
    except ImportError as exc:
        raise RuntimeError("geopandas is required to read Bhukosh layers.") from exc

    root = Path(data_dir)
    if not root.exists():
        raise FileNotFoundError(
            f"Bhukosh data directory does not exist: {root}. "
            "Download the complete shapefile set into data/raw/bhukosh/."
        )
    shapefiles = sorted(root.rglob("*.shp"))
    if not shapefiles:
        raise FileNotFoundError(
            f"No .shp file found under {root}. A complete Bhukosh download "
            "must include its .dbf, .shx, and projection sidecars."
        )
    candidates = [
        path for path in shapefiles if not layer_name or path.stem == layer_name
    ]
    if len(candidates) != 1:
        names = ", ".join(path.stem for path in shapefiles)
        raise ValueError(
            f"Bhukosh layer selection is ambiguous. Found [{names}]; "
            "pass the exact Sausar/lithology layer name."
        )
    layer = gpd.read_file(candidates[0])
    if layer.empty or layer.geometry.is_empty.all():
        raise ValueError("Selected Bhukosh layer has no usable geometries.")
    if layer.crs is None:
        raise ValueError("Selected Bhukosh layer has no CRS metadata.")
    return layer