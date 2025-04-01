import{q as r,r as o,j as e,b as s}from"./app-6b585e63.js";function p(){const{ziggy:a}=r().props,[i,n]=o.useState("");return o.useEffect(()=>{(async()=>{try{await s.get("https://ipapi.co/json/").then(t=>{a&&a.url==="https://spennypiggy.co"&&t.data&&t.data.country_code=="GB"&&(n("https://uk.spennypiggy.co"),setTimeout(()=>{window.location="https://uk.spennypiggy.co/register"},3e3)),a&&a.url==="https://uk.spennypiggy.co"&&t.data&&t.data.country_code!=="GB"&&(n("https://spennypiggy.co"),setTimeout(()=>{window.location="https://spennypiggy.co/register"},3e3))}).catch(t=>{console.error("api err",t)})}catch(t){console.error("Error fetching data:",t)}})()},[]),e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
    `}),e.jsx("div",{className:"redirect-page bg-white p-5",children:e.jsxs("div",{children:[e.jsx("div",{className:"loader-item",children:e.jsx("div",{className:"loader loader-3"})}),i?"":e.jsxs("h2",{className:"redirection-text text-center m-auto px-4  border-0 table mt-3 text-large",children:["Redirecting to ",i," "]})]})})]})}export{p as default};
