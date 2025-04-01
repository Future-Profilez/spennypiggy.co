import{r as a,j as r}from"./app-6b585e63.js";import*as c from"https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.25.0/web/lr-cloud-image-editor.min.js";function m({uuid:t,updateFile:o,setIsEditable:s}){return a.useEffect(()=>{c.registerBlocks(c);const n=d=>i=>{o&&o(i.detail,t),s&&s(!1)},e=document.querySelector("#my-editor");return e&&e.addEventListener("apply",n()),e&&e.addEventListener("cancel",n()),()=>{e&&e.removeEventListener("apply",n()),e&&e.removeEventListener("cancel",n())}},[t]),r.jsxs(r.Fragment,{children:[r.jsx("style",{children:`
          body {
            height: 100vh;
            width: 100vw;
            margin: 0;
          }
        `}),t?r.jsxs("div",{className:"image-editor border rounded-4 overflow-hidden",children:[r.jsx("lr-config",{"ctx-name":"my-editor"}),r.jsx("lr-cloud-image-editor",{id:"my-editor","ctx-name":"my-editor","css-src":"https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.25.0/web/lr-cloud-image-editor.min.css",uuid:t})]}):""]})}export{m as U};
