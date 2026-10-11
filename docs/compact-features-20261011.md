# Native 1.2.6 compact controls

The map's Features button now opens the shared vehicle, fuel, radius, location and journey form, with station filters in a compact disclosure. It stays reachable with Best Stop expanded. Existing input handlers, preferences, geocoding, direction filtering and truck exclusion rules are reused.

The existing Locate control is moved into the former header Search position without replacing its GPS handler. The duplicate gear is removed. MapLibre zoom buttons are no longer constructed; gesture zoom stays enabled. Attribution is rendered as inline credit links instead of an information toggle.

Station details now place price and distance before a full-width access summary. Directions stays reachable in the footer. The truck-access dialog shows the saved dimensions, published canopy, a single short access note and original operator/phone/source links. Long source notes and repeated warnings are removed from the UI; the reviewed directory and provenance remain intact.

Build: `node tools/native-compact-features-prepare.mjs`. This extends the native 1.2.5 recipe and version-increments to code 9 / `1.2.6-compact-features-test`. The backend, iOS, native GPS implementation, prices, truck safety rules and 151-facility directory are unchanged.

The compact UI regression suite exercises header placement, Features reachability, filter persistence/validation/reset, canopy displays, full-width station content, single-warning access dialogs, working contact URLs and real two-finger zoom input. Existing Search/UX/map suites and Android GPS/inset/keyboard tests remain in the build workflow.
