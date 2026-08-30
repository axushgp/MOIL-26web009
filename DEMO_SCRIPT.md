# MOIL Reserve Intelligence Platform demo

## Before the demo

- Run `pnpm install --frozen-lockfile`.
- Start the combined preview with `pnpm run dev`.
- Confirm the banner says **Preview mode · synthetic demo dataset**.
- If the API is already running on port 8080, run
  `pnpm run smoke:mrip` to check the core contracts.

## Narrative

1. **Open on the reserve probability map.** State explicitly: “Red zones show
   where our deterministic screening surface ranks reserve probability highest
   around source-backed mine locality points.” Then clarify that this preview
   uses synthetic reserve cells until the GEE and Bhukosh feeds are connected.
2. **Zoom to Chikla, then Balaghat.** Point out that Chikla's displayed point is
   a government-corroborated locality point, not a lease-survey centroid. Use
   the validation card to explain that the displayed percentiles are computed
   leave-one-out evidence on ten source-backed screening points, not
   in-sample scores or geological certainty.
3. **Pan to an unexplored high-probability zone.** State that this is a
   drilling-priority recommendation, not a certainty claim.
4. **Switch to a mine’s production signal.** Show the planned versus actual
   chart, change the forecast horizon, and point out the shortfall risk and
   identified driver.
5. **Show the recommendation panel.** Explain that the action and driver are
   deterministic planning rules; the explanation is only a readable note.
6. **Close with the limitation.** This is a screening and prioritization tool
   for where MOIL should send drilling crews and how it should plan equipment
   allocation—not a replacement for physical exploration.

## Honest status line

“This is a functional product preview with an auditable API contract. Mine
locations are source-backed screening points with recorded confidence, while
the reserve cells and validation surface are synthetic and illustrative.
Scientific use begins only after external datasets, lease or Bhukosh geometry,
and model validation are confirmed.”