import{j as e,x as f}from"./app-6w6D5hzZ.js";import{u as i}from"./siteicon-C45idYI1.js";import{a as g}from"./index-DZN9QAIC.js";import{F as b}from"./FounderBadge-XVedHzoh.js";try{let a=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},t=new a.Error().stack;t&&(a._sentryDebugIds=a._sentryDebugIds||{},a._sentryDebugIds[t]="332be32f-b765-4ded-87f2-d7c8c405c60b",a._sentryDebugIdIdentifier="sentry-dbid-332be32f-b765-4ded-87f2-d7c8c405c60b")}catch{}function y({hidename:a,src:t,role:l,profile_status_lock:c,imageSrc:r,name:d,username:o,subhead:s,url:p,link:x,is_founder:h,onClick:m}){return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
      `}),o?e.jsx("div",{className:"avatar-wrap",children:e.jsxs(f,{href:p||`/${x||o}`,className:"useravatar",onClick:m,children:[e.jsxs("div",{className:"avatar !overflow-visible relative ",children:[e.jsx("img",{src:r||t||i,alt:"image-avatar",className:"img-fluid rounded-[12px] bg-gray-200",loading:"lazy",decoding:"async",style:{width:"100%",height:"100%",objectFit:"cover",position:"absolute",top:0,left:0},onError:n=>{console.warn("Avatar image failed to load:",r||t),n.target.src=i}}),l&&c&&(h?e.jsx(b,{classes:"w-6 h-6 absolute top-[-5px] right-[-5px] bg-white !shadow-xl border border-2 !border-[#eab308] rounded-full p-[2px]",icon:!0}):e.jsx(g,{size:"1.5rem",className:"text-pink absolute top-[-5px] right-[-5px] bg-gray-100 !shadow-xl rounded-full border border-2 !border-pink-500 rounded-full p-[1px]"}))]}),a?"":e.jsx(e.Fragment,{children:e.jsxs("div",{className:"avatar-content",children:[e.jsx("h2",{className:"flex items-center gap-1 capitalize",children:e.jsx("span",{className:"line-clamp-1 ",children:d})}),e.jsx("p",{className:"text-gray-500",children:s||o})]})})]})}):e.jsx("div",{className:"avatar-wrap",children:e.jsxs("div",{className:"useravatar",children:[e.jsx("div",{className:"avatar",children:e.jsx("img",{src:r||t||i,alt:"image-avatar",className:"img-fluid",loading:"lazy",decoding:"async",style:{width:"100%",height:"100%",objectFit:"cover",position:"absolute",top:0,left:0},onError:n=>{console.warn("Avatar image failed to load:",r||t),n.target.src=i}})}),e.jsxs("div",{className:"avatar-content",children:[e.jsx("h2",{children:d}),s&&e.jsx("p",{className:"",children:s})]})]})})]})}export{y as A};
