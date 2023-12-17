import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import CartItem from "./CartItem-aa598f3f.js";
import { Link, router } from "@inertiajs/react";
import { P as PriceFormat } from "./PriceFormat-18bf11fa.js";
import { D as DeviceID } from "./DeviceID-14747b9d.js";
import "./cartproductimg-2f15143a.js";
import "./Alerts-5da797d1.js";
import "react-hot-toast";
import "axios";
function UserCarts(props) {
  var _a, _b, _c, _d;
  const deviceid = DeviceID();
  const { auth, removeFromCart } = props;
  const { format, formatMultiPrice } = PriceFormat();
  const datas = props.data;
  const [isChecked, setIsChecked] = useState(false);
  const [message, setMessage] = useState(null);
  const [name, setName] = useState(auth && auth.name || "");
  const [email, setEmail] = useState(auth && auth.email || "");
  const handleSubmit = (e) => {
    var _a2;
    e.preventDefault();
    if (auth && auth.id) {
      window.location.href = `/create-checkout-session/${((_a2 = datas == null ? void 0 : datas.user) == null ? void 0 : _a2.id) || ""}?message=${message}&from=${name}&email=${email}`;
    } else {
      window.location.href = `/create-checkout-session/${deviceid}?message=${message}&from=${name}&email=${email}`;
    }
  };
  const [loading, setLoading] = useState(false);
  const [cartCleared, setCartCleared] = useState(false);
  const clearcart = (ownerid, index) => {
    setLoading(true);
    router.get(`/clear-cart/${deviceid}/${ownerid}`, {
      preserveScroll: true,
      onSuccess: (resp) => {
        console.log("resp", resp);
        setCartCleared(true);
        setLoading(false);
        if (index == 0) {
          window.location.reload = false;
        }
      },
      onError: (_err) => {
        console.error("error", _err);
        setLoading(false);
      }
    });
  };
  const [items, setItems] = useState(datas == null ? void 0 : datas.items);
  const removeCart = (id) => {
    router.get(
      `/remove-from-cart/${id}`,
      {
        preserveScroll: true,
        onSuccess: (resp) => {
          console.log("resp", resp);
          const updatedItems = items.filter((item) => item.uuid !== id);
          setItems(updatedItems);
        },
        onError: (_err) => {
          console.error("error", _err);
        }
      }
    );
  };
  const [subtotal, setsubtotal] = useState();
  const [fee, setFee] = useState(0.2 * subtotal);
  function updateTotals(p) {
    const value = items && items.reduce((total, item) => +total + +item.price * (+item.quantity || 1), 0) + p;
    setsubtotal(value);
    setFee(0.2 * value);
  }
  const quantityUpdate = (type, amount) => {
    if (type == "add") {
      const updated = subtotal + amount;
      setsubtotal(updated);
      setFee(0.2 * updated);
    } else {
      const updated = subtotal - amount;
      setsubtotal(updated);
      setFee(0.2 * updated);
    }
  };
  useEffect(() => {
    updateTotals(0);
  }, [items]);
  return /* @__PURE__ */ jsx("div", { className: `${cartCleared ? "d-none" : ""} px-2`, children: /* @__PURE__ */ jsx("div", { className: "my-4 cartPage bg-white p-4 p-md-5 border-pink shadow-pink border-pink rounded-3xl", children: /* @__PURE__ */ jsxs("div", { className: "cartMain", children: [
    /* @__PURE__ */ jsxs("h2", { className: "pb-1 wishtitle", children: [
      "Wish Basket for ",
      ((_a = datas == null ? void 0 : datas.user) == null ? void 0 : _a.name) || "",
      /* @__PURE__ */ jsxs(
        Link,
        {
          className: "text-voilet",
          href: `/${((_b = datas == null ? void 0 : datas.user) == null ? void 0 : _b.username) || ""}`,
          children: [
            "@",
            ((_c = datas == null ? void 0 : datas.user) == null ? void 0 : _c.username) || ""
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "pb-4", children: [
      "You are about to send a payout to",
      /* @__PURE__ */ jsxs("strong", { children: [
        " ",
        ((_d = datas == null ? void 0 : datas.user) == null ? void 0 : _d.name) || "",
        " "
      ] }),
      " to fund their wishes."
    ] }),
    /* @__PURE__ */ jsx("div", { className: "CartItemBox", children: items && items.map((c, i) => {
      return /* @__PURE__ */ jsx(CartItem, { quantityUpdate, removeCart, data: c }, i);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "cartTotal px-0 py-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "cartSubTotal text-right mt-1", children: [
        /* @__PURE__ */ jsx("span", { children: "Platform Fee :" }),
        " ",
        /* @__PURE__ */ jsx("strong", { className: "text-end", children: formatMultiPrice(fee || "") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "cartSubTotal text-right mt-1", children: [
        /* @__PURE__ */ jsx("span", { children: "Subtotal :" }),
        " ",
        /* @__PURE__ */ jsx("strong", { className: "text-end", children: formatMultiPrice(subtotal || "") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "cartSubTotal text-right mt-1", children: [
        /* @__PURE__ */ jsx("strong", { className: "text-dark", children: "Total :" }),
        " ",
        /* @__PURE__ */ jsx("strong", { className: "text-end", children: formatMultiPrice(fee + subtotal || "") })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "addMessage", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxs("ul", { className: "row", children: [
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("label", { children: "Add Message " }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              onChange: (e) => setMessage(e.target.value),
              placeholder: "Write message in under 800 Words..."
            }
          )
        ] }),
        /* @__PURE__ */ jsx("li", { className: "w-100 mt-3", children: /* @__PURE__ */ jsxs("li", { className: "row", children: [
          /* @__PURE__ */ jsxs("div", { className: "col-md-12 mb-4", children: [
            /* @__PURE__ */ jsx("label", { className: "d-block text-start", children: "From" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                className: "form-input w-100 rounded",
                onChange: (e) => setName(e.target.value),
                value: name,
                type: "text",
                placeholder: "Enter Your Name..."
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-md-12 mb-4", children: [
            /* @__PURE__ */ jsx("label", { className: "d-block text-start", children: "Email " }),
            /* @__PURE__ */ jsx("p", { className: "text-small text-muted mb-1", children: "Your e-mail remains private. It is used for the creator to reply to your gift with a message via Spenny Piggy" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                className: `${auth && auth.email ? "disabled" : ""} form-input w-100 rounded`,
                value: auth && auth.email,
                disabled: auth && auth.email ? true : false,
                onChange: (e) => setEmail(e.target.value),
                type: "email",
                placeholder: "Enter Your Email..."
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("li", { className: "cheklistbox", children: [
          /* @__PURE__ */ jsxs(
            "label",
            {
              htmlFor: "agreeterm",
              className: "text-start",
              children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    onChange: (e) => setIsChecked(e.target.checked),
                    type: "checkbox",
                    id: "agreeterm",
                    name: "agreeterm",
                    className: "me-2",
                    value: "agreeterm"
                  }
                ),
                "I agree to the ",
                /* @__PURE__ */ jsx(Link, { target: "_blank", className: "text-voilet", href: route("terms-and-conditions"), children: "Terms of Service" }),
                " and ",
                /* @__PURE__ */ jsx("a", { className: "text-voilet", target: "_blank", href: "https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6", children: " Privacy Policy " }),
                "  and the following statements:"
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "tearmlist ps-3", children: /* @__PURE__ */ jsxs("ul", { className: "ps-0", children: [
            /* @__PURE__ */ jsx("li", { children: "I am making a non-refundable cash gift donation." }),
            /* @__PURE__ */ jsx("li", { children: "I expect no product or service in return from the gift recipient." }),
            /* @__PURE__ */ jsx("li", { children: "This payment is a donation intended for the gift recipient." }),
            /* @__PURE__ */ jsx("li", { children: "I have taken the necessary steps to confirm the wishlist owner is authentic and I understand that Spenny Piggy will not be held responsible for any issues arising from a catfishing situation." }),
            /* @__PURE__ */ jsx("li", { children: "I understand that by violating these terms I may be subject to legal action or can fall a victim of scams." }),
            /* @__PURE__ */ jsx("li", { children: 'I understand that by checking the box above and then clicking "CHECKOUT", I will have created a legally binding e-signature to this agreement.' }),
            /* @__PURE__ */ jsx("li", { children: "By providing an e-mail, you confirm that you are happy to receive marketing updates. You can opt out at anytime." })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 d-flex align-items-center justify-content-between", children: [
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
          var _a2;
          return clearcart((_a2 = datas == null ? void 0 : datas.user) == null ? void 0 : _a2.id);
        }, className: `btn-pink md mt-3 px-4 text-center`, children: [
          " ",
          loading ? "Wait.." : "Clear",
          " "
        ] }),
        /* @__PURE__ */ jsx("button", { type: "submit", className: `${isChecked ? "" : "disabled"} btn-pink md mt-3 text-center`, children: "Checkout " })
      ] })
    ] }) })
  ] }) }) });
}
export {
  UserCarts as default
};
