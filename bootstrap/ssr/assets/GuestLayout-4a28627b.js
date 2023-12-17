import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { usePage } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import React, { useEffect } from "react";
const Footer = React.lazy(() => import("./Footer-cf98b59e.js"));
const Header = React.lazy(() => import("./Header-92841d62.js"));
function Guest(props) {
  const { children, auth, cart_count } = props;
  const { successAlert, errorAlert } = useAlerts();
  const { flash } = usePage().props;
  useEffect(() => {
    if (flash == null ? void 0 : flash.error) {
      errorAlert(flash.error);
    }
    if (flash == null ? void 0 : flash.success) {
      successAlert(flash.success);
    }
    if (flash == null ? void 0 : flash.warning) {
      warningAlert(flash.warning);
    }
    if (flash == null ? void 0 : flash.info) {
      successAlert(flash.info);
    }
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Header, { auth: auth || "" }),
    children,
    /* @__PURE__ */ jsx(Footer, { auth: auth || "" }),
    /* @__PURE__ */ jsx(Toaster, {})
  ] });
}
export {
  Guest as G
};
