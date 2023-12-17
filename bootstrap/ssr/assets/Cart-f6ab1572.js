import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { A as Authenticated } from "./AuthenticatedLayout-57b60e02.js";
import UserCarts from "./UserCarts-77ab1fb2.js";
import Nocontent from "./Nocontent-a5a8d2f7.js";
import { Head } from "@inertiajs/react";
import { D as DeviceID } from "./DeviceID-14747b9d.js";
import axios from "axios";
import LoadingScreen from "./LoadingScreen-e3e448fa.js";
import "react-hot-toast";
import "./Alerts-5da797d1.js";
import "./CartItem-aa598f3f.js";
import "./cartproductimg-2f15143a.js";
import "./PriceFormat-18bf11fa.js";
function Cart(props) {
  const deviceid = DeviceID();
  const { auth, user, carts } = props;
  const [cartsItems, setCartItems] = useState(carts);
  const [loading, setLoading] = useState(false);
  const fetchCartItem = (e) => {
    setLoading(true);
    axios.get(`anonymous-cart/${deviceid}`).then((resp) => {
      console.log("resp", resp.data.carts);
      setCartItems(resp.data.carts);
      setLoading(false);
    }).catch((_err) => {
      console.error("error", _err);
      setLoading(false);
    });
  };
  useEffect(() => {
    if (auth && !auth.user) {
      fetchCartItem();
    }
  }, []);
  return /* @__PURE__ */ jsxs(Authenticated, { auth: auth.user, user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Cart" }),
    /* @__PURE__ */ jsx("div", { className: "blackbg", children: /* @__PURE__ */ jsxs("div", { className: "container pb-5 ", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-bl font-GillSans pt-5 pt-3 pb-0 text-center text-2xl uppercase text-white", children: "Cart" }),
      loading ? /* @__PURE__ */ jsx(LoadingScreen, {}) : "",
      !loading && /* @__PURE__ */ jsx(Fragment, { children: cartsItems && cartsItems.length ? /* @__PURE__ */ jsx(Fragment, { children: cartsItems.map((c, i) => {
        return /* @__PURE__ */ jsx(UserCarts, { auth: auth && auth.user, data: c }, `user-cart-${i}`);
      }) }) : /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("div", { className: "py-5 text-center", children: /* @__PURE__ */ jsx("div", { className: "containerbox", children: /* @__PURE__ */ jsx(Nocontent, { classes: `py-5`, text: "Cart is empty." }) }) }) }) })
    ] }) })
  ] });
}
export {
  Cart as default
};
