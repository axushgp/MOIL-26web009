# MRIP data posture

This imported preview intentionally runs without external credentials. The
dashboard and API use deterministic preview records so the product flow can be
reviewed safely before satellite, geology, weather, and production datasets are
connected. Mine coordinates are now source-backed screening points; they are
not claims that the preview contains MOIL lease-boundary geometry.

## Connected in the preview

- No Google Earth Engine account or service key
- No GSI Bhukosh lithology download
- No ERA5 weather download
- No MOIL internal production records
- No PostGIS persistence

## Coordinate evidence

The official MOIL unit register is the identity and postal-location source for
the mine names and operating units:

- [MOIL — Location of Units](https://www.moil.nic.in/content/57/Location-of-Units)

The preview records the following point evidence in `ingestion/config.py` and
the API's `coordinate_status` field:

| Mine | Point (latitude, longitude) | Confidence | Coordinate evidence |
|---|---:|---|---|
| Balaghat (Bharveli) | 21.80000, 80.18000 | public-source approximate | [Mindat](https://www.mindat.org/) locality record |
| Ukwa | 21.97000, 80.47000 | public-source approximate | [Mindat](https://www.mindat.org/) locality record |
| Tirodi | 21.68333, 79.73333 | public mine locality | [South Tirodi Mine locality](https://www.mindat.org/loc-25310.html) |
| Chikla | 21.54333, 79.75389 | government-corroborated locality | [Mindat Chikla locality map](https://www.mindat.org/maps.php?id=56561), corroborated by the [government Chikla mine report](https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=10111912241213PGW7HSubsidentReportChiklaMine.pdf&FilePath=../writereaddata/FormA/Miningletter/) |
| Kandri | 21.40000, 79.26667 | government report coordinate | [Government Kandri mine report](https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=6111612381216GRGTPSubsidencereport.pdf&FilePath=../writereaddata/FormA/Miningletter/) |
| Munsar / Mansar | 21.38944, 79.28722 | published study center | [ARMA 2018 Munsar mine study](https://onepetro.org/ARMAUSRMS/proceedings/ARMA18/ARMA18/ARMA-2018-246/122460) |
| Beldongri | 21.34950, 79.30030 | public-source approximate | [The Diggings / USGS locality](https://thediggings.com/mines/usgs10206660), corroborated by the MOIL unit register |
| Gumgaon | 21.39602, 78.99197 | government-corroborated locality | [Gumgaon locality](https://www.mindat.org/feature-10536537.html) within the [government GumGaon mine report](https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=611111217121490Q5Osubsidencereport.pdf&FilePath=../writereaddata/FormA/Miningletter/) |
| Dongri Buzurg | 21.54861, 79.68278 | public-source approximate | [Mindat mine locality map](https://www.mindat.org/maps.php?id=204187), corroborated by the MOIL unit register and [government mine plan](https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=5112612401214PNKJHMiningPlan.pdf&FilePath=../writereaddata/FormA/Miningletter/) |
| Sitapatore | 21.66667, 79.66667 | public-source approximate | [Mindat Sitapatore deposit](https://www.mindat.org/loc-359219.html), with mine identity corroborated by the MOIL unit register |

Coordinates marked approximate or locality-level must be replaced with
MOIL-lease or GSI Bhukosh geometry before field planning or a final scientific
evaluation. The API does not hide that distinction.

## Data labels

- Reserve cells are deterministic demo output, not a geological survey result.
- Production history and weather patterns are synthetic demo data.
- The forecast includes the reserve-grid feature to demonstrate the intended
  cross-module contract, but it is not a trained production model.
- Mine coordinates are source-backed screening points with per-record
  confidence labels; they are not a substitute for MOIL lease documents or GSI
  Bhukosh geometry.

## Before a scientific run

1. Replace screening points with MOIL lease documents or GSI Bhukosh geometry
   when available, retaining the source URI, retrieval date, and confidence.
2. Download the relevant Bhukosh lithology layers into the raw-data area.
3. Configure a Google Earth Engine service account and export the Sentinel-1,
   Sentinel-2, and ASTER composites.
4. Configure ERA5 access and replace the synthetic weather generator with the
   mine-specific weather loader.
5. Record model versions, source dates, coordinate evidence, and validation
   results alongside every reserve and forecast output.