import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { D as DeviceID } from "./DeviceID-14747b9d.js";
import axios from "axios";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSelector, useDispatch } from "react-redux";
import { a as add_to_cart } from "../app.js";
import { C as ChangeCurrency } from "./ChangeCurrency-48153973.js";
import "react-dom/client";
import "@reduxjs/toolkit";
import "./Alerts-5da797d1.js";
import "react-hot-toast";
import "./LoaderButton-91d3595f.js";
import "react-select";
import "react-bootstrap/Dropdown";
const spennypiggy = "/build/assets/spenny-piggy-4d614821.png";
function Header(props) {
  const { rates, global_currency, auth, user } = usePage().props;
  const deviceid = DeviceID();
  const [isActive, setActive] = useState(false);
  const toggleClass = () => setActive(!isActive);
  const cart = useSelector((state) => state.data.cart.cart);
  const [count, setCount] = useState();
  const [loggedIn, setLoggedIn] = useState(auth && auth.username);
  const dispatch = useDispatch();
  async function fetchCounter() {
    axios.get(`counter/${deviceid}`).then((resp) => {
      setCount(resp.data.counter);
      dispatch(add_to_cart(resp.data.counter));
    }).catch((_err) => {
      console.error("error", _err);
    });
  }
  useEffect(() => {
    fetchCounter();
  }, [cart]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "blackbg headermain py-14", children: /* @__PURE__ */ jsx("div", { className: "containerbox", children: /* @__PURE__ */ jsxs("div", { className: "header flex w-full items-center content-center justify-between pinkbg border-mint shadow-mint", children: [
      auth && (auth == null ? void 0 : auth.username) ? /* @__PURE__ */ jsx(Link, { href: `/${auth && (auth == null ? void 0 : auth.username) || ""}`, className: "headtitle text-wh font-GillSans d-none d-lg-flex", children: " My Wishlist " }) : /* @__PURE__ */ jsx(Link, { href: "/register", className: "headtitle text-wh font-GillSans d-none d-lg-flex", children: " Create Wishlist " }),
      /* @__PURE__ */ jsx("div", { className: "spennylogo", children: /* @__PURE__ */ jsx(Link, { href: route("home"), children: /* @__PURE__ */ jsx(
        LazyLoadImage,
        {
          alt: "image",
          height: 170,
          useIntersectionObserver: true,
          effect: "blur",
          src: spennypiggy,
          width: 292
        }
      ) }) }),
      /* @__PURE__ */ jsxs("div", { className: "cartLogin", children: [
        (auth == null ? void 0 : auth.stripe_details_submitted) == 1 ? "" : /* @__PURE__ */ jsx(ChangeCurrency, { defaultvalue: global_currency, changer: true }),
        /* @__PURE__ */ jsxs(Link, { href: route("cart"), as: "button", className: "cartLink d-flex me-3 position-relative", children: [
          /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "36", height: "36", viewBox: "0 0 36 36", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M25.5002 27.0002C23.8352 27.0002 22.5002 28.3352 22.5002 30.0002C22.5002 30.7959 22.8163 31.559 23.3789 32.1216C23.9415 32.6842 24.7046 33.0002 25.5002 33.0002C26.2959 33.0002 27.059 32.6842 27.6216 32.1216C28.1842 31.559 28.5002 30.7959 28.5002 30.0002C28.5002 29.2046 28.1842 28.4415 27.6216 27.8789C27.059 27.3163 26.2959 27.0002 25.5002 27.0002ZM1.50024 3.00024L1.50024 6.00024H4.50024L9.90024 17.3852L7.86024 21.0602C7.63524 21.4802 7.50024 21.9752 7.50024 22.5002C7.50024 23.2959 7.81631 24.059 8.37892 24.6216C8.94153 25.1842 9.70459 25.5002 10.5002 25.5002H28.5002V22.5002H11.1302C11.0308 22.5002 10.9354 22.4607 10.8651 22.3904C10.7948 22.3201 10.7552 22.2247 10.7552 22.1252C10.7552 22.0502 10.7702 21.9902 10.8002 21.9452L12.1502 19.5002H23.3252C24.4502 19.5002 25.4402 18.8702 25.9502 17.9552L31.3202 8.25024C31.4252 8.01024 31.5002 7.75524 31.5002 7.50024C31.5002 7.10242 31.3422 6.72089 31.0609 6.43958C30.7796 6.15828 30.3981 6.00024 30.0002 6.00024L7.81524 6.00024L6.40524 3.00024M10.5002 27.0002C8.83524 27.0002 7.50024 28.3352 7.50024 30.0002C7.50024 30.7959 7.81631 31.559 8.37892 32.1216C8.94153 32.6842 9.70459 33.0002 10.5002 33.0002C11.2959 33.0002 12.059 32.6842 12.6216 32.1216C13.1842 31.559 13.5002 30.7959 13.5002 30.0002C13.5002 29.2046 13.1842 28.4415 12.6216 27.8789C12.059 27.3163 11.2959 27.0002 10.5002 27.0002Z", fill: "#3CFCCF" }) }),
          count ? /* @__PURE__ */ jsx("span", { className: "site-counter d-block", children: cart }) : ""
        ] }),
        loggedIn ? /* @__PURE__ */ jsx(Link, { method: "get", href: route("logout"), as: "button", className: "btn-mint mx-3  d-none d-xl-flex", children: "Logout" }) : /* @__PURE__ */ jsx(Link, { href: route("login"), className: "btn-mint mx-3  d-none d-xl-flex", children: "Login" }),
        /* @__PURE__ */ jsx("div", { className: "menu-toggle cursor-pointer cartLink position-relative", onClick: toggleClass, children: /* @__PURE__ */ jsxs("svg", { width: "58", height: "59", viewBox: "0 0 58 59", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
          /* @__PURE__ */ jsxs("g", { filter: "url(#filter0_d_467_5581)", children: [
            /* @__PURE__ */ jsx("rect", { y: "0.5", width: "55", height: "55", rx: "11", fill: "#F94F97" }),
            /* @__PURE__ */ jsx("rect", { x: "0.55", y: "1.05", width: "53.9", height: "53.9", rx: "10.45", stroke: "#E6EA7B", strokeWidth: "1.1" })
          ] }),
          /* @__PURE__ */ jsx("path", { d: "M17.8125 35.4375H36.1875M17.8125 28.4375H36.1875M17.8125 21.4375H36.1875", stroke: "#E6EA7B", strokeWidth: "2.625", strokeLinecap: "round", strokeLinejoin: "round" }),
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("filter", { id: "filter0_d_467_5581", x: "0", y: "0.5", width: "58", height: "58", filterUnits: "userSpaceOnUse", colorInterpolationFilters: "sRGB", children: [
            /* @__PURE__ */ jsx("feFlood", { floodOpacity: "0", result: "BackgroundImageFix" }),
            /* @__PURE__ */ jsx("feColorMatrix", { in: "SourceAlpha", type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0", result: "hardAlpha" }),
            /* @__PURE__ */ jsx("feOffset", { dx: "3", dy: "3" }),
            /* @__PURE__ */ jsx("feComposite", { in2: "hardAlpha", operator: "out" }),
            /* @__PURE__ */ jsx("feColorMatrix", { type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" }),
            /* @__PURE__ */ jsx("feBlend", { mode: "normal", in2: "BackgroundImageFix", result: "effect1_dropShadow_467_5581" }),
            /* @__PURE__ */ jsx("feBlend", { mode: "normal", in: "SourceGraphic", in2: "effect1_dropShadow_467_5581", result: "shape" })
          ] }) })
        ] }) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: `modelmenu ${isActive ? "Open" : null}`, children: /* @__PURE__ */ jsxs("div", { className: "MegaMenu", children: [
      /* @__PURE__ */ jsx("div", { className: "closemega cursor-pointer", onClick: toggleClass, children: /* @__PURE__ */ jsxs("svg", { width: "58", height: "58", viewBox: "0 0 58 58", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
        /* @__PURE__ */ jsxs("g", { filter: "url(#filter0_d_746_858)", children: [
          /* @__PURE__ */ jsx("rect", { width: "55", height: "55", rx: "11", fill: "#F94F97" }),
          /* @__PURE__ */ jsx("rect", { x: "0.55", y: "0.55", width: "53.9", height: "53.9", rx: "10.45", stroke: "#E6EA7B", strokeWidth: "1.1" })
        ] }),
        /* @__PURE__ */ jsx("path", { d: "M17.8125 34.9375L36.5 20.9375M27 27.9375H27.1562M17.8125 20.9375L36 34.9375", stroke: "#E6EA7B", strokeWidth: "2.625", strokeLinecap: "round", strokeLinejoin: "round" }),
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("filter", { id: "filter0_d_746_858", x: "0", y: "0", width: "58", height: "58", filterUnits: "userSpaceOnUse", colorInterpolationFilters: "sRGB", children: [
          /* @__PURE__ */ jsx("feFlood", { floodOpacity: "0", result: "BackgroundImageFix" }),
          /* @__PURE__ */ jsx("feColorMatrix", { in: "SourceAlpha", type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0", result: "hardAlpha" }),
          /* @__PURE__ */ jsx("feOffset", { dx: "3", dy: "3" }),
          /* @__PURE__ */ jsx("feComposite", { in2: "hardAlpha", operator: "out" }),
          /* @__PURE__ */ jsx("feColorMatrix", { type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" }),
          /* @__PURE__ */ jsx("feBlend", { mode: "normal", in2: "BackgroundImageFix", result: "effect1_dropShadow_746_858" }),
          /* @__PURE__ */ jsx("feBlend", { mode: "normal", in: "SourceGraphic", in2: "effect1_dropShadow_746_858", result: "shape" })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "menuImg", children: /* @__PURE__ */ jsx("img", { src: spennypiggy, alt: "img" }) }),
      /* @__PURE__ */ jsx("div", { className: "menuList", children: /* @__PURE__ */ jsxs("ul", { children: [
        loggedIn ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { onClick: toggleClass, href: "/account", children: "My Account" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { onClick: toggleClass, href: `/${auth && (auth == null ? void 0 : auth.username) || ""}`, children: "My Wishlist" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { onClick: toggleClass, href: `/wish-tracker`, children: "Wish Tracker" }) })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { onClick: toggleClass, href: "/register", children: "Create Wishlist" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { onClick: toggleClass, href: route("register"), children: "Sign Up" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { onClick: toggleClass, href: route("login"), children: "Login" }) })
        ] }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { onClick: toggleClass, href: route("how-it-works"), children: "How it works" }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { onClick: toggleClass, target: "_blank", href: "https://intercom.help/spenny-piggy", children: "FAQ's" }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { onClick: toggleClass, href: "https://blog.spennypiggy.co", children: "Blog" }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { onClick: toggleClass, className: "livechat", children: "Need help ?" }) }),
        auth && (auth == null ? void 0 : auth.username) ? /* @__PURE__ */ jsx("li", { className: "d-block d-lg-none", children: /* @__PURE__ */ jsx(Link, { onClick: toggleClass, method: "get", href: route("logout"), children: "Logout" }) }) : ""
      ] }) })
    ] }) })
  ] });
}
export {
  Header as default
};
