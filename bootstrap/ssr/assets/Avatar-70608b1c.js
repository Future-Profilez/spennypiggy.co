import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
function Avatar({ src, name, username, subhead, url, link }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { children: `
         .avatar{ border:1px solid #fff; width:60px;height:60px;max-width:60px;max-height:60px;border-radius:13px;overflow:hidden;}
         .avatar img{width:100%;height:100%;object-fit:cover;}
         .useravatar{display:flex;align-items:center;}
         .avatar-content{margin-left:13px; }
         .avatar-content p{margin-bottom:0; font-size:16px;}
         .avatar-content h2{margin-bottom:2px;font-size:18px;}
      ` }),
    username ? /* @__PURE__ */ jsx("div", { className: "avatar-wrap", children: /* @__PURE__ */ jsxs(Link, { href: url ? url : `/${link ? link : username}`, className: "useravatar", children: [
      /* @__PURE__ */ jsx("div", { className: "avatar", children: /* @__PURE__ */ jsx("img", { src, alt: "image-avatar", className: "img-fluid" }) }),
      /* @__PURE__ */ jsxs("div", { className: "avatar-content", children: [
        /* @__PURE__ */ jsx("h2", { children: name }),
        /* @__PURE__ */ jsx("p", { children: subhead ? subhead : username })
      ] })
    ] }) }) : /* @__PURE__ */ jsx("div", { className: "avatar-wrap", children: /* @__PURE__ */ jsxs("div", { className: "useravatar", children: [
      /* @__PURE__ */ jsx("div", { className: "avatar", children: /* @__PURE__ */ jsx("img", { src, alt: "image-avatar", className: "img-fluid" }) }),
      /* @__PURE__ */ jsxs("div", { className: "avatar-content", children: [
        /* @__PURE__ */ jsx("h2", { children: name }),
        subhead ? /* @__PURE__ */ jsx("p", { children: subhead ? subhead : "username" }) : ""
      ] })
    ] }) })
  ] });
}
export {
  Avatar as A
};
