import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { c as cartproductimg } from "./cartproductimg-2f15143a.js";
import { P as PriceFormat } from "./PriceFormat-18bf11fa.js";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import axios from "axios";
import "@inertiajs/react";
import "react-hot-toast";
function CartItem({ data, removeCart, quantityUpdate }) {
  const { formatMultiPrice } = PriceFormat();
  const [quantity, setQuantity] = useState(data && data.quantity || 1);
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const [intialItem, setInitialItem] = useState();
  const updatequantity = (quantity2) => {
    axios.get(`cart-update-quantity/${data && data.uuid}/${quantity2}`).then((resp) => {
    }).catch((_err) => {
      console.error("error", _err);
      errorAlert("Unable to update quantity.");
      setQuantity(intialItem);
    });
  };
  async function incrementCount() {
    setInitialItem(quantity);
    let counts = quantity + 1;
    setQuantity(counts);
    updatequantity(counts);
    quantityUpdate("add", data && data.price);
  }
  async function decrementCount() {
    setInitialItem(quantity);
    let counts = quantity - 1;
    setQuantity(counts);
    updatequantity(counts);
    quantityUpdate("minus", data && data.price);
  }
  return /* @__PURE__ */ jsxs("div", { className: `border cartlist flex flex-wrap justify-between items-center content-between items-center border-purple shadow-purple rounded-xl 
            mb-3 mb-md-4 mb-ml-5 p-3 p-md-4`, children: [
    /* @__PURE__ */ jsxs("div", { className: "prodcartbox items-center", children: [
      /* @__PURE__ */ jsx("div", { className: "productimg", children: /* @__PURE__ */ jsx("img", { src: data.url || cartproductimg, alt: "img" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "cartProdTitle ps-3", children: data.wishname }),
        data.surprise_message ? /* @__PURE__ */ jsxs("div", { className: "surprise-message ps-3", children: [
          "Surprise Message : ",
          data.surprise_message
        ] }) : ""
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "cartProRtbox mt-3 items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "quty flex items-center me-4 ", children: [
        /* @__PURE__ */ jsx("button", { disabled: quantity == 1, onClick: decrementCount, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M19 12.998H5V10.998H19V12.998Z", fill: "black" }) }) }),
        /* @__PURE__ */ jsx("div", { className: "qutynum", children: quantity }),
        /* @__PURE__ */ jsx("button", { onClick: incrementCount, children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z", fill: "black" }) }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "cartPric pe-4", children: formatMultiPrice(data.price) }),
      /* @__PURE__ */ jsx("button", { className: "del", onClick: () => removeCart(data && data.uuid), children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.99933 19.5493 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.804 20.021 18.412 20.413C18.02 20.805 17.5493 21.0007 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z", fill: "#FF6565" }) }) })
    ] })
  ] });
}
export {
  CartItem as default
};
