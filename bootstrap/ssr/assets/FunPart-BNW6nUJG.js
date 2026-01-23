import{j as e}from"./jsx-runtime-BJoFowxM.js";import{b as m}from"./index-Dkg_mdYq.js";import"../ssr.mjs";import"util";import"stream";import"path";import"http";import"https";import"url";import"fs";import"crypto";import"http2";import"assert";import"tty";import"os";import"zlib";import"events";import"process";try{let t=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},o=new t.Error().stack;o&&(t._sentryDebugIds=t._sentryDebugIds||{},t._sentryDebugIds[o]="fa1c61ac-2f46-4ce9-b7b1-6515a4d33690",t._sentryDebugIdIdentifier="sentry-dbid-fa1c61ac-2f46-4ce9-b7b1-6515a4d33690")}catch{}const c="/build/assets/seeksearch-CGztpZW3.png";function F({imgbg:t,textcolor:o,mainbg:s,textbg:r,heading:n,eclasses:a,text:f,img:l,classes:d,reverse:i}){return e.jsxs(e.Fragment,{children:[e.jsx("style",{jsx:!0,children:`
    .box-s {
      border-${i?"right":"left"}: 2px solid #000;
      overflow: hidden; /* Prevent image from spilling out */
    }
    .image-container {
      width: 100%;
      height: 100%;
    }
    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: transparent !important; /* Remove image background if any */
    }
  `}),e.jsxs("div",{className:`${d} flex ${i?"col-reverse":""} ${s||"bg-black"} flex borderbox justify-between items-center relative`,children:[!s&&e.jsx("div",{className:"absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none",children:e.jsx("div",{className:`absolute ${i?"bottom-0 left-0":"top-0 right-0"} w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 floating-shape`})}),e.jsx("div",{className:` box-s ${a} ${i?"justify-content-start":"justify-content-end"} pb-0 w-50 relative`,children:e.jsx("div",{className:"image-container",children:e.jsx(m.LazyLoadImage,{alt:"image",className:"max-h-[600px]",effect:"blur",src:l||c})})}),e.jsx("div",{className:` box-e ${i?"justify-content-end":"justify-content-start"} w-50 p-4 ${r}`,children:e.jsx("div",{className:"max-width-500",children:e.jsx("h3",{className:`fading text-2xl md:text-4xl lg:text-5xl font-gulfs ${o||"text-white"} mb-3 uppercase leading-tight`,children:n})})})]})]})}export{F as default};
