import { jsx } from "react/jsx-runtime";
import "react";
import { A as Authenticated } from "./AuthenticatedLayout-57b60e02.js";
import Nocontent from "./Nocontent-a5a8d2f7.js";
import "@inertiajs/react";
import "react-hot-toast";
import "./Alerts-5da797d1.js";
function NotFound({ auth, user }) {
  return /* @__PURE__ */ jsx(Authenticated, { auth: auth.user, user, children: /* @__PURE__ */ jsx("div", { className: "blackbg py-18", children: /* @__PURE__ */ jsx("div", { className: " blackbg py-5 ", children: /* @__PURE__ */ jsx("div", { className: "containerbox errorpage py-5 ", children: /* @__PURE__ */ jsx(Nocontent, { text: "404 Not Found" }) }) }) }) });
}
export {
  NotFound as default
};
