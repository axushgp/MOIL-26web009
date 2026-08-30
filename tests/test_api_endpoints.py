"""Contract smoke checks for the FastAPI surface when it is running."""

import os
from urllib.request import urlopen

import pytest


BASE_URL = os.getenv("MRIP_FASTAPI_URL")


@pytest.mark.skipif(not BASE_URL, reason="Set MRIP_FASTAPI_URL to run the FastAPI contract check.")
def test_health_contract():
    with urlopen(f"{BASE_URL}/healthz", timeout=5) as response:
        assert response.status == 200
        assert response.read() == b'{"status":"ok"}'