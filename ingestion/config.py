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

MINES = {
    "balaghat_bharveli": {
        "lat": 21.80,
        "lon": 80.18,
        "district": "Balaghat, MP",
        "type": "underground",
        "confidence": "public_source_approximate",
        "source": "mindat.org locality record; confirm against MOIL lease documents",
        "source_uri": "https://www.mindat.org/",
    },
    "ukwa": {
        "lat": 21.97,
        "lon": 80.47,
        "district": "Balaghat, MP",
        "type": "opencast",
        "confidence": "public_source_approximate",
        "source": "mindat.org locality record; confirm against MOIL lease documents",
        "source_uri": "https://www.mindat.org/",
    },
    "tirodi": {
        "lat": 21.68333,
        "lon": 79.73333,
        "district": "Balaghat, MP",
        "type": "opencast",
        "confidence": "public_mine_locality",
        "source": "South Tirodi Mine locality record; MOIL unit register confirms Tirodi Mine",
        "source_uri": "https://www.mindat.org/loc-25310.html",
    },
    "chikla": {
        "lat": 21.54333,
        "lon": 79.75389,
        "district": "Bhandara, Maharashtra",
        "type": "underground",
        "confidence": "government_corroborated_locality",
        "source": "mindat.org Chikla locality point; corroborated by Govt. Chikla mine report at 21°31'N, 79°45'E",
        "source_uri": "https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=10111912241213PGW7HSubsidentReportChiklaMine.pdf&FilePath=../writereaddata/FormA/Miningletter/",
    },
    "kandri": {
        "lat": 21.4,
        "lon": 79.266667,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "government_report",
        "source": "Govt. forest-clearance mine report: 21°24'N, 79°16'E",
        "source_uri": "https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=6111612381216GRGTPSubsidencereport.pdf&FilePath=../writereaddata/FormA/Miningletter/",
    },
    "mansar": {
        "lat": 21.389444,
        "lon": 79.287222,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "published_mine_study",
        "source": "ARMA 2018 Munsar mine study: center at 21°23'22\"N, 79°17'14\"E; MOIL uses Munsar spelling",
        "source_uri": "https://onepetro.org/ARMAUSRMS/proceedings/ARMA18/ARMA18/ARMA-2018-246/122460",
    },
    "beldongri": {
        "lat": 21.3495,
        "lon": 79.3003,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "public_locality_approximate",
        "source": "The Diggings/USGS locality point; MOIL unit register confirms Beldongri Mine",
        "source_uri": "https://thediggings.com/mines/usgs10206660",
    },
    "gumgaon": {
        "lat": 21.39602,
        "lon": 78.99197,
        "district": "Nagpur, Maharashtra",
        "type": "underground",
        "confidence": "government_envelope_corroborated",
        "source": "public Gumgaon locality point within Govt. environmental-clearance lease envelope",
        "source_uri": "https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=611111217121490Q5Osubsidencereport.pdf&FilePath=../writereaddata/FormA/Miningletter/",
    },
    "dongri_buzurg": {
        "lat": 21.548611,
        "lon": 79.682778,
        "district": "Bhandara, Maharashtra",
        "type": "opencast",
        "confidence": "public_locality_approximate",
        "source": "mindat.org mine locality point; MOIL unit register and Govt. mine plan confirm mine identity",
        "source_uri": "https://www.mindat.org/maps.php?id=204187",
    },
    "sitapatore": {
        "lat": 21.66667,
        "lon": 79.66667,
        "district": "Bhandara, Maharashtra",
        "type": "opencast",
        "confidence": "public_locality_approximate",
        "source": "mindat.org Sitapatore deposit point; MOIL unit register confirms Sitapatore Mine at Sukli",
        "source_uri": "https://www.mindat.org/loc-359219.html",
    },
}


def check_mine_coordinates():
    """Print unresolved locations and return their mine IDs."""
    missing = [mine_id for mine_id, mine in MINES.items() if mine.get("lat") is None]
    if missing:
        print(
            f"[WARNING] {len(missing)} mines missing source-backed coordinates: "
            f"{missing}. They will be excluded from validation and database seeding."
        )
    return missing


if __name__ == "__main__":
    check_mine_coordinates()