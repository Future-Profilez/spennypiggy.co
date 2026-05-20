import{r as d,j as s,a as f}from"./app-6w6D5hzZ.js";import{u as c}from"./Alerts-Dr0Ls_jf.js";import"./index-DnWaWRp6.js";try{let e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},r=new e.Error().stack;r&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[r]="99e1770f-a915-41b3-bffc-3639a40f834c",e._sentryDebugIdIdentifier="sentry-dbid-99e1770f-a915-41b3-bffc-3639a40f834c")}catch{}function m({id:e,type:r}){const{successAlert:a,errorAlert:i}=c(),[o,n]=d.useState(!1),l=()=>{n(!0),f.get(`twitter/share/${e}/${r}`).then(t=>{t.data.status?a(t.data.msg):i(t.data.msg),n(!1)}).catch(t=>{console.error("error",t),n(!1)})};return s.jsxs(s.Fragment,{children:[s.jsx("style",{children:`
    .twiiter-share:hover { 
      color:#000 !important;
    } 
    `}),s.jsx("button",{onClick:l,className:"twiiter-share text-normal  text-primary mt-3",disabled:o,children:o?"Posting on twitter...":"Announce on twitter"})]})}export{m as default};
