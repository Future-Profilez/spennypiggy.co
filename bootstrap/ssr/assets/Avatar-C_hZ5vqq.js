import{j as a}from"./jsx-runtime-Bl6Tqipi.js";import{x as f}from"../ssr.js";import{u as i}from"./siteicon-C45idYI1.js";import{a as g}from"./index-Cw1BXoG3.js";import{F as b}from"./FounderBadge-DRdIIc9W.js";try{let e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},t=new e.Error().stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="af5b09d2-bbde-47b7-ba27-da0ae325cf41",e._sentryDebugIdIdentifier="sentry-dbid-af5b09d2-bbde-47b7-ba27-da0ae325cf41")}catch{}function N({hidename:e,src:t,role:l,profile_status_lock:c,imageSrc:r,name:d,username:o,subhead:s,url:p,link:x,is_founder:h,onClick:m}){return a.jsxs(a.Fragment,{children:[a.jsx("style",{children:`
      .avatar { 
        border: 1px solid #fff;
        width: 60px;
        height: 60px;
        max-width: 60px;
        max-height: 60px;
        min-width: 60px;
        min-height: 60px;
        border-radius: 13px;
        overflow: hidden;
        position: relative;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .avatar img,
      .avatar picture,
      .avatar > div {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
      .avatar .relative {
        position: absolute !important;
        width: 100% !important;
        height: 100% !important;
      }
      .useravatar {
        width: fit-content;
        display: flex;
        align-items: center;
        text-decoration: none;
      }
      .avatar-content {
        margin-left: 13px;
        flex: 1;
        min-width: 0;
      }
      .avatar-content p {
        margin-bottom: 0;
        font-size: 16px;
        word-wrap: break-word;
      }
      .avatar-content h2 {
        margin-bottom: 2px;
        font-size: 18px;
        word-wrap: break-word;
      }
      `}),o?a.jsx("div",{className:"avatar-wrap",children:a.jsxs(f,{href:p||`/${x||o}`,className:"useravatar",onClick:m,children:[a.jsxs("div",{className:"avatar !overflow-visible relative ",children:[a.jsx("img",{src:r||t||i,alt:"image-avatar",className:"img-fluid rounded-[12px] bg-gray-200",loading:"lazy",decoding:"async",style:{width:"100%",height:"100%",objectFit:"cover",position:"absolute",top:0,left:0},onError:n=>{console.warn("Avatar image failed to load:",r||t),n.target.src=i}}),l&&c&&(h?a.jsx(b,{classes:"w-6 h-6 absolute top-[-5px] right-[-5px] bg-white !shadow-xl border border-2 !border-[#eab308] rounded-full p-[2px]",icon:!0}):a.jsx(g,{size:"1.5rem",className:"text-pink absolute top-[-5px] right-[-5px] bg-gray-100 !shadow-xl rounded-full border border-2 !border-pink-500 rounded-full p-[1px]"}))]}),e?"":a.jsx(a.Fragment,{children:a.jsxs("div",{className:"avatar-content",children:[a.jsx("h2",{className:"flex items-center gap-1 capitalize",children:a.jsx("span",{className:"line-clamp-1 ",children:d})}),a.jsx("p",{className:"text-gray-500",children:s||o})]})})]})}):a.jsx("div",{className:"avatar-wrap",children:a.jsxs("div",{className:"useravatar",children:[a.jsx("div",{className:"avatar",children:a.jsx("img",{src:r||t||i,alt:"image-avatar",className:"img-fluid",loading:"lazy",decoding:"async",style:{width:"100%",height:"100%",objectFit:"cover",position:"absolute",top:0,left:0},onError:n=>{console.warn("Avatar image failed to load:",r||t),n.target.src=i}})}),a.jsxs("div",{className:"avatar-content",children:[a.jsx("h2",{children:d}),s&&a.jsx("p",{className:"",children:s})]})]})})]})}export{N as A};
