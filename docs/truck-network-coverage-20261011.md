# Truck facility coverage and native 1.2.5

The six-record catalogue caused sparse Truck-mode results. The reviewed catalogue now has 151 unique fuel-provider stations: QLD 65, NSW 49, WA 37. Four existing Shell/IOR records are retained; 147 Ampol National Truck Network records replace the two earlier Ampol entries and add 145 more stations.

Source: Ampol's public service-station locator, filtered by National Truck Network (NTN), checked 11 October 2026. The locator returned 225 operator records across Australia. Match evidence is in `data/truck-network-matches-20261011.json`. Each included station has the operator's NTN flag, open status, a matching name/locality/address and coordinates within 200 m of the existing fuel-feed record. Existing provider coordinates and prices are not overwritten.

Twelve operator records in the supported feed states remain unmatched due to a different brand, missing feed record or significant coordinate conflict. They are excluded for review. Car/petrol forecourts at Rous Head and Wyong are excluded; Wyong's northbound and southbound diesel facilities are matched by forecourt name and direction. Other states require fuel coverage before their network stations can be priced. This is expanded coverage, not every Australian truck stop.

Ampol's linked Q3 2026 NTN atlas supplies canopy heights where published. These stay in the facility record with a separate atlas URL/page. A canopy figure does not create a verified entrance clearance or full vehicle match. Truck results reject a site where saved height plus the existing 0.1 m allowance exceeds its published canopy. No-canopy sites retain unknown approach limits. Full-height and full-dimension match filters remain strict. Current facility records expire from eligibility after 90 days unless rechecked.

Native 1.2.5 extends the tested 1.2.4 recipe: unified Vehicle & Fuel / Location & Journey Search, saved shared settings, Nearby quick actions and layout polish. GPS implementation, original Dash and logos, station coordinates and price ranking are unchanged. The native UI shows published canopy figures without claiming that full access is verified.

Build with `node tools/native-truck-network-prepare.mjs`, then use the pinned Android build and regression workflow. `node tools/truck-network-test.cjs` checks the committed real catalogue and trust boundaries. The existing native/browser suites cover Search, typography, marker behaviour and GPS. A physical Samsung check remains distinct from browser/emulator verification.
