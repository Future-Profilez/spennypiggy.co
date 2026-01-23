import{r as s}from"../ssr.mjs";try{let e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},t=new e.Error().stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="025a70cc-ec0c-470f-8f02-d63a42c8ac0a",e._sentryDebugIdIdentifier="sentry-dbid-025a70cc-ec0c-470f-8f02-d63a42c8ac0a")}catch{}/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),w=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,r,o)=>o?o.toUpperCase():r.toLowerCase()),i=e=>{const t=w(e);return t.charAt(0).toUpperCase()+t.slice(1)},d=(...e)=>e.filter((t,r,o)=>!!t&&t.trim()!==""&&o.indexOf(t)===r).join(" ").trim(),g=e=>{for(const t in e)if(t.startsWith("aria-")||t==="role"||t==="title")return!0};/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var y={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=s.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:r=2,absoluteStrokeWidth:o,className:n="",children:a,iconNode:l,...c},u)=>s.createElement("svg",{ref:u,...y,width:t,height:t,stroke:e,strokeWidth:o?Number(r)*24/Number(t):r,className:d("lucide",n),...!a&&!g(c)&&{"aria-hidden":"true"},...c},[...l.map(([f,p])=>s.createElement(f,p)),...Array.isArray(a)?a:[a]]));/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=(e,t)=>{const r=s.forwardRef(({className:o,...n},a)=>s.createElement(m,{ref:a,iconNode:t,className:d(`lucide-${h(i(e))}`,`lucide-${e}`,o),...n}));return r.displayName=i(e),r};/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],k=b("arrow-right",C);export{k as A,b as c};
