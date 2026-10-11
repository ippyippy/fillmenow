import assert from 'node:assert/strict';
import {scaleCSS,scaleScript,scaleHTML} from './native-style-scale.mjs';
assert.equal(scaleCSS('@media(max-width:480px){a{font-size:16px;height:calc(100vh - 56px);margin:-.5px;content:"16px";background:url(data:16px)}}'),'@media(max-width:480px){a{font-size:12.8px;height:calc(100vh - 44.8px);margin:-0.4px;content:"16px";background:url(data:16px)}}');
assert.equal(scaleScript('x.style.cssText="font-size:16px";x.style.top=n+"px";matchMedia("(max-width:1024px)")'),'x.style.cssText="font-size:12.8px";x.style.top=n+"px";matchMedia("(max-width:1024px)")');
assert.equal(scaleScript('const src="data:image/png;base64,20px"; /* 20px */'), 'const src="data:image/png;base64,20px"; /* 20px */');
assert.equal(scaleHTML('<style>a{padding:10px}</style><b style="padding:10px">X</b><script>x.innerHTML=\'<b style="padding:10px">X</b>\'</script>'),'<style>a{padding:8px}</style><b style="padding:8px">X</b><script>x.innerHTML=\'<b style="padding:8px">X</b>\'</script>');
console.log('4 style compiler checks passed: dimensions, coordinates, breakpoints, embedded artwork and single-pass HTML.');
