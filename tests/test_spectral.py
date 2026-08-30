import pytest

np = pytest.importorskip("numpy")

from module1_reserve_mapping.spectral import compute_band_ratios


def test_candidate_ratios_preserve_shape():
    bands = {number: np.full((2, 3), number, dtype="float32") for number in range(1, 9)}
    result = compute_band_ratios(bands, [("candidate", 4, 6)])
    assert result["candidate"].shape == (2, 3)
    assert np.allclose(result["candidate"], 4 / 6)


def test_zero_denominator_is_nan():
    bands = {4: np.ones((1, 1)), 6: np.zeros((1, 1))}
    assert np.isnan(compute_band_ratios(bands, [("candidate", 4, 6)])["candidate"]).all()