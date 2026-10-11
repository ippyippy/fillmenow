// Build-only extension of the approved 1.2.2 Android package. Production website/backend are unchanged.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,[path.resolve('tools/native-map-clarity-prepare.mjs')],{stdio:'inherit'});
for(const name of ['unified-search.js','unified-search.css'])fs.copyFileSync('native/'+name,'native/www/'+name);
let page=fs.readFileSync('native/www/index.html','utf8');
const head='</head>',body='</body>';
assert(page.includes(head)&&page.includes(body),'Search page structure must be reviewed before injection');
page=page.replace(head,'<link rel="stylesheet" href="/unified-search.css">'+head);
page=page.replace(body,'<script src="/unified-search.js"></script>'+body);
fs.writeFileSync('native/www/index.html',page);
let gradle=fs.readFileSync('android/app/build.gradle','utf8');
assert(gradle.includes("versionCode 5; versionName '1.2.2-map-clarity-test'"),'Expected version 1.2.2 native base');
gradle=gradle.replace("versionCode 5; versionName '1.2.2-map-clarity-test'","versionCode 6; versionName '1.2.3-unified-search-test'");
fs.writeFileSync('android/app/build.gradle',gradle);
const entry='native/www/native-entry.js';
let bundle=fs.readFileSync(entry,'utf8');
assert(bundle.includes('Android 1.2.2 map clarity test'),'Expected native build label');
bundle=bundle.replaceAll('Android 1.2.2 map clarity test','Android 1.2.3 unified search test');
fs.writeFileSync(entry,bundle);
const cap=path.resolve('native/node_modules/@capacitor/cli/bin/capacitor');
assert(fs.existsSync(cap),'Pinned Capacitor CLI missing');
execFileSync(process.execPath,[cap,'sync','android'],{cwd:path.resolve('native'),stdio:'inherit'});
console.log('1.2.3 unified native Search prepared; existing geolocation, prices, routes, Dash, storage, source and original artwork remain unchanged.');

