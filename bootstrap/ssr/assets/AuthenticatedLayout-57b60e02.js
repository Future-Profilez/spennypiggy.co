import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import React, { useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
import { u as useAlerts } from "./Alerts-5da797d1.js";
const Footer = React.lazy(() => import("./Footer-cf98b59e.js"));
const Header = React.lazy(() => import("./Header-92841d62.js"));
function Authenticated(props) {
  const { auth, user, children, cart_count } = props;
  const { successAlert, errorAlert } = useAlerts();
  const { flash } = usePage().props;
  useEffect(() => {
    console.log("flash", flash);
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
    /* @__PURE__ */ jsx(Header, { auth, user }),
    /* @__PURE__ */ jsxs("main", { children: [
      children,
      /* @__PURE__ */ jsx(
        Toaster,
        {
          reverseOrder: false,
          gutter: 8,
          toastOptions: {
            className: "",
            duration: 3e3,
            style: {
              background: "#363636",
              color: "#fff"
            },
            success: {
              duration: 3e3,
              theme: {
                primary: "green",
                secondary: "black"
              }
            }
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Footer, { auth })
  ] });
}
export {
  Authenticated as A
};
