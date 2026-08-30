"""Structural-control features derived from SAR and Bhukosh geometry."""

from __future__ import annotations


def extract_lineaments(sar_geotiff_path):
    try:
        import cv2
        import numpy as np
        import rasterio
    except ImportError as exc:
        raise RuntimeError(
            "opencv-python, numpy, and rasterio are required for lineament extraction."
        ) from exc
    with rasterio.open(sar_geotiff_path) as source:
        image = source.read(1).astype("float32")
    finite = np.isfinite(image)
    if not finite.any():
        raise ValueError("SAR raster contains no finite pixels.")
    low, high = np.percentile(image[finite], [2, 98])
    normalized = np.clip((image - low) / max(high - low, 1e-6) * 255, 0, 255)
    filtered = cv2.medianBlur(normalized.astype("uint8"), 5)
    # Median filtering is a documented time-boxed simplification of Lee filtering.
    edges = cv2.Canny(filtered, 50, 150)
    return edges > 0


def distance_to_nearest_lineament(lineament_raster, pixel_size_m: float = 30.0):
    try:
        from scipy.ndimage import distance_transform_edt
    except ImportError as exc:
        raise RuntimeError("scipy is required for distance transforms.") from exc
    return distance_transform_edt(~lineament_raster) * pixel_size_m


def distance_to_sausar_boundary(
    bhukosh_shapefile_path,
    aoi,
    transform=None,
    shape=None,
):
    """Rasterize the selected Bhukosh layer, then compute boundary distance."""
    if transform is None or shape is None:
        raise ValueError(
            "A common-grid transform and shape are required to rasterize Bhukosh "
            "geometry; align rasters before computing this feature."
        )
    try:
        import numpy as np
        import rasterio.features
        from scipy.ndimage import distance_transform_edt
    except ImportError as exc:
        raise RuntimeError(
            "rasterio, scipy, and numpy are required for Bhukosh distance features."
        ) from exc
    from ingestion.bhukosh_loader import load_bhukosh_layer

    layer = load_bhukosh_layer(bhukosh_shapefile_path)
    boundary = rasterio.features.rasterize(
        ((geometry, 1) for geometry in layer.geometry),
        out_shape=shape,
        transform=transform,
        fill=0,
        dtype="uint8",
    )
    if not np.any(boundary):
        raise ValueError("Bhukosh geometry did not overlap the configured common grid.")
    return distance_transform_edt(boundary == 0) * 30.0