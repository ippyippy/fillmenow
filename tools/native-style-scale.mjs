// Bake compact dimensions into styles. CSS/visualViewport coordinates stay 1:1
// even on Android WebViews with pre-zoom getBoundingClientRect behavior.
const number=String.raw`-?(?:\d*\.\d+|\d+)`;
const pixels=new RegExp(String.raw`(?<![\w.])(${number})px\b`,'g');
const scaled=n=>String(Math.round(Number(n)*.8*10000)/10000)+'px';
export function scaleCSS(source){
 const tokens=new RegExp(String.raw`\/\*[\s\S]*?\*\/|url\((?:[^()"']|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@(?:media|container)[^{]+|(?<![\w.])(${number})px\b`,'gi');
 return source.replace(tokens,(all,n)=>n===undefined?all:scaled(n));
}
// Static CSS/HTML strings in first-party scripts; runtime coordinate values and
// media queries remain untouched. Never transform URLs or embedded artwork.
export function scaleScript(source){
 return source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g,token=>{
  if(token.startsWith('/')||!token.includes('px')||/^(?:["'`])\([^)]*(?:width|height)\s*:/.test(token))return token;
  return token.replace(/(?:data:|https?:\/\/)[^\s"'`<>]+|(?<![\w.])(-?(?:\d*\.\d+|\d+))px\b/g,(all,n)=>n===undefined?all:scaled(n));
 });
}
export function scaleHTML(source){
 return source.replace(/(<(style|script)\b[^>]*>)([\s\S]*?)(<\/\2>)|(\bstyle\s*=\s*)(["'])(.*?)\6/gi,(_,a,tag,body,b,attr,q,value)=>a?a+(tag.toLowerCase()==='style'?scaleCSS(body):scaleScript(body))+b:attr+q+scaleCSS(value)+q);
}
