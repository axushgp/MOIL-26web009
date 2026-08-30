"""Align continuous and categorical rasters on one 30m UTM grid."""

from __future__ import annotations


def align_to_common_grid(
    rasters: dict[str, tuple],
    target_resolution_m: int = 30,
    target_crs: str = "EPSG:32644",
):
    try:
        import numpy as np
        import rasterio
        from rasterio.enums import Resampling
        from rasterio.transform import array_bounds
        from rasterio.warp import calculate_default_transform, reproject
    except ImportError as exc:
        raise RuntimeError(
            "rasterio and numpy are required for common-grid alignment."
        ) from exc
    if not rasters:
        raise ValueError("At least one raster is required for alignment.")

    first_key, (first_array, first_transform, first_crs) = next(iter(rasters.items()))
    height, width = first_array.shape[-2:]
    left, bottom, right, top = array_bounds(height, width, first_transform)
    target_transform, target_width, target_height = calculate_default_transform(
        first_crs,
        target_crs,
        width,
        height,
        left,
        bottom,
        right,
        top,
        resolution=target_resolution_m,
    )
    aligned = {}
    for key, (array, transform, crs) in rasters.items():
        destination = np.zeros((target_height, target_width), dtype=array.dtype)
        categorical = "lineament" in key.lower() or "mask" in key.lower()
        reproject(
            source=array,
            destination=destination,
            src_transform=transform,
            src_crs=crs,
            dst_transform=target_transform,
            dst_crs=target_crs,
            resampling=Resampling.nearest if categorical else Resampling.bilinear,
        )
        aligned[key] = (destination, target_transform, target_crs)
    return aligned