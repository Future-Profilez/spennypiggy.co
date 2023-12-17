import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import "react-lazy-load-image-component";
import TrustBox from "./TrustBox-61d46987.js";
import "react-helmet";
const addwishlistimg = "/build/assets/addwishlistimg-1face4e5.png";
function Hero({ auth }) {
  var _a, _b;
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("div", { className: "heroSec", children: /* @__PURE__ */ jsx("div", { className: "containerbox", children: /* @__PURE__ */ jsxs("div", { className: "welcome", children: [
    /* @__PURE__ */ jsxs("div", { className: "welcomeLeft", children: [
      /* @__PURE__ */ jsxs("h2", { className: "welcomeHeading shadow-yellow font-GillSans text-uppercase mb-1", children: [
        "Oink! Oink! ",
        /* @__PURE__ */ jsx("br", {}),
        " B*tch",
        " "
      ] }),
      /* @__PURE__ */ jsx("h3", { className: "welcomeTitle shadow-yellow text-uppercase font-GillSans mb-20", children: "Get Your Lifestyle funded! 🎁" }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 wishlistbtn wishlistbtnFixed rotate-btn", children: ((_a = auth == null ? void 0 : auth.user) == null ? void 0 : _a.username) ? /* @__PURE__ */ jsx(Link, { href: `/${auth && (auth == null ? void 0 : auth.user) && ((_b = auth == null ? void 0 : auth.user) == null ? void 0 : _b.username) || ""}`, className: "btn-pink wishlistbutton lg w-2/5 shadow-mint border-mint log", children: " My Wishlist " }) : /* @__PURE__ */ jsx(Link, { href: "/register", className: "btn-pink wishlistbutton lg w-2/5 shadow-mint border-mint", children: " Create Wishlist " }) }),
      /* @__PURE__ */ jsx("div", { className: "itsfree mt-4 ps-24", children: "It’s Free 🎉" }),
      /* @__PURE__ */ jsx(TrustBox, {})
    ] }),
    /* @__PURE__ */ jsx("div", { className: "welcomeRt", children: /* @__PURE__ */ jsx(
      "img",
      {
        alt: "image",
        height: 377.63,
        src: addwishlistimg,
        width: 474
      }
    ) })
  ] }) }) }) });
}
export {
  Hero as default
};
