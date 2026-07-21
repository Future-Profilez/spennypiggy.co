/**
 * MagicBell JavaScript Library 2.20.0
 * https://magicbell.io
 * Copyright 2022, MagicBell Inc.
 */

"use strict";
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */function e(e,t,n,r){return new(n||(n=Promise))((function(o,i){function a(e){try{c(r.next(e))}catch(e){i(e)}}function s(e){try{c(r.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(a,s)}c((r=r.apply(e,t||[])).next())}))}function t(e,t){var n,r,o,i,a={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return i={next:s(0),throw:s(1),return:s(2)},"function"==typeof Symbol&&(i[Symbol.iterator]=function(){return this}),i;function s(i){return function(s){return function(i){if(n)throw new TypeError("Generator is already executing.");for(;a;)try{if(n=1,r&&(o=2&i[0]?r.return:i[0]?r.throw||((o=r.return)&&o.call(r),0):r.next)&&!(o=o.call(r,i[1])).done)return o;switch(r=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return a.label++,{value:i[1],done:!1};case 5:a.label++,r=i[1],i=[0];continue;case 7:i=a.ops.pop(),a.trys.pop();continue;default:if(!(o=a.trys,(o=o.length>0&&o[o.length-1])||6!==i[0]&&2!==i[0])){a=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){a.label=i[1];break}if(6===i[0]&&a.label<o[1]){a.label=o[1],o=i;break}if(o&&a.label<o[2]){a.label=o[2],a.ops.push(i);break}o[2]&&a.ops.pop(),a.trys.pop();continue}i=t.call(e,a)}catch(e){i=[6,e],r=0}finally{n=o=0}if(5&i[0])throw i[1];return{value:i[0]?i[1]:void 0,done:!0}}([i,s])}}}let n,r;const o=new WeakMap,i=new WeakMap,a=new WeakMap,s=new WeakMap,c=new WeakMap;let u={get(e,t,n){if(e instanceof IDBTransaction){if("done"===t)return i.get(e);if("objectStoreNames"===t)return e.objectStoreNames||a.get(e);if("store"===t)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return d(e[t])},set:(e,t,n)=>(e[t]=n,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function l(e){return e!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(r||(r=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(...t){return e.apply(p(this),t),d(o.get(this))}:function(...t){return d(e.apply(p(this),t))}:function(t,...n){const r=e.call(p(this),t,...n);return a.set(r,t.sort?t.sort():[t]),d(r)}}function f(e){return"function"==typeof e?l(e):(e instanceof IDBTransaction&&function(e){if(i.has(e))return;const t=new Promise(((t,n)=>{const r=()=>{e.removeEventListener("complete",o),e.removeEventListener("error",i),e.removeEventListener("abort",i)},o=()=>{t(),r()},i=()=>{n(e.error||new DOMException("AbortError","AbortError")),r()};e.addEventListener("complete",o),e.addEventListener("error",i),e.addEventListener("abort",i)}));i.set(e,t)}(e),t=e,(n||(n=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some((e=>t instanceof e))?new Proxy(e,u):e);var t}function d(e){if(e instanceof IDBRequest)return function(e){const t=new Promise(((t,n)=>{const r=()=>{e.removeEventListener("success",o),e.removeEventListener("error",i)},o=()=>{t(d(e.result)),r()},i=()=>{n(e.error),r()};e.addEventListener("success",o),e.addEventListener("error",i)}));return t.then((t=>{t instanceof IDBCursor&&o.set(t,e)})).catch((()=>{})),c.set(t,e),t}(e);if(s.has(e))return s.get(e);const t=f(e);return t!==e&&(s.set(e,t),c.set(t,e)),t}const p=e=>c.get(e);function h(e,t,{blocked:n,upgrade:r,blocking:o,terminated:i}={}){const a=indexedDB.open(e,t),s=d(a);return r&&a.addEventListener("upgradeneeded",(e=>{r(d(a.result),e.oldVersion,e.newVersion,d(a.transaction))})),n&&a.addEventListener("blocked",(()=>n())),s.then((e=>{i&&e.addEventListener("close",(()=>i())),o&&e.addEventListener("versionchange",(()=>o()))})).catch((()=>{})),s}const v=["get","getKey","getAll","getAllKeys","count"],b=["put","add","delete","clear"],y=new Map;function g(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!=typeof t)return;if(y.get(t))return y.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,o=b.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!o&&!v.includes(n))return;const i=async function(e,...t){const i=this.transaction(e,o?"readwrite":"readonly");let a=i.store;return r&&(a=a.index(t.shift())),(await Promise.all([a[n](...t),o&&i.done]))[0]};return y.set(t,i),i}function m(){return e(this,void 0,void 0,(function(){return t(this,(function(e){switch(e.label){case 0:return[4,h("magicbell")];case 1:return[2,e.sent()]}}))}))}function w(n,r){return e(this,void 0,void 0,(function(){var e,o;return t(this,(function(t){switch(t.label){case 0:return[4,m()];case 1:return[4,t.sent().transaction(r).store.openCursor()];case 2:return[4,null==(e=t.sent())?void 0:e.advance(n)];case 3:return[2,(null==(o=t.sent())?void 0:o.value)||null]}}))}))}u=(e=>({...e,get:(t,n,r)=>g(t,n)||e.get(t,n,r),has:(t,n)=>!!g(t,n)||e.has(t,n)}))(u);var E=function e(t){function n(e,t,r){var o,i={};if(Array.isArray(e))return e.concat(t);for(o in e)i[r?o.toLowerCase():o]=e[o];for(o in t){var a=r?o.toLowerCase():o,s=t[o];i[a]=a in i&&"object"==typeof s?n(i[a],s,"headers"===a):s}return i}function r(e,r,o,i){"string"!=typeof e&&(e=(r=e).url);var a={config:r},s=n(t,r),c={},u=i||s.data;(s.transformRequest||[]).map((function(e){u=e(u,s.headers)||u})),u&&"object"==typeof u&&"function"!=typeof u.append&&(u=JSON.stringify(u),c["content-type"]="application/json");var l="undefined"!=typeof document&&document.cookie.match(RegExp("(^|; )"+s.xsrfCookieName+"=([^;]*)"));if(l&&(c[s.xsrfHeaderName]=l[2]),s.auth&&(c.authorization=s.auth),s.baseURL&&(e=e.replace(/^(?!.*\/\/)\/?(.*)$/,s.baseURL+"/$1")),s.params){var f=~e.indexOf("?")?"&":"?";e+=f+(s.paramsSerializer?s.paramsSerializer(s.params):new URLSearchParams(s.params))}return(s.fetch||fetch)(e,{method:o||s.method,body:u,headers:n(s.headers,c,!0),credentials:s.withCredentials?"include":"same-origin"}).then((function(e){for(var t in e)"function"!=typeof e[t]&&(a[t]=e[t]);var n=s.validateStatus?s.validateStatus(e.status):e.ok;return"stream"==s.responseType?(a.data=e.body,a):e[s.responseType||"text"]().then((function(e){a.data=e,a.data=JSON.parse(e)})).catch(Object).then((function(){return n?a:Promise.reject(a)}))}))}return t=t||{},r.request=r,r.get=function(e,t){return r(e,t,"get")},r.delete=function(e,t){return r(e,t,"delete")},r.head=function(e,t){return r(e,t,"head")},r.options=function(e,t){return r(e,t,"options")},r.post=function(e,t,n){return r(e,n,"post",t)},r.put=function(e,t,n){return r(e,n,"put",t)},r.patch=function(e,t,n){return r(e,n,"patch",t)},r.all=Promise.all.bind(Promise),r.spread=function(e){return function(t){return e.apply(this,t)}},r.CancelToken="function"==typeof AbortController?AbortController:Object,r.defaults=t,r.create=e,r}();function L(e){return null==e}function I(e,t){var n=function(e){for(var t=(e+"=".repeat((4-e.length%4)%4)).replace(/-/g,"+").replace(/_/g,"/"),n=window.atob(t),r=new Uint8Array(n.length),o=0;o<n.length;++o)r[o]=n.charCodeAt(o);return r}(t);return e.subscribe({userVisibleOnly:!0,applicationServerKey:n})}const CACHE_NAME = 'spenny-pwa-v1';
const STATIC_ASSETS = [
  '/offline.html',
  '/siteicon.png',
  '/favicon.svg',
  '/logo.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

self.addEventListener("install", (function(e) {
  self.skipWaiting();
  console.log("MagicBellSW:install");
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("PWA pre-cache warning:", err);
      });
    })
  );
}));
//# sourceMappingURL=sw.js.map

// ================================================================
// BYPASS SEO FILES & OFFLINE FALLBACK
// ================================================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Never cache sitemap or robots
  if (url.pathname.endsWith('sitemap.xml') || url.pathname.endsWith('robots.txt') || url.pathname.includes('sitemap')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Handle navigation requests when offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html').then((response) => {
          if (response) return response;
          return fetch('/offline.html');
        });
      })
    );
  }
});