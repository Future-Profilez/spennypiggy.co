import { jsxs, jsx } from "react/jsx-runtime";
import { A as Avatar } from "./Avatar-70608b1c.js";
import { useState } from "react";
import { u as userphoto } from "./userphoto-76727e42.js";
import "@inertiajs/react";
function LargestGifts() {
  const [period, setperiod] = useState(1);
  const fetch = (e) => {
    setperiod(e);
  };
  const Income = () => {
    return /* @__PURE__ */ jsxs("div", { className: "rank py-3 border-bottom d-flex align-items-center justify-content-between", children: [
      /* @__PURE__ */ jsx("div", { className: "d-flex align-items-center justify-content-between", children: /* @__PURE__ */ jsx("div", { className: "wisher", children: /* @__PURE__ */ jsx(
        Avatar,
        {
          name: `Anonymous`,
          link: "n.user && n.user.username || null",
          subhead: "anonymous",
          username: "anonymous",
          src: userphoto
        }
      ) }) }),
      /* @__PURE__ */ jsx("div", { className: "rank-stats", children: /* @__PURE__ */ jsx("p", { className: "toppercentage income ", children: "0.01%" }) })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "rank_lists largest  bg-white p-4 rounded-lg", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-bl font-GillSans  text-start text-2xl \n      uppercase text-dark mb-4", children: "Largest Gifts" }),
    /* @__PURE__ */ jsxs("div", { className: "time-hrs", children: [
      /* @__PURE__ */ jsx("button", { className: period == 1 ? "active" : "", onClick: () => fetch(1), children: "Last Hour" }),
      /* @__PURE__ */ jsx("button", { className: period == 24 ? "active" : "", onClick: () => fetch(24), children: "Last 24 hrs" })
    ] }),
    /* @__PURE__ */ jsx(Income, {}),
    /* @__PURE__ */ jsx(Income, {})
  ] });
}
export {
  LargestGifts as default
};
