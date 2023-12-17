import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
const noresultimg = "/build/assets/noresultimg-254855b9.png";
function Nocontent({ error, text, classes }) {
  return /* @__PURE__ */ jsxs("div", { className: `${classes} noResult flex justify-center items-center content-center flex-wrap p-4 blackbg`, children: [
    /* @__PURE__ */ jsx("div", { className: "noresultimg mb-5", children: /* @__PURE__ */ jsx("img", { alt: "img", src: noresultimg }) }),
    /* @__PURE__ */ jsx("h2", { className: "headingLg w-full text-center shadow-yellow mb-5", children: text }),
    error ? /* @__PURE__ */ jsx("div", { className: "rotate-btn", children: /* @__PURE__ */ jsx(Link, { href: "/", className: "btn-pink md w-52 border-mint shadow-mint", children: "Back to Home" }) }) : ""
  ] });
}
export {
  Nocontent as default
};
