# MRIP data posture

This imported preview intentionally runs without external credentials. The
dashboard and API use deterministic in-memory demo records so the product flow
can be reviewed safely before any scientific data is connected.

## Connected in the preview

- No Google Earth Engine account or service key
- No GSI Bhukosh lithology download
- No ERA5 weather download
- No MOIL internal production records
- No PostGIS persistence

## Data labels

- Reserve cells are deterministic demo output, not a geological survey result.
- Production history and weather patterns are synthetic demo data.
- The forecast includes the reserve-grid feature to demonstrate the intended
  cross-module contract, but it is not a trained production model.
- Approximate mine coordinates shown in the demo must be confirmed against MOIL
  lease documents before they are used for validation or field planning.

## Before a scientific run

1. Confirm the four known mine coordinates and resolve the remaining mine
   coordinates from MOIL lease documents or GSI Bhukosh.
2. Download the relevant Bhukosh lithology layers into the raw-data area.
3. Configure a Google Earth Engine service account and export the Sentinel-1,
   Sentinel-2, and ASTER composites.
4. Configure ERA5 access and replace the synthetic weather generator with the
   mine-specific weather loader.
5. Record model versions, source dates, and validation results alongside every
   reserve and forecast output.