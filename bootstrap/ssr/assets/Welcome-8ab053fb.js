import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { Head } from "@inertiajs/react";
import React from "react";
import Hero from "./Hero-f151ea9f.js";
import { G as Guest } from "./GuestLayout-4a28627b.js";
import "react-lazy-load-image-component";
import "./TrustBox-61d46987.js";
import "react-helmet";
import "react-hot-toast";
import "./Alerts-5da797d1.js";
const LiveBar = React.lazy(() => import("./LiveBar-4117f0dc.js"));
const FunPart = React.lazy(() => import("./FunPart-424afb1e.js"));
const WhyLove = React.lazy(() => import("./WhyLove-eccf895d.js"));
const HappyCreators = React.lazy(() => import("./HappyCreators-e2a331e3.js"));
const JoinUs = React.lazy(() => import("./JoinUs-e19999b9.js"));
function Home({ auth, laravelVersion, user }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(LiveBar, {}),
    /* @__PURE__ */ jsxs(Guest, { auth: auth.user, user: auth.user, children: [
      /* @__PURE__ */ jsx(Head, { title: "Welcome" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "homepromotion" }),
        /* @__PURE__ */ jsx(Hero, { auth }),
        /* @__PURE__ */ jsx(FunPart, {}),
        /* @__PURE__ */ jsx(WhyLove, {}),
        /* @__PURE__ */ jsx(HappyCreators, {}),
        /* @__PURE__ */ jsx(JoinUs, {})
      ] })
    ] })
  ] });
}
export {
  Home as default
};
