"""Shared AOI and mine metadata.

Coordinates are intentionally conservative. Only the three public-source
approximations in the build specification are populated; every other mine is
left unresolved until the team supplies an authoritative MOIL or GSI location.
"""

AOI_BOUNDS = {
    "min_lat": 20.9,
    "max_lat": 22.1,
    "min_lon": 79.0,
    "max_lon": 80.6,
}

MINES = {
    "balaghat_bharveli": {
        "lat": 21.80,
        "lon": 80.18,
        "district": "Balaghat, MP",
        "type": "underground",
        "confidence": "public_source_approximate",
        "source": "mindat.org locality record; confirm against MOIL lease documents",
    },
    "ukwa": {
        "lat": 21.97,
        "lon": 80.47,
        "district": "Balaghat, MP",
        "type": "opencast",
        "confidence": "public_source_approximate",
        "source": "mindat.org locality record; confirm against MOIL lease documents",
    },
    "tirodi": {
        "lat": 21.68,
        "lon": 79.72,
        "district": "Balaghat, MP",
        "type": "unspecified",
        "confidence": "town_proxy",
        "source": "public Tirodi tehsil coordinates used as a mine-area proxy",
    },
    "chikla": {
        "lat": None,
        "lon": None,
        "district": "Bhandara, Maharashtra",
        "type": "underground",
        "confidence": "NEEDS_USER_INPUT",
        "source": "geology is documented; exact mine coordinates remain unresolved",
    },
    "kandri": {
        "lat": None,
        "lon": None,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "NEEDS_USER_INPUT",
        "source": "authoritative coordinate required",
    },
    "mansar": {
        "lat": None,
        "lon": None,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "NEEDS_USER_INPUT",
        "source": "authoritative coordinate required",
    },
    "beldongri": {
        "lat": None,
        "lon": None,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "NEEDS_USER_INPUT",
        "source": "authoritative coordinate required",
    },
    "gumgaon": {
        "lat": None,
        "lon": None,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "NEEDS_USER_INPUT",
        "source": "authoritative coordinate required",
    },
    "dongri_buzurg": {
        "lat": None,
        "lon": None,
        "district": "Bhandara, Maharashtra",
        "type": "opencast",
        "confidence": "NEEDS_USER_INPUT",
        "source": "authoritative coordinate required",
    },
    "sitapatore": {
        "lat": None,
        "lon": None,
        "district": "Bhandara, Maharashtra",
        "type": "opencast",
        "confidence": "NEEDS_USER_INPUT",
        "source": "authoritative coordinate required",
    },
}


def check_mine_coordinates():
    """Print unresolved locations and return their mine IDs."""
    missing = [mine_id for mine_id, mine in MINES.items() if mine.get("lat") is None]
    if missing:
        print(
            f"[WARNING] {len(missing)} mines missing authoritative coordinates: "
            f"{missing}. They will be excluded from validation and database seeding."
        )
    return missing


if __name__ == "__main__":
    check_mine_coordinates()