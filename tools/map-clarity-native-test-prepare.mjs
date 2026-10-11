// Change only old visual size expectations to the new approved spec. Native permission/GPS assertions stay unchanged.
import fs from 'node:fs';import assert from 'node:assert/strict';
const file='android/app/src/androidTest/java/au/com/fillmenow/app/NativePolishTest.java';let s=fs.readFileSync(file,'utf8');
for(const [old,next] of [['assertEquals("64",json("document.querySelector(\'.topbar.app-topbar\').getBoundingClientRect().height"))','assertEquals("56",json("document.querySelector(\'.topbar.app-topbar\').getBoundingClientRect().height"))'],['assertEquals("68",json("document.querySelector(\'.bottom-nav\').getBoundingClientRect().height"))','assertEquals("60",json("document.querySelector(\'.bottom-nav\').getBoundingClientRect().height"))'],['screen("08-explore-landscape");assertEquals("56"','screen("08-explore-landscape");assertEquals("50"']]){assert(s.includes(old));s=s.replace(old,next);}
const old='tap("#mapStationCount");waitFor("document.body.dataset.page===\'options\'",10);';
assert(s.includes(old));s=s.replace(old,'assertEquals("Truck-only is mandatory in native app","\\\"truckstops\\\"",json("FMNNearbyUI.getFilters().access"));\n   '+old);
fs.writeFileSync(file,s);console.log('Native GPS test unchanged; visual expected sizes now match 1.2.2; added native truck-only assertion.');
