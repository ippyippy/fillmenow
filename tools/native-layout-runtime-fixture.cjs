/* Test-only transformation for browser CSS checks. It is never called by native build preparation or Android instrumentation. */
'use strict';
module.exports=function browserLayoutBundle(text){
 const guard='if (!Capacitor.isNativePlatform()) throw new Error("This bundle requires the installed Android app.");';
 if(!String(text).includes(guard))throw new Error('Native runtime guard changed; review this isolated browser fixture.');
 return String(text).replace(guard,'/* Browser-only layout fixture. The real APK retains its Android runtime guard. */');
};
