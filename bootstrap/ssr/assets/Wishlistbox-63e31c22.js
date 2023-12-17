import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import ShareProfile from "./ShareProfile-d3c3ccb4.js";
import { W as Wishlist, u as uploadedimg } from "./Wishlist-d01d9430.js";
import ProgressBar from "react-bootstrap/ProgressBar";
import { P as PriceFormat } from "./PriceFormat-18bf11fa.js";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import axios from "axios";
import "react-hot-toast";
import "./LoaderButton-91d3595f.js";
import "@inertiajs/react";
import "./uploader.module-d5dbf507.js";
import "@uploadcare/blocks";
import "react-bootstrap/Tab";
import "react-bootstrap/Tabs";
import "react-bootstrap/Accordion";
import "./Popup-7b8a2e20.js";
import "react-bootstrap/Modal";
import "swiper/modules";
import "swiper/react";
/* empty css                     */function PinWish({ text, id, fetchingcats }) {
  const { successAlert, errorAlert } = useAlerts();
  const pin = (e) => {
    if (!id) {
      return false;
    }
    axios.get(`/pin-item/${id}`).then((resp) => {
      if (resp.data.status) {
        successAlert(resp.data.msg);
        fetchingcats && fetchingcats("all");
      } else {
        errorAlert(resp.data.msg);
      }
    }).catch((_err) => {
      console.error("error", _err);
    });
  };
  return /* @__PURE__ */ jsx("button", { onClick: pin, children: text });
}
const AddCart = React.lazy(() => import("./AddCart-d0944a9e.js"));
function Wishlistbox(props) {
  const { format, formatMultiPrice } = PriceFormat();
  const { currency, itm, itemid, auth, IsloggedIn, fetchingcats, categories, setuped } = props;
  const [itemUID, setItemUID] = useState(itemid);
  const [open, setOpen] = useState();
  const openAddtocart = () => {
    setOpen(true);
    setTimeout(() => {
      setOpen();
    }, 1e3);
  };
  useEffect(() => {
    if (itemUID == itm.uuid) {
      setOpen(true);
    }
  }, [itemUID]);
  const getPercentage = (actual, paid) => {
    const r = paid / actual * 100;
    return r.toFixed(1);
  };
  const price = () => {
    return itm.price;
  };
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: "wishlistcntbox mb-3 mb-sm-4 whbg relative  shadow-voilet ", children: [
    IsloggedIn ? /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(Wishlist, { currency, setuped, openPop: open, item: itm, editpop: true, fetchingcats, categories }) }) : /* @__PURE__ */ jsx(AddCart, { currency, IsloggedIn, auth, item: itm, uuid: itm.uuid, action: open }),
    IsloggedIn ? /* @__PURE__ */ jsx(
      DropdownButton,
      {
        className: "wishedit",
        id: "dropdown-basic-button",
        title: /* @__PURE__ */ jsxs("div", { className: "dots", children: [
          /* @__PURE__ */ jsx("span", {}),
          /* @__PURE__ */ jsx("span", {}),
          /* @__PURE__ */ jsx("span", {})
        ] }),
        children: /* @__PURE__ */ jsx(Dropdown.Item, { children: /* @__PURE__ */ jsx(PinWish, { fetchingcats, id: itm.id, text: "Pin item on the top" }) })
      }
    ) : "",
    (itm == null ? void 0 : itm.is_pin) == 1 ? /* @__PURE__ */ jsxs("div", { className: "badge bg-info text-dark font-light pinned-badge", children: [
      /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", fill: "#000000", children: [
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_bgCarrier", "stroke-width": "0" }),
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_tracerCarrier", "stroke-linecap": "round", "stroke-linejoin": "round" }),
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_iconCarrier", children: /* @__PURE__ */ jsx("path", { d: "M4 2h7v.278c0 .406-.086.778-.258 1.117-.172.339-.42.63-.742.875v2.86c.307.145.583.328.828.546.245.219.456.464.633.735.177.27.31.565.398.882.089.318.136.646.141.985v.5H8V14l-.5 1-.5-1v-3.222H3v-.5c0-.339.047-.664.14-.977.094-.312.227-.607.4-.883A3.404 3.404 0 0 1 5 7.13V4.27a2.561 2.561 0 0 1-.734-.875A2.505 2.505 0 0 1 4 2.278V2zm1.086.778c.042.125.094.232.156.32a1.494 1.494 0 0 0 .461.43L6 3.715v4.102l-.336.117c-.411.146-.76.383-1.047.711C4.331 8.973 4.09 9.573 4 10h7c-.088-.427-.33-1.027-.617-1.355a2.456 2.456 0 0 0-1.047-.71L9 7.816V3.715l.297-.18c.094-.057.177-.122.25-.195a2.28 2.28 0 0 0 .21-.242.968.968 0 0 0 .157-.32H5.086z" }) })
      ] }),
      " Pinned"
    ] }) : "",
    /* @__PURE__ */ jsx("div", { onClick: openAddtocart, className: "wishlistimg cursor-pointer", children: /* @__PURE__ */ jsx("img", { src: (itm == null ? void 0 : itm.perma_link) ? itm == null ? void 0 : itm.perma_link : uploadedimg, alt: "img", className: "" }) }),
    /* @__PURE__ */ jsxs("div", { onClick: openAddtocart, className: "wishlistdetial cursor-pointer relative", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: `fon-bold text-dark ${itm.subscription !== "0" ? "el1" : "el2"}`, children: itm.wishname }),
        /* @__PURE__ */ jsxs("h5", { className: "font-CeraGRBold text-dark titleprice", children: [
          formatMultiPrice(price(), (itm == null ? void 0 : itm.currency) || "GBP"),
          /* @__PURE__ */ jsxs("button", { className: "tooltipbtn", children: [
            "?",
            /* @__PURE__ */ jsx("p", { children: "*not including 20% service fee." })
          ] })
        ] })
      ] }),
      itm.subscription == "2" ? /* @__PURE__ */ jsxs("div", { className: "crowd pt-2", children: [
        /* @__PURE__ */ jsx(ProgressBar, { now: itm.fullfill_amount, max: itm.price }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 mb-0 text-small", children: [
          getPercentage(itm.price, itm.fullfill_amount),
          "% granted"
        ] })
      ] }) : "",
      itm && itm.subscription == "1" ? /* @__PURE__ */ jsx("div", { className: "subscribletag", children: " Subscribable " }) : ""
    ] }),
    /* @__PURE__ */ jsx("div", { className: "sharelinks", children: /* @__PURE__ */ jsx(ShareProfile, { username: itm.wishname, custom: `${window.location.href}?item=${itm.uuid}`, children: /* @__PURE__ */ jsx("div", { className: "text-pink font-GillSans", children: "Share Link" }) }) })
  ] }) });
}
export {
  Wishlistbox as default
};
