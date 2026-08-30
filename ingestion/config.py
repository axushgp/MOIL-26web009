"""Shared AOI and source-backed mine metadata.

Coordinates are screening points, not mine-lease boundary surveys. Each point
has an explicit source and confidence so it cannot be mistaken for a surveyed
shaft or lease centroid.
"""

AOI_BOUNDS = {
    "min_lat": 20.9,
    "max_lat": 22.1,
    "min_lon": 79.0,
    "max_lon": 80.6,
}

GEOMETRY_RETRIEVED_AT = "2026-08-30"

MINES = {
    "balaghat_bharveli": {
        "lat": 21.80,
        "lon": 80.18,
        "district": "Balaghat, MP",
        "type": "underground",
        "confidence": "public_source_approximate",
        "source": "mindat.org locality record; confirm against MOIL lease documents",
        "source_uri": "https://www.mindat.org/",
        "geometry_evidence": {
            "status": "screening_only",
            "confidence": "low",
            "validation_eligible": False,
            "geometry": {"type": "Point", "coordinates": [80.18, 21.8]},
            "source_uri": "https://www.mindat.org/",
            "retrieved_at": GEOMETRY_RETRIEVED_AT,
        },
    },
    "ukwa": {
        "lat": 21.97,
        "lon": 80.47,
        "district": "Balaghat, MP",
        "type": "opencast",
        "confidence": "public_source_approximate",
        "source": "mindat.org locality record; confirm against MOIL lease documents",
        "source_uri": "https://www.mindat.org/",
        "geometry_evidence": {
            "status": "screening_only",
            "confidence": "low",
            "validation_eligible": False,
            "geometry": {"type": "Point", "coordinates": [80.47, 21.97]},
            "source_uri": "https://www.mindat.org/",
            "retrieved_at": GEOMETRY_RETRIEVED_AT,
        },
    },
    "tirodi": {
        "lat": 21.68333,
        "lon": 79.73333,
        "district": "Balaghat, MP",
        "type": "opencast",
        "confidence": "public_mine_locality",
        "source": "South Tirodi Mine locality record; MOIL unit register confirms Tirodi Mine",
        "source_uri": "https://www.mindat.org/loc-25310.html",
        "geometry_evidence": {
            "status": "screening_only",
            "confidence": "low",
            "validation_eligible": False,
            "geometry": {"type": "Point", "coordinates": [79.73333, 21.68333]},
            "source_uri": "https://www.mindat.org/loc-25310.html",
            "retrieved_at": GEOMETRY_RETRIEVED_AT,
        },
    },
    "chikla": {
        "lat": 21.54333,
        "lon": 79.75389,
        "district": "Bhandara, Maharashtra",
        "type": "underground",
        "confidence": "government_corroborated_locality",
        "source": "mindat.org Chikla locality point; corroborated by Govt. Chikla mine report at 21°31'N, 79°45'E",
        "source_uri": "https://www.mindat.org/loc-56561.html",
        "geometry_evidence": {
            "status": "verified_point",
            "confidence": "medium",
            "validation_eligible": True,
            "geometry": {"type": "Point", "coordinates": [79.75389, 21.54333]},
            "source_uri": "https://www.mindat.org/loc-56561.html",
            "retrieved_at": GEOMETRY_RETRIEVED_AT,
            "corroborating_source_uri": "https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=10111912241213PGW7HSubsidentReportChiklaMine.pdf&FilePath=../writereaddata/FormA/Miningletter/",
        },
    },
    "kandri": {
        "lat": 21.4125,
        "lon": 79.266667,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "government_report",
        "source": "Govt. environmental-clearance record: 21°24'45\"N, 79°16'00\"E",
        "source_uri": "https://environmentclearance.nic.in/DownloadPfdFile.aspx?FileName=8dC6vZxajKRE2gld7YNbqyml2WHmapn+rGCr3QTb0AaQuDAsJF6ERCaNQp6bxFwqKpLeav6BSe6tAkJiWwy73Q==&FilePath=93ZZBm8LWEXfg+HAlQix2fE2t8z/pgnoBhDlYdZCxzUI4D0y0DyH4SbeEYqwvEmbw63j4fms9Murl/YnHqFqoQ==",
        "geometry_evidence": {
            "status": "verified_point",
            "confidence": "high",
            "validation_eligible": True,
            "geometry": {"type": "Point", "coordinates": [79.266667, 21.4125]},
            "source_uri": "https://environmentclearance.nic.in/DownloadPfdFile.aspx?FileName=8dC6vZxajKRE2gld7YNbqyml2WHmapn+rGCr3QTb0AaQuDAsJF6ERCaNQp6bxFwqKpLeav6BSe6tAkJiWwy73Q==&FilePath=93ZZBm8LWEXfg+HAlQix2fE2t8z/pgnoBhDlYdZCxzUI4D0y0DyH4SbeEYqwvEmbw63j4fms9Murl/YnHqFqoQ==",
            "retrieved_at": GEOMETRY_RETRIEVED_AT,
        },
    },
    "mansar": {
        "lat": 21.389444,
        "lon": 79.287222,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "published_mine_study",
        "source": "ARMA 2018 Munsar mine study: center at 21°23'22\"N, 79°17'14\"E; MOIL uses Munsar spelling",
        "source_uri": "https://onepetro.org/ARMAUSRMS/proceedings/ARMA18/ARMA18/ARMA-2018-246/122460",
        "geometry_evidence": {
            "status": "verified_point",
            "confidence": "medium",
            "validation_eligible": True,
            "geometry": {"type": "Point", "coordinates": [79.287222, 21.389444]},
            "source_uri": "https://onepetro.org/ARMAUSRMS/proceedings/ARMA18/ARMA18/ARMA-2018-246/122460",
            "source_date": "2018",
            "retrieved_at": GEOMETRY_RETRIEVED_AT,
        },
    },
    "beldongri": {
        "lat": 21.3495,
        "lon": 79.3003,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "public_locality_approximate",
        "source": "The Diggings/USGS locality point; MOIL unit register confirms Beldongri Mine",
        "source_uri": "https://thediggings.com/mines/usgs10206660",
        "geometry_evidence": {
            "status": "screening_only",
            "confidence": "low",
            "validation_eligible": False,
            "geometry": {"type": "Point", "coordinates": [79.3003, 21.3495]},
            "source_uri": "https://thediggings.com/mines/usgs10206660",
            "retrieved_at": GEOMETRY_RETRIEVED_AT,
        },
    },
    "gumgaon": {
        "lat": 21.401557,
        "lon": 78.976669,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "government_envelope_corroborated",
        "source": "public Gumgaon locality point within Govt. environmental-clearance lease envelope",
        "source_uri": "https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=611111217121490Q5Osubsidencereport.pdf&FilePath=../writereaddata/FormA/Miningletter/",
        "geometry_evidence": {
            "status": "verified_envelope",
            "confidence": "medium",
            "validation_eligible": True,
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [78.958894, 21.396356],
                    [78.994444, 21.396356],
                    [78.994444, 21.406758],
                    [78.958894, 21.406758],
                    [78.958894, 21.396356]
                ]]
            },
            "source_uri": "https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=611111217121490Q5Osubsidencereport.pdf&FilePath=../writereaddata/FormA/Miningletter/",
            "retrieved_at": GEOMETRY_RETRIEVED_AT,
            "geometry_note": "Government-reported lease envelope represented as a bounding polygon; not a surveyed lease polygon.",
        },
    },
    "dongri_buzurg": {
        "lat": 21.548611,
        "lon": 79.682778,
        "district": "Bhandara, Maharashtra",
        "type": "opencast",
        "confidence": "public_locality_approximate",
        "source": "mindat.org mine locality point; MOIL unit register and Govt. mine plan confirm mine identity",
        "source_uri": "https://www.mindat.org/maps.php?id=204187",
        "geometry_evidence": {
            "status": "screening_only",
            "confidence": "low",
            "validation_eligible": False,
            "geometry": {"type": "Point", "coordinates": [79.682778, 21.548611]},
            "source_uri": "https://www.mindat.org/loc-204187.html",
            "retrieved_at": GEOMETRY_RETRIEVED_AT,
        },
    },
    "sitapatore": {
        "lat": 21.66667,
        "lon": 79.66667,
        "district": "Bhandara, Maharashtra",
        "type": "opencast",
        "confidence": "public_locality_approximate",
        "source": "mindat.org Sitapatore deposit point; MOIL unit register confirms Sitapatore Mine at Sukli",
        "source_uri": "https://www.mindat.org/loc-359219.html",
        "geometry_evidence": {
            "status": "screening_only",
            "confidence": "low",
            "validation_eligible": False,
            "geometry": {"type": "Point", "coordinates": [79.66667, 21.66667]},
            "source_uri": "https://www.mindat.org/loc-359219.html",
            "retrieved_at": GEOMETRY_RETRIEVED_AT,
        },
    },
}


def check_mine_coordinates():
    """Print mines that still lack validated geometry and return their IDs."""
    unresolved = [
        mine_id
        for mine_id, mine in MINES.items()
        if mine.get("lat") is None
        or not mine.get("geometry_evidence", {}).get("validation_eligible", False)
    ]
    if unresolved:
        print(
            f"[WARNING] {len(unresolved)} mines lack validated geometry: "
            f"{unresolved}. Screening points remain map-only and are excluded "
            f"from final validation."
        )
    return unresolved


if __name__ == "__main__":
    check_mine_coordinates()