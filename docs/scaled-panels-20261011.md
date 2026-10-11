# Android 1.2.7: 80% scale, panels and Cheapest

The installed app displays at 80% size at normal browser zoom. Authored pixel styles are compiled to 80%, while viewport dimensions and pointer coordinates stay 1:1 so maps, overlays and gestures work in older WebViews too. Native Android status/navigation bars retain their system size.

Features uses four independent disclosures: Vehicle & fuel, Location & journey, Popular areas and Station filters. New users see a collapsed overview with short current-setting summaries. Open/closed state persists locally, form nodes and listeners are retained, and direct vehicle/destination actions reveal the appropriate panel.

Cheapest keeps every usable pump price from the minimum through minimum + 10 cents per litre, inclusive, sorted by pump price. Distance, offers, truck eligibility and destination filters apply before choosing that minimum. Map pins, Nearby and Best Stop use the same candidate set; other ranking modes are unchanged. Raw feed values are never rewritten.

Build: `node tools/native-scaled-panels-prepare.mjs` produces version code 10 / `1.2.7-scale-panels-test` from the existing native recipe. The shared nearby selector owns the price window. Backend, native GPS provider, iOS and the facility directory remain unchanged.

Validation covers exact 80% geometry at browser zoom 1, full viewport fit, real marker taps, pinch gestures and Dash drags, panel persistence, price-window edges and map/list agreement, existing Search and settings flows, and Android GPS/system-bar/keyboard checks. Physical Samsung verification follows delivery.

The release gate covers Chromium at four screen sizes, WebKit and the actual Android emulator. CSS zoom remains 1; compact dimensions are baked into the generated styles. Existing iOS source and release workflows are unchanged.
