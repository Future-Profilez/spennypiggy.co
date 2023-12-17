import { jsxs, jsx } from "react/jsx-runtime";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import React, { useState } from "react";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import { P as PriceFormat } from "./PriceFormat-18bf11fa.js";
import { useForm } from "@inertiajs/react";
import { D as DeviceID } from "./DeviceID-14747b9d.js";
import { useDispatch, useSelector } from "react-redux";
import { a as add_to_cart } from "../app.js";
import "react-hot-toast";
import "react-dom/client";
import "@reduxjs/toolkit";
const Popup = React.lazy(() => import("./Popup-7b8a2e20.js"));
function SendSurprise({ auth, owner }) {
  const deviceID = DeviceID();
  const { format } = PriceFormat();
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const [close, setClose] = useState();
  const { data, setData, post, processing, errors, reset } = useForm({
    amount: "",
    message: ""
  });
  function ItemAdded() {
    setClose(false);
    setTimeout(() => {
      setClose();
    });
  }
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.data.cart.cart);
  const sendSurprize = (e) => {
    e.preventDefault();
    if (!data.amount) {
      errorAlert("Choose a valid amount.");
      return false;
    }
    if (!data.message) {
      errorAlert("Message can not be empty.");
      return false;
    }
    post(route(`send-surprize`, {
      "owner_id": owner && owner.id,
      "device_id": deviceID,
      "amount": data.amount,
      "message": data.message
    }), {
      preserveScroll: true,
      onSuccess: (resp) => {
        var _a, _b, _c, _d;
        ItemAdded();
        reset();
        if ((_a = resp.props.flash) == null ? void 0 : _a.success) {
          successAlert(((_b = resp.props.flash) == null ? void 0 : _b.success) || "Added");
          dispatch(add_to_cart(cart + 1));
        }
        if ((_c = resp.props.flash) == null ? void 0 : _c.error) {
          errorAlert((_d = resp.props.flash) == null ? void 0 : _d.error);
        }
      },
      onError: (_err) => {
        console.error(_err);
      }
    });
  };
  return /* @__PURE__ */ jsxs(
    Popup,
    {
      modalclassName: "pinkmodal sendSurprize-modal",
      space: "4",
      size: "md",
      action: close,
      classes: `btn-pink lg px-4 my-2 w-100`,
      text: `Send Surprise`,
      children: [
        /* @__PURE__ */ jsx("h2", { className: "text-uppercase font-GillSans pb-4 font-large", children: "Send a Surprise Gift" }),
        /* @__PURE__ */ jsxs("div", { className: "form-field mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "d-block text-start mb-2", children: "Amount" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              className: "form-input w-100 rounded",
              onChange: (e) => setData("amount", e.target.value),
              type: "number",
              placeholder: "Enter amount.. "
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "mt-1", children: [
            "The amount is set to ",
            format(data.amount),
            " in the wisher's currency"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-field mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "d-block text-start mb-2", children: "Suggested use (Required)" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              placeholder: "Message...",
              className: "form-input w-100 rounded",
              onChange: (e) => setData("message", e.target.value),
              type: "text"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          LoaderButton,
          {
            onClick: sendSurprize,
            disabled: processing,
            type: "submit",
            className: "flex w-100 btn-pink lg mx-auto",
            spinnerClassName: "fill-red-600",
            children: processing ? "Processing" : auth && auth.name ? "Add to cart" : "Send Gift"
          }
        )
      ]
    }
  );
}
export {
  SendSurprise as default
};
