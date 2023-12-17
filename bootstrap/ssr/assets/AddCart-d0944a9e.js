import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import axios from "axios";
import toast from "react-hot-toast";
import { D as DeviceID } from "./DeviceID-14747b9d.js";
import { useDispatch, useSelector } from "react-redux";
import { a as add_to_cart } from "../app.js";
import { u as uploadedimg } from "./Wishlist-d01d9430.js";
import ProgressBar from "react-bootstrap/ProgressBar";
import { P as PriceFormat } from "./PriceFormat-18bf11fa.js";
import { Link } from "@inertiajs/react";
import "react-dom/client";
import "@reduxjs/toolkit";
import "./uploader.module-d5dbf507.js";
import "@uploadcare/blocks";
import "react-bootstrap/Tab";
import "react-bootstrap/Tabs";
import "react-bootstrap/Accordion";
import "./Popup-7b8a2e20.js";
import "react-bootstrap/Modal";
import "swiper/modules";
import "swiper/react";
/* empty css                     */const giftimg = "/build/assets/giftimg-47175b32.jpg";
function ToCart({
  sub,
  surprise_amount,
  surprise_message,
  owner,
  auth,
  actionfrom,
  checkoutbtn,
  ItemAdded,
  item,
  crowd,
  pending,
  uuid,
  text,
  classes,
  custom,
  removeItem,
  type,
  is_cart,
  amount,
  isEqual
}) {
  const deviceID = DeviceID();
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.data.cart.cart);
  const addtocart = async (sets) => {
    function check() {
      if (checkoutbtn) {
        window.location = "/cart";
      }
    }
    if (item && item.subscription == "2" && isEqual) {
      toast.error(`Wish item funding is completed.`);
      return false;
    }
    if (!(item == null ? void 0 : item.is_cart) && crowd && !amount) {
      toast.error(`Please enter a amount to gift this item.`);
      return false;
    }
    setLoading(true);
    axios.get(`/add-to-cart/${uuid}/${deviceID}${sub ? `/${sub}` : "/onetime"}${amount ? `/${amount}/` : ""}`).then((resp) => {
      if (resp.data.success) {
        if (resp.data.added == true) {
          successAlert(resp.data.msg);
          ItemAdded && ItemAdded("added");
          check();
          dispatch(add_to_cart(cart + 1));
        } else {
          successAlert(resp.data.msg);
        }
        if (resp.data.uuid) {
          removeItem && removeItem(uuid);
        }
      } else {
        errorAlert(resp.data.msg);
      }
      setLoading(false);
    }).catch((_err) => {
      console.error("error", _err);
      setLoading(false);
      errorAlert("Something went wrong !!.");
    });
  };
  return /* @__PURE__ */ jsx(Fragment, { children: custom ? /* @__PURE__ */ jsx("div", { onClick: addtocart, children: custom }) : /* @__PURE__ */ jsx(
    LoaderButton,
    {
      disabled: loading,
      onClick: () => addtocart(),
      className: `flex ${classes} mx-auto`,
      spinnerClassName: "fill-red-600",
      children: loading ? "Processing" : text
    }
  ) });
}
const Popup = React.lazy(() => import("./Popup-7b8a2e20.js"));
function AddCart(props) {
  const { auth, action, uuid, item, currency } = props;
  const [sub, setSub] = useState("daily");
  const { format, formatMultiPrice } = PriceFormat();
  const [cartamount, setcartamount] = useState(null);
  const [close, setClose] = useState(action);
  const [is_cart, setIs_cart] = useState(item && (item == null ? void 0 : item.is_cart));
  const ItemAdded = (e) => {
    if (e == "added") {
      setIs_cart(true);
    }
    if (e == "removed") {
      setIs_cart(false);
    }
    setClose(false);
  };
  useEffect(() => {
    setClose(action);
    return () => {
      setSub("onetime");
    };
  }, [action]);
  const getPercentage = (actual, paid) => {
    const r = paid / actual * 100;
    return r.toFixed(1);
  };
  return /* @__PURE__ */ jsxs(
    Popup,
    {
      size: "md",
      action: close,
      modalclassName: "pinkmodal",
      classes: "d-none",
      children: [
        /* @__PURE__ */ jsx("div", { className: "addCartModalHead rounded-3xl relative ", children: /* @__PURE__ */ jsx("h2", { className: "font-GillSans text-bl uppercase pt-8 text-lg relative z-1 px-3 text-center", children: " Add to Cart " }) }),
        /* @__PURE__ */ jsx("div", { className: "cartModimg absolute left-0 top-0", children: /* @__PURE__ */ jsx("img", { src: giftimg, alt: "img" }) }),
        /* @__PURE__ */ jsxs("div", { className: "bannerrr p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "cartbanner", children: /* @__PURE__ */ jsx("img", { src: item.perma_link ? item.perma_link : uploadedimg, alt: "img" }) }),
          /* @__PURE__ */ jsx("div", { className: "cartTitle text-center", children: item.wishname }),
          /* @__PURE__ */ jsx("div", { className: "cartPrice font-CeraGRBold text-voilet mt-1 mb-3 text-center", children: formatMultiPrice(item.price, (item == null ? void 0 : item.currency) || "GBP") }),
          item.subscription == "2" ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("p", { className: "mb-0", children: "Amount " }),
            /* @__PURE__ */ jsxs("div", { className: "croud-add  global-currency-wrap ", children: [
              /* @__PURE__ */ jsx("div", { className: "global-currency", children: currency || "GBP" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  onChange: (e) => setcartamount(e.target.value),
                  placeholder: `Eg. 50`,
                  type: "number",
                  className: "form-control mt-1"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "crowd pt-2 mb-4", children: [
              /* @__PURE__ */ jsx(
                ProgressBar,
                {
                  now: formatMultiPrice(item.fullfill_amount, (item == null ? void 0 : item.currency) || "GBP"),
                  max: formatMultiPrice(item.price, (item == null ? void 0 : item.currency) || "GBP")
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "d-flex align-items-center justify-content-between", children: [
                /* @__PURE__ */ jsxs("p", { className: "mt-1 mb-0 text-small", children: [
                  getPercentage(
                    item.price,
                    item.fullfill_amount
                  ),
                  "% granted"
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "mt-1 mb-0 text-small", children: [
                  "Remaining  ",
                  formatMultiPrice(item.price - item.fullfill_amount, (item == null ? void 0 : item.currency) || "GBP")
                ] })
              ] })
            ] })
          ] }) : "",
          item.subscription == 1 ? /* @__PURE__ */ jsxs("div", { className: " pb-2", children: [
            /* @__PURE__ */ jsx(Link, { className: "inline-flex items-center px-4 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 false flex btn-pink lg w-100 mb-3 font-CeraGR  mx-auto", href: route("wish.subscribe.checkout", { uuid: item.uuid, reccure: "onetime" }), children: "OneTime Purchase" }),
            /* @__PURE__ */ jsxs(Link, { className: "inline-flex items-center px-4 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 false flex btn-pink lg w-100 mb-3 font-CeraGR  mx-auto", href: route("wish.subscribe.checkout", { uuid: item.uuid }), children: [
              "Pay Every ",
              item.subscription_period == "daily" ? " Day" : "",
              item.subscription_period == "weekly" ? " Week" : "",
              item.subscription_period == "monthly" ? " Month" : ""
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: " pb-2", children: [
            /* @__PURE__ */ jsx(
              ToCart,
              {
                currency,
                sub,
                ItemAdded,
                auth,
                pending: item.price - item.fullfill_amount,
                crowd: item.subscription == 2,
                amount: cartamount,
                item,
                isEqual: item.price <= item.fullfill_amount,
                is_cart,
                text: `Add To Cart And Keep Shopping`,
                classes: `btn-pink lg w-100 mb-3 font-CeraGR ${item.subscription == "2" && item.price <= item.fullfill_amount ? "d-none" : ""}`,
                uuid
              }
            ),
            /* @__PURE__ */ jsx(
              ToCart,
              {
                currency,
                sub,
                auth,
                ItemAdded,
                pending: item.price - item.fullfill_amount,
                crowd: item.subscription == 2,
                amount: cartamount,
                item,
                isEqual: item.price <= item.fullfill_amount,
                is_cart,
                text: `Add To Cart And Checkout`,
                checkoutbtn: true,
                classes: `btn-pink lg w-100 mb-3 font-CeraGR ${item.subscription == "2" && item.price <= item.fullfill_amount ? "d-none" : ""}`,
                uuid
              }
            )
          ] })
        ] })
      ]
    }
  );
}
export {
  AddCart as default
};
