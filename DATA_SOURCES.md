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

The preview records the following coordinate evidence in `ingestion/config.py`
and the API's `coordinate_status` field. `verified_*` geometries are eligible
for final reserve validation; `screening_only` points remain map orientation
only until an official lease or Bhukosh geometry is available.

| Mine | Point (latitude, longitude) | Confidence | Coordinate evidence |
|---|---:|---|---|
| Balaghat (Bharveli) | 21.80000, 80.18000 | screening_only / low | [Mindat](https://www.mindat.org/) locality record |
| Ukwa | 21.97000, 80.47000 | screening_only / low | [Mindat](https://www.mindat.org/) locality record |
| Tirodi | 21.68333, 79.73333 | screening_only / low | [South Tirodi Mine locality](https://www.mindat.org/loc-25310.html) |
| Chikla | 21.54333, 79.75389 | verified_point / medium | [Mindat Chikla mine](https://www.mindat.org/loc-56561.html), corroborated by the [government Chikla mine report](https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=10111912241213PGW7HSubsidentReportChiklaMine.pdf&FilePath=../writereaddata/FormA/Miningletter/) |
| Kandri | 21.41250, 79.26667 | verified_point / high | [Government Kandri mine record](https://environmentclearance.nic.in/DownloadPfdFile.aspx?FileName=8dC6vZxajKRE2gld7YNbqyml2WHmapn+rGCr3QTb0AaQuDAsJF6ERCaNQp6bxFwqKpLeav6BSe6tAkJiWwy73Q==&FilePath=93ZZBm8LWEXfg+HAlQix2fE2t8z/pgnoBhDlYdZCxzUI4D0y0DyH4SbeEYqwvEmbw63j4fms9Murl/YnHqFqoQ==) |
| Munsar / Mansar | 21.38944, 79.28722 | verified_point / medium | [ARMA 2018 Munsar mine study](https://onepetro.org/ARMAUSRMS/proceedings/ARMA18/ARMA18/ARMA-2018-246/122460) |
| Beldongri | 21.34950, 79.30030 | screening_only / low | [The Diggings / USGS locality](https://thediggings.com/mines/usgs10206660), corroborated by the MOIL unit register |
| Gumgaon | 21.40156, 78.97667 | verified_envelope / medium | [Government GumGaon mine report](https://forestsclearance.nic.in/DownloadPdfFile.aspx?FileName=611111217121490Q5Osubsidencereport.pdf&FilePath=../writereaddata/FormA/Miningletter/) gives the reported envelope; the stored point is its centroid |
| Dongri Buzurg | 21.54861, 79.68278 | screening_only / low | [Mindat mine locality](https://www.mindat.org/loc-204187.html), corroborated by the MOIL unit register and government mine-plan record |
| Sitapatore | 21.66667, 79.66667 | screening_only / low | [Mindat Sitapatore deposit](https://www.mindat.org/loc-359219.html), with mine identity corroborated by the MOIL unit register |

The six `screening_only` points must be replaced with MOIL-lease or GSI
Bhukosh geometry before field planning or a final scientific evaluation. The
API does not hide that distinction.

## Data labels

- Reserve cells are deterministic demo output, not a geological survey result.
- Production history and weather patterns are synthetic demo data.
- The forecast includes the reserve-grid feature to demonstrate the intended
  cross-module contract, but it is not a trained production model.
- Four mines have source-backed validation geometry and six remain
  `screening_only`; none is a substitute for a current MOIL lease document or
  GSI Bhukosh geometry unless the status says otherwise.

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