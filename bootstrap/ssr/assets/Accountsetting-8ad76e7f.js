import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { A as Authenticated } from "./AuthenticatedLayout-57b60e02.js";
import Popup from "./Popup-7b8a2e20.js";
import UpdateProfileInformation from "./UpdateProfileInformationForm-3bebcef6.js";
import UpdatePasswordForm from "./UpdatePasswordForm-84dab7e7.js";
import DeleteUserForm from "./DeleteUserForm-0566f913.js";
import PaymentDashboard from "./PaymentDashboard-f9bed3e2.js";
import { C as ChangeCurrency } from "./ChangeCurrency-48153973.js";
import LinkTwitter from "./LinkTwitter-93e51b89.js";
import "react-hot-toast";
import "./Alerts-5da797d1.js";
import "react-bootstrap/Modal";
import "./InputError-eb0c91b3.js";
import "./InputLabel-747c5b8a.js";
import "./PrimaryButton-eeb7392f.js";
import "./TextInput-1224a4d9.js";
import "@headlessui/react";
import "./LoaderButton-91d3595f.js";
import "react-select";
import "react-bootstrap/Dropdown";
const closeblacksm = "/build/assets/closeblacksm-6b3639d2.png";
function Accountsetting(props) {
  console.log("props aa", props);
  const { auth, user, global_currency } = props;
  const [passClose, setSassClose] = useState(null);
  const passwordUpdated = () => {
    setSassClose(false);
    setTimeout(() => {
      setSassClose();
    }, 100);
  };
  return /* @__PURE__ */ jsxs(Authenticated, { user, auth: auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "My Account" }),
    /* @__PURE__ */ jsx("div", { className: "blackbg py-2 pb-md-5", children: /* @__PURE__ */ jsxs("div", { className: "accountsetting mx-auto border-mint whbg shadow-mint rounded-3xl mb-4 mb-md-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "loginheadbox pinkbg", children: [
        /* @__PURE__ */ jsx("span", { className: "mintbg" }),
        /* @__PURE__ */ jsx("span", { className: "bluebg" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "accsettingList p-4", children: /* @__PURE__ */ jsxs("ul", { children: [
        /* @__PURE__ */ jsx("li", { children: auth && auth.user && auth.user.stripe_details_submitted == 1 ? /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(PaymentDashboard, { classes: "w-100 text-dark paymentbutton", text: /* @__PURE__ */ jsxs(Fragment, { children: [
          "PAYMENT DASHBOARD ",
          /* @__PURE__ */ jsx("span", { className: "text-mint", children: "Connected" })
        ] }) }) }) : /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(Link, { href: route("stripe"), children: [
          "PAYMENT DASHBOARD ",
          /* @__PURE__ */ jsx("span", { className: "text-voilet", children: "Connect Stripe" })
        ] }) }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
          Popup,
          {
            space: "4",
            modalclassName: "pinkmodal",
            text: /* @__PURE__ */ jsxs(Fragment, { children: [
              "Email ",
              /* @__PURE__ */ jsx("span", { className: "text-gray", children: auth && auth.user && auth.user.email })
            ] }),
            children: /* @__PURE__ */ jsx(UpdateProfileInformation, {})
          }
        ) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Popup, { action: passClose, space: "4", modalclassName: "pinkmodal", text: /* @__PURE__ */ jsx(Fragment, { children: "PASSWORD" }), children: /* @__PURE__ */ jsx(UpdatePasswordForm, { passwordUpdate: passwordUpdated }) }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Popup, { action: passClose, space: "4", modalclassName: "pinkmodal", text: /* @__PURE__ */ jsxs(Fragment, { children: [
          "DISPLAY CURRENCY ",
          /* @__PURE__ */ jsx("span", { className: "text-gray", children: global_currency })
        ] }), children: /* @__PURE__ */ jsx(ChangeCurrency, { defaultvalue: global_currency }) }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Popup, { action: passClose, space: "4", modalclassName: "pinkmodal", text: /* @__PURE__ */ jsxs(Fragment, { children: [
          auth && auth.user && auth.user.twitter_username ? `AUTO TWEET` : "SET UP AUTO TWEET",
          /* @__PURE__ */ jsxs("div", { className: "d-flex", children: [
            /* @__PURE__ */ jsx("img", { src: closeblacksm, alt: "img", className: "me-2" }),
            auth && auth.user && auth.user.twitter_username ? `@${auth.user.twitter_username}` : ""
          ] })
        ] }), children: /* @__PURE__ */ jsx(LinkTwitter, { username: auth && auth.user && auth.user.twitter_username || false }) }) }),
        /* @__PURE__ */ jsx("li", { className: "disabled", children: /* @__PURE__ */ jsxs("div", { className: "notification", children: [
          "RECEIVE NOTIFICATION ON EMAIL",
          /* @__PURE__ */ jsxs("label", { className: "switch", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox" }),
            /* @__PURE__ */ jsx("span", { className: "sliderSw round" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
          Popup,
          {
            space: "4",
            modalclassName: "pinkmodal",
            text: /* @__PURE__ */ jsx(Fragment, { children: "DELETE ACCOUNT  " }),
            children: /* @__PURE__ */ jsx(DeleteUserForm, {})
          }
        ) })
      ] }) })
    ] }) })
  ] });
}
export {
  Accountsetting as default
};
