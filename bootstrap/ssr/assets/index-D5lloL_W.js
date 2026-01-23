import{r as d}from"../ssr.mjs";try{let e=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},t=new e.Error().stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="b7af6b6e-a76e-4f0a-af6d-2b7c7fe4b9c2",e._sentryDebugIdIdentifier="sentry-dbid-b7af6b6e-a76e-4f0a-af6d-2b7c7fe4b9c2")}catch{}let Z={data:""},q=e=>{if(typeof window=="object"){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||Z},K=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,Q=/\/\*[^]*?\*\/|  +/g,F=/\n+/g,x=(e,t)=>{let a="",s="",o="";for(let i in e){let r=e[i];i[0]=="@"?i[1]=="i"?a=i+" "+r+";":s+=i[1]=="f"?x(r,i):i+"{"+x(r,i[1]=="k"?"":t)+"}":typeof r=="object"?s+=x(r,t?t.replace(/([^,])+/g,n=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,n):n?n+" "+l:l)):i):r!=null&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=x.p?x.p(i,r):i+":"+r+";")}return a+(t&&o?t+"{"+o+"}":o)+s},h={},L=e=>{if(typeof e=="object"){let t="";for(let a in e)t+=a+L(e[a]);return t}return e},V=(e,t,a,s,o)=>{let i=L(e),r=h[i]||(h[i]=(l=>{let u=0,p=11;for(;u<l.length;)p=101*p+l.charCodeAt(u++)>>>0;return"go"+p})(i));if(!h[r]){let l=i!==e?e:(u=>{let p,c,f=[{}];for(;p=K.exec(u.replace(Q,""));)p[4]?f.shift():p[3]?(c=p[3].replace(F," ").trim(),f.unshift(f[0][c]=f[0][c]||{})):f[0][p[1]]=p[2].replace(F," ").trim();return f[0]})(e);h[r]=x(o?{["@keyframes "+r]:l}:l,a?"":"."+r)}let n=a&&h.g?h.g:null;return a&&(h.g=h[r]),((l,u,p,c)=>{c?u.data=u.data.replace(c,l):u.data.indexOf(l)===-1&&(u.data=p?l+u.data:u.data+l)})(h[r],t,s,n),r},W=(e,t,a)=>e.reduce((s,o,i)=>{let r=t[i];if(r&&r.call){let n=r(a),l=n&&n.props&&n.props.className||/^go/.test(n)&&n;r=l?"."+l:n&&typeof n=="object"?n.props?"":x(n,""):n===!1?"":n}return s+o+(r??"")},"");function O(e){let t=this||{},a=e.call?e(t.p):e;return V(a.unshift?a.raw?W(a,[].slice.call(arguments,1),t.p):a.reduce((s,o)=>Object.assign(s,o&&o.call?o(t.p):o),{}):a,q(t.target),t.g,t.o,t.k)}let M,N,A;O.bind({g:1});let v=O.bind({k:1});function G(e,t,a,s){x.p=t,M=e,N=a,A=s}function w(e,t){let a=this||{};return function(){let s=arguments;function o(i,r){let n=Object.assign({},i),l=n.className||o.className;a.p=Object.assign({theme:N&&N()},n),a.o=/ *go\d+/.test(l),n.className=O.apply(a,s)+(l?" "+l:"");let u=e;return e[0]&&(u=n.as||e,delete n.as),A&&u[0]&&A(n),M(u,n)}return t?t(o):o}}var J=e=>typeof e=="function",I=(e,t)=>J(e)?e(t):e,X=(()=>{let e=0;return()=>(++e).toString()})(),S=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),ee=20,T="default",H=(e,t)=>{let{toastLimit:a}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,a)};case 1:return{...e,toasts:e.toasts.map(r=>r.id===t.toast.id?{...r,...t.toast}:r)};case 2:let{toast:s}=t;return H(e,{type:e.toasts.find(r=>r.id===s.id)?1:0,toast:s});case 3:let{toastId:o}=t;return{...e,toasts:e.toasts.map(r=>r.id===o||o===void 0?{...r,dismissed:!0,visible:!1}:r)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(r=>r.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let i=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(r=>({...r,pauseDuration:r.pauseDuration+i}))}}},C=[],R={toasts:[],pausedAt:void 0,settings:{toastLimit:ee}},b={},B=(e,t=T)=>{b[t]=H(b[t]||R,e),C.forEach(([a,s])=>{a===t&&s(b[t])})},U=e=>Object.keys(b).forEach(t=>B(e,t)),te=e=>Object.keys(b).find(t=>b[t].toasts.some(a=>a.id===e)),j=(e=T)=>t=>{B(t,e)},ae={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},re=(e={},t=T)=>{let[a,s]=d.useState(b[t]||R),o=d.useRef(b[t]);d.useEffect(()=>(o.current!==b[t]&&s(b[t]),C.push([t,s]),()=>{let r=C.findIndex(([n])=>n===t);r>-1&&C.splice(r,1)}),[t]);let i=a.toasts.map(r=>{var n,l,u;return{...e,...e[r.type],...r,removeDelay:r.removeDelay||((n=e[r.type])==null?void 0:n.removeDelay)||e?.removeDelay,duration:r.duration||((l=e[r.type])==null?void 0:l.duration)||e?.duration||ae[r.type],style:{...e.style,...(u=e[r.type])==null?void 0:u.style,...r.style}}});return{...a,toasts:i}},se=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:a?.id||X()}),E=e=>(t,a)=>{let s=se(t,e,a);return j(s.toasterId||te(s.id))({type:2,toast:s}),s.id},m=(e,t)=>E("blank")(e,t);m.error=E("error");m.success=E("success");m.loading=E("loading");m.custom=E("custom");m.dismiss=(e,t)=>{let a={type:3,toastId:e};t?j(t)(a):U(a)};m.dismissAll=e=>m.dismiss(void 0,e);m.remove=(e,t)=>{let a={type:4,toastId:e};t?j(t)(a):U(a)};m.removeAll=e=>m.remove(void 0,e);m.promise=(e,t,a)=>{let s=m.loading(t.loading,{...a,...a?.loading});return typeof e=="function"&&(e=e()),e.then(o=>{let i=t.success?I(t.success,o):void 0;return i?m.success(i,{id:s,...a,...a?.success}):m.dismiss(s),o}).catch(o=>{let i=t.error?I(t.error,o):void 0;i?m.error(i,{id:s,...a,...a?.error}):m.dismiss(s)}),e};var ie=1e3,oe=(e,t="default")=>{let{toasts:a,pausedAt:s}=re(e,t),o=d.useRef(new Map).current,i=d.useCallback((c,f=ie)=>{if(o.has(c))return;let g=setTimeout(()=>{o.delete(c),r({type:4,toastId:c})},f);o.set(c,g)},[]);d.useEffect(()=>{if(s)return;let c=Date.now(),f=a.map(g=>{if(g.duration===1/0)return;let k=(g.duration||0)+g.pauseDuration-(c-g.createdAt);if(k<0){g.visible&&m.dismiss(g.id);return}return setTimeout(()=>m.dismiss(g.id,t),k)});return()=>{f.forEach(g=>g&&clearTimeout(g))}},[a,s,t]);let r=d.useCallback(j(t),[t]),n=d.useCallback(()=>{r({type:5,time:Date.now()})},[r]),l=d.useCallback((c,f)=>{r({type:1,toast:{id:c,height:f}})},[r]),u=d.useCallback(()=>{s&&r({type:6,time:Date.now()})},[s,r]),p=d.useCallback((c,f)=>{let{reverseOrder:g=!1,gutter:k=8,defaultPosition:_}=f||{},$=a.filter(y=>(y.position||_)===(c.position||_)&&y.height),Y=$.findIndex(y=>y.id===c.id),P=$.filter((y,z)=>z<Y&&y.visible).length;return $.filter(y=>y.visible).slice(...g?[P+1]:[0,P]).reduce((y,z)=>y+(z.height||0)+k,0)},[a]);return d.useEffect(()=>{a.forEach(c=>{if(c.dismissed)i(c.id,c.removeDelay);else{let f=o.get(c.id);f&&(clearTimeout(f),o.delete(c.id))}})},[a,i]),{toasts:a,handlers:{updateHeight:l,startPause:n,endPause:u,calculateOffset:p}}},ne=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,le=v`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,de=v`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ce=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ne} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${le} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${de} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,ue=v`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,pe=w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${ue} 1s linear infinite;
`,fe=v`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,me=v`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,ge=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${fe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${me} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,ye=w("div")`
  position: absolute;
`,be=w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,he=v`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ve=w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${he} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,xe=({toast:e})=>{let{icon:t,type:a,iconTheme:s}=e;return t!==void 0?typeof t=="string"?d.createElement(ve,null,t):t:a==="blank"?null:d.createElement(be,null,d.createElement(pe,{...s}),a!=="loading"&&d.createElement(ye,null,a==="error"?d.createElement(ce,{...s}):d.createElement(ge,{...s})))},we=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Ee=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,ke="0%{opacity:0;} 100%{opacity:1;}",De="0%{opacity:1;} 100%{opacity:0;}",Ce=w("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Ie=w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Oe=(e,t)=>{let a=e.includes("top")?1:-1,[s,o]=S()?[ke,De]:[we(a),Ee(a)];return{animation:t?`${v(s)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${v(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},je=d.memo(({toast:e,position:t,style:a,children:s})=>{let o=e.height?Oe(e.position||t||"top-center",e.visible):{opacity:0},i=d.createElement(xe,{toast:e}),r=d.createElement(Ie,{...e.ariaProps},I(e.message,e));return d.createElement(Ce,{className:e.className,style:{...o,...a,...e.style}},typeof s=="function"?s({icon:i,message:r}):d.createElement(d.Fragment,null,i,r))});G(d.createElement);var $e=({id:e,className:t,style:a,onHeightUpdate:s,children:o})=>{let i=d.useCallback(r=>{if(r){let n=()=>{let l=r.getBoundingClientRect().height;s(e,l)};n(),new MutationObserver(n).observe(r,{subtree:!0,childList:!0,characterData:!0})}},[e,s]);return d.createElement("div",{ref:i,className:t,style:a},o)},ze=(e,t)=>{let a=e.includes("top"),s=a?{top:0}:{bottom:0},o=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:S()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(a?1:-1)}px)`,...s,...o}},Ne=O`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,D=16,Te=({reverseOrder:e,position:t="top-center",toastOptions:a,gutter:s,children:o,toasterId:i,containerStyle:r,containerClassName:n})=>{let{toasts:l,handlers:u}=oe(a,i);return d.createElement("div",{"data-rht-toaster":i||"",style:{position:"fixed",zIndex:9999,top:D,left:D,right:D,bottom:D,pointerEvents:"none",...r},className:n,onMouseEnter:u.startPause,onMouseLeave:u.endPause},l.map(p=>{let c=p.position||t,f=u.calculateOffset(p,{reverseOrder:e,gutter:s,defaultPosition:t}),g=ze(c,f);return d.createElement($e,{id:p.id,key:p.id,onHeightUpdate:u.updateHeight,className:p.visible?Ne:"",style:g},p.type==="custom"?I(p.message,p):o?o(p):d.createElement(je,{toast:p,position:c}))}))},_e=m;export{Te as F,m as n,_e as z};
