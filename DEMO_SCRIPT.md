# MOIL Reserve Intelligence Platform demo

## Before the demo

- Run `pnpm install --frozen-lockfile`.
- Start the combined preview with `pnpm run dev`.
- Confirm the banner says **Preview mode · synthetic demo dataset**.
- If the API is already running on port 8080, run
  `pnpm run smoke:mrip` to check the core contracts.

## Narrative

1. **Open on the reserve probability map.** State explicitly: “Red zones show
   where our model, trained only on 3–4 confirmed mine locations, ranks reserve
   probability highest across the belt.” Then clarify that this preview uses
   deterministic demo output until the GEE and Bhukosh feeds are connected.
2. **Zoom to Balaghat.** Point out the known mine in a higher-probability zone.
   Use the validation card to explain that the displayed percentile is a
   leave-one-out evidence view, not an in-sample score.
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

“This is a functional product preview with an auditable API contract. The
current records are synthetic and illustrative; scientific use begins only
after the external datasets, coordinates, and model validation are confirmed.”