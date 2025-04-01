import{j as a,d as l}from"./app-6b585e63.js";import{b as c}from"./index-548b7423.js";import{u as o}from"./userphoto-1c7c9586.js";function v({src:e,imageSrc:s,name:i,username:t,subhead:r,url:n,link:d}){return a.jsxs(a.Fragment,{children:[a.jsx("style",{children:`
      .avatar { border:1px solid #fff;width:60px;height:60px;max-width:60px;max-height:60px;border-radius:13px;overflow:hidden;}
      .avatar img{width:100%;height:100%;object-fit:cover;}
      .useravatar{width:fit-content;display:flex;align-items:center;}
      .avatar-content{margin-left:13px;}
      .avatar-content p{margin-bottom:0;font-size:16px;}
      .avatar-content h2{margin-bottom:2px;font-size:18px;}
      `}),t?a.jsx("div",{className:"avatar-wrap",children:a.jsxs(l,{href:n||`/${d||t}`,className:"useravatar",children:[a.jsx("div",{className:"avatar",children:a.jsx(c.LazyLoadImage,{src:s||e||o,alt:"image-avatar",className:"img-fluid",useIntersectionObserver:!0,effect:"blur",height:100,width:100})}),a.jsxs("div",{className:"avatar-content",children:[a.jsx("h2",{children:i}),a.jsx("p",{children:r||t})]})]})}):a.jsx("div",{className:"avatar-wrap",children:a.jsxs("div",{className:"useravatar",children:[a.jsx("div",{className:"avatar",children:a.jsx("img",{src:s||e,alt:"image-avatar",className:"img-fluid"})}),a.jsxs("div",{className:"avatar-content",children:[a.jsx("h2",{children:i}),r&&a.jsx("p",{children:r})]})]})})]})}export{v as A};
