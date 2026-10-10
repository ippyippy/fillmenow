// Build the existing direct-GPS app, then apply native-only visual changes.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
execFileSync('node',['tools/direct-native-prepare.mjs'],{stdio:'inherit'});
const main='android/app/src/main/java/au/com/fillmenow/app/MainActivity.java';
let java=fs.readFileSync(main,'utf8');
const begin=java.indexOf(' @Override public void onCreate(Bundle b)'),end=java.indexOf('\n public void ensureLocation(',begin);
assert(begin>0&&end>begin,'Native activity source changed: review the insets patch');
const onCreate=` @Override public void onCreate(Bundle b){
  registerPlugin(FMNSettingsPlugin.class);super.onCreate(b);
  androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow(),false);
  androidx.core.view.WindowInsetsControllerCompat bars=androidx.core.view.WindowCompat.getInsetsController(getWindow(),getWindow().getDecorView());
  bars.setAppearanceLightStatusBars(true);bars.setAppearanceLightNavigationBars(true);
  android.view.View root=findViewById(android.R.id.content);
  root.setBackgroundColor(android.graphics.Color.WHITE);
  if(getBridge()!=null)getBridge().getWebView().setPadding(0,0,0,0);
  // Inset the CONTAINER, not the WebView drawing surface. This changes the HTML viewport too.
  ViewCompat.setOnApplyWindowInsetsListener(root,(v,insets)->{
   androidx.core.graphics.Insets safe=insets.getInsets(WindowInsetsCompat.Type.systemBars()|WindowInsetsCompat.Type.displayCutout());
   androidx.core.graphics.Insets keyboard=insets.getInsets(WindowInsetsCompat.Type.ime());
   v.setPadding(safe.left,safe.top,safe.right,Math.max(safe.bottom,keyboard.bottom));
   return WindowInsetsCompat.CONSUMED;
  });
  ViewCompat.requestApplyInsets(root);
 }`;
fs.writeFileSync(main,java.slice(0,begin)+onCreate+java.slice(end));
const cfg=JSON.parse(fs.readFileSync('native/capacitor.config.json'));
// One inset owner. The root container handles system bars, cutouts and keyboard; no CSS double padding.
cfg.plugins={...(cfg.plugins||{}),SystemBars:{insetsHandling:'disable',style:'LIGHT',hidden:false}};
fs.writeFileSync('native/capacitor.config.json',JSON.stringify(cfg,null,2));
let manifest=fs.readFileSync('android/app/src/main/AndroidManifest.xml','utf8');manifest=manifest.replace('android:launchMode="singleTask"','android:launchMode="singleTask" android:windowSoftInputMode="adjustResize"');fs.writeFileSync('android/app/src/main/AndroidManifest.xml',manifest);
const build='android/app/build.gradle';let gradle=fs.readFileSync(build,'utf8');assert(gradle.includes("versionCode 3; versionName '1.2.0-direct-gps-test'"));gradle=gradle.replace("versionCode 3; versionName '1.2.0-direct-gps-test'","versionCode 4; versionName '1.2.1-visual-test'");fs.writeFileSync(build,gradle);
for(const n of ['visual-polish.css','visual-polish.js'])fs.copyFileSync('native/'+n,'native/www/'+n);
for(const name of fs.readdirSync('native/www')){
 if(!/\.(css|html)$/.test(name))continue;
 const p='native/www/'+name;let text=fs.readFileSync(p,'utf8');
 text=text.replace(/env\(safe-area-inset-(?:top|right|bottom|left)(?:\s*,\s*[^)]*)?\)/g,'0px');
 if(name==='index.html'){
  text=text.replace('<html lang="en">','<html lang="en" data-native-polish="1.2.1">');
  // Last stylesheet wins over historical browser-only responsive patches.
  text=text.replace('</body>','<link rel="stylesheet" href="/visual-polish.css"><script src="/visual-polish.js"></script></body>');
 }
 fs.writeFileSync(p,text);
}
const entry='native/www/native-entry.js';let bundle=fs.readFileSync(entry,'utf8');bundle=bundle.replaceAll('Android 1.2.0 GPS test','Android 1.2.1 visual test');fs.writeFileSync(entry,bundle);
// The visible consolidated control now owns Stop as well as Locate. Keep the complete GPS test.
const test='android/app/src/androidTest/java/au/com/fillmenow/app/NativeMapTest.java';let check=fs.readFileSync(test,'utf8');check=check.replaceAll('tap("#followToggle")','tap("#recenterBtn")');fs.writeFileSync(test,check);
execFileSync('npx',['cap','sync','android'],{cwd:'native',stdio:'inherit'});
console.log('Native visual 1.2.1 prepared; GPS provider, permission rules, price data, web production and saved storage are unchanged.');
