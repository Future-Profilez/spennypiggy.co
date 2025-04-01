import{r as c,j as e,b as m}from"./app-6b585e63.js";import{u as d}from"./Alerts-91d62a11.js";import"./index-58c1a5a2.js";function f({id:o,type:a}){const{successAlert:n,errorAlert:i,errorsHandling:u}=d(),[s,r]=c.useState(!1),l=()=>{r(!0),m.get(`twitter/share/${o}/${a}`).then(t=>{t.data.status?n(t.data.msg):i(t.data.msg),r(!1)}).catch(t=>{console.error("error",t),r(!1)})};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
    .twiiter-share:hover { 
      color:#000 !important;
    } 
    `}),e.jsx("button",{onClick:l,className:"twiiter-share text-normal  text-primary mt-3",disabled:s,children:s?"Posting on twitter...":"Announce on twitter"})]})}export{f as default};
