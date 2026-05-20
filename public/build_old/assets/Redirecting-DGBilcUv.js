import{X as r,r as o,j as a,a as s}from"./app-6w6D5hzZ.js";try{let e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},i=new e.Error().stack;i&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[i]="ed823cf3-1daf-4f8c-a34f-a4cca554f3f2",e._sentryDebugIdIdentifier="sentry-dbid-ed823cf3-1daf-4f8c-a34f-a4cca554f3f2")}catch{}function p(){const{ziggy:e}=r().props,[i,n]=o.useState("");return o.useEffect(()=>{(async()=>{try{await s.get("https://ipapi.co/json/").then(t=>{e&&e.url==="https://spennypiggy.co"&&t.data&&t.data.country_code=="GB"&&(n("https://uk.spennypiggy.co"),setTimeout(()=>{window.location="https://uk.spennypiggy.co/register"},3e3)),e&&e.url==="https://uk.spennypiggy.co"&&t.data&&t.data.country_code!=="GB"&&(n("https://spennypiggy.co"),setTimeout(()=>{window.location="https://spennypiggy.co/register"},3e3))}).catch(t=>{console.error("api err",t)})}catch(t){console.error("Error fetching data:",t)}})()},[]),a.jsxs(a.Fragment,{children:[a.jsx("style",{children:`
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
    `}),a.jsx("div",{className:"redirect-page bg-white p-5",children:a.jsxs("div",{children:[a.jsx("div",{className:"loader-item",children:a.jsx("div",{className:"loader loader-3"})}),i?"":a.jsxs("h2",{className:"redirection-text text-center m-auto px-4  border-0 table mt-3 text-large",children:["Redirecting to ",i," "]})]})})]})}export{p as default};
