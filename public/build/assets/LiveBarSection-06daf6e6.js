import{r as o,j as e}from"./app-6b585e63.js";import p from"./LiveBar-3ec56a4a.js";import{b as t}from"./index-548b7423.js";import"./emotion-unitless.esm-7c38d562.js";const n="/build/assets/spennys-237e6709.png",h="/build/assets/instagram-a1eab7b4.png",u="/build/assets/youtube-28a95c06.png",g="/build/assets/twitch-6b62f1e5.png",b="/build/assets/tiktok-38c57bbc.png",f="/build/assets/x-41548ad2.png",j=({images:r,text:l,classes:c})=>{const[d,s]=o.useState(!1),[x,a]=o.useState(null),m=()=>{a(!x),s(!0)},i=()=>{a(!1),s(!1)};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
    .lightbox-overlay {
      background: #000000b5;
      position: fixed;
      z-index: 99;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
  }

  button.closelightbox{position:absolute;top:-27px;right:-17px;z-index:11;color:#fff;font-size:29px;
    background:#1c1c1c;width:42px;height:39px;line-height:36px;border-radius:10px;}
    .lightbox-content iframe {
      min-height: 396px;
      width: 700px;
  }
  .lightbox-content {
    position: relative; max-width: 700px;
    width: 100%;
    
}

@media(max-width:767px){
  .lightbox-content iframe {
    min-height: 396px;
    width: 100%;
}
button.closelightbox {
  top: 20px;
  position: fixed;
  right: 20px;
}
}

  `}),e.jsxs("div",{children:[e.jsx("button",{className:c,onClick:()=>m(r[0]),children:l}),d&&e.jsx("div",{className:"lightbox-overlay",onClick:i,children:e.jsxs("div",{className:"lightbox-content p-3",children:[e.jsx("iframe",{src:"https://player.vimeo.com/video/969527099?badge=0&autopause=0&player_id=0&app_id=58479",frameborder:"0",allow:"autoplay; fullscreen; picture-in-picture",allowfullscreen:!0}),e.jsx("button",{className:"closelightbox",onClick:i,children:"×"})]})})]})]})},v=j;function z(){return e.jsxs("div",{className:"lightpink-50 pt-4",children:[e.jsx("p",{className:"text-uppercase pt-3 pt-md-5  text-center",children:"Built for creators of all platforms "}),e.jsxs("div",{className:"d-flex flex-wrap justify-content-center mt-4 align-items-center creators-platforms",children:[e.jsx("div",{"data-aos":"zoom-in",className:"px-4 py-2",children:e.jsx(t.LazyLoadImage,{alt:"image",useIntersectionObserver:!0,effect:"blur",className:"",src:b,width:190})}),e.jsx("div",{"data-aos":"zoom-in",className:"px-4 py-2",children:e.jsx(t.LazyLoadImage,{alt:"image",useIntersectionObserver:!0,effect:"blur",className:"",src:f,width:190})}),e.jsx("div",{"data-aos":"zoom-in",className:"px-4 py-2",children:e.jsx(t.LazyLoadImage,{alt:"image",useIntersectionObserver:!0,effect:"blur",className:"",src:u,width:190})}),e.jsx("div",{"data-aos":"zoom-in",className:"px-4 py-2",children:e.jsx(t.LazyLoadImage,{alt:"image",useIntersectionObserver:!0,effect:"blur",className:"",src:h,width:190})}),e.jsx("div",{"data-aos":"zoom-in",className:"px-4 py-2",children:e.jsx(t.LazyLoadImage,{alt:"image",useIntersectionObserver:!0,effect:"blur",className:"",src:g,width:190})})]}),e.jsx("div",{className:"w-100 livebarsections-hidden ",children:e.jsxs("div",{className:" livebarsections pt-0 pt-md-5 mt-4 ",children:[e.jsxs("div",{className:"container px-4 w-100",children:[e.jsx("h2",{className:"headingSm shadow-none text-dark stroke-none text-center mb-3 pt-4 pt-lg-0  ",children:"What is spenny Piggy ?"}),e.jsx(v,{classes:"m-auto d-table",text:e.jsx(e.Fragment,{children:e.jsx("div",{"data-aos":"zoom-out",className:"videoBg w-100 mt-5 rounded-5 shadow-voilet",children:e.jsx("img",{alt:"image",className:"rounded-5 shadow-voilet",src:n})})}),images:[{src:n}]}),e.jsx("p",{className:"text-center mt-4",children:"*all transactions provide exclusive content or member only access."})]}),e.jsx(p,{classes:"barouter mt-2 mt-md-5 pt-4",text:"💰⚡ Fast & Easy payments through: Apple pay, Cashapp Pay "})]})})]})}export{z as default};
