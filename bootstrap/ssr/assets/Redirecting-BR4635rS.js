import{j as i}from"./jsx-runtime-Bl6Tqipi.js";import{X as r,r as n,a as s}from"../ssr.js";import"util";import"stream";import"path";import"http";import"https";import"url";import"fs";import"crypto";import"http2";import"assert";import"tty";import"os";import"zlib";import"events";import"process";try{let t=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},a=new t.Error().stack;a&&(t._sentryDebugIds=t._sentryDebugIds||{},t._sentryDebugIds[a]="4933dcec-1170-4196-b340-186967b291b6",t._sentryDebugIdIdentifier="sentry-dbid-4933dcec-1170-4196-b340-186967b291b6")}catch{}function _(){const{ziggy:t}=r().props,[a,o]=n.useState("");return n.useEffect(()=>{(async()=>{try{await s.get("https://ipapi.co/json/").then(e=>{t&&t.url==="https://spennypiggy.co"&&e.data&&e.data.country_code=="GB"&&(o("https://uk.spennypiggy.co"),setTimeout(()=>{window.location="https://uk.spennypiggy.co/register"},3e3)),t&&t.url==="https://uk.spennypiggy.co"&&e.data&&e.data.country_code!=="GB"&&(o("https://spennypiggy.co"),setTimeout(()=>{window.location="https://spennypiggy.co/register"},3e3))}).catch(e=>{console.error("api err",e)})}catch(e){console.error("Error fetching data:",e)}})()},[]),i.jsxs(i.Fragment,{children:[i.jsx("style",{children:`
    .redirect-page{height:100vh;display:flex;align-items:center;justify-content:center;}
    .loader{width:30px;height:30px;position:relative;margin:auto;}
    .loader::before,.loader::after{content:"";position:absolute;}
    .loader-3::before,.loader-3::after{border-radius:50%;-webkit-animation-duration:1s;animation-duration:1s;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out;-webkit-animation-iteration-count:infinite;animation-iteration-count:infinite;}
    .loader-3::before{width:16px;height:16px;top:calc(50% - 8px);left:calc(50% - 8px);border-bottom-right-radius:0;box-shadow:0 0 0 2px #000;background:radial-gradient(transparent 0,black 3px,#fff 3px);transform:rotate(45deg);-webkit-animation-name:mapPin;animation-name:mapPin;}
    .loader-3::after{width:10px;height:5px;opacity:0.8;top:100%;left:calc(50% - 4px);background:#000;-webkit-animation-name:mapPinShadow;animation-name:mapPinShadow;}
    @-webkit-keyframes mapPin{
      50%{transform:rotate(45deg) translate(-50%,-50%);}
    }
    @keyframes mapPin{
      50%{transform:rotate(45deg) translate(-50%,-50%);}
    }
    @-webkit-keyframes mapPinShadow{
      50%{transform:scaleX(3);opacity:0.2;}
    }
    @keyframes mapPinShadow{
      50%{transform:scaleX(3);opacity:0.2;}
    }
    `}),i.jsx("div",{className:"redirect-page bg-white p-5",children:i.jsxs("div",{children:[i.jsx("div",{className:"loader-item",children:i.jsx("div",{className:"loader loader-3"})}),a?"":i.jsxs("h2",{className:"redirection-text text-center m-auto px-4  border-0 table mt-3 text-large",children:["Redirecting to ",a," "]})]})})]})}export{_ as default};
