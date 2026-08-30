"""Live scientific E2E checks are opt-in and require a prepared PostGIS stack."""

import os

import pytest


@pytest.mark.skipif(
    not os.getenv("MRIP_FASTAPI_URL"),
    reason="Prepare the PostGIS stack and set MRIP_FASTAPI_URL before E2E checks.",
)
def test_e2e_requires_prepared_pipeline():
    pytest.importorskip("requests")
    pytest.skip(
        "Run the full pipeline first; this guard prevents a synthetic preview "
        "from being mistaken for a scientific E2E result."
    )