import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, Link } from "@inertiajs/react";
import { P as PriceFormat } from "./PriceFormat-18bf11fa.js";
import { c as cartproductimg } from "./cartproductimg-2f15143a.js";
function SubCheckout(props) {
  var _a, _b, _c, _d;
  const { auth, wish, reccure } = props;
  console.log("auth", auth);
  const { format } = PriceFormat();
  const [name, setName] = useState(auth && auth.user && auth.user.name || "");
  const [email, setEmail] = useState(auth && auth.user && auth.user.email || "");
  const { data, setData, post, processing, errors } = useForm({
    name,
    email,
    message: "",
    agree: false
  });
  useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route(`wish.subscribe.checkout`, { uuid: wish.uuid, reccure }), {
      preserveScroll: true
    });
  };
  useState();
  return /* @__PURE__ */ jsx("div", { className: `px-2`, children: /* @__PURE__ */ jsx("div", { className: "my-4 cartPage bg-white p-4 p-md-5 border-pink shadow-pink border-pink rounded-3xl", children: /* @__PURE__ */ jsxs("div", { className: "cartMain", children: [
    /* @__PURE__ */ jsxs("h2", { className: "pb-1 wishtitle", children: [
      "Wish Basket for ",
      ((_a = wish == null ? void 0 : wish.user) == null ? void 0 : _a.name) || "",
      /* @__PURE__ */ jsxs(
        Link,
        {
          className: "text-voilet",
          target: "_blank",
          href: `/${((_b = wish == null ? void 0 : wish.user) == null ? void 0 : _b.username) || ""}`,
          children: [
            "@",
            ((_c = wish == null ? void 0 : wish.user) == null ? void 0 : _c.username) || ""
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "pb-4", children: [
      "You are about to subscribe to",
      /* @__PURE__ */ jsxs("strong", { children: [
        " ",
        ((_d = wish == null ? void 0 : wish.user) == null ? void 0 : _d.name) || "",
        " "
      ] }),
      " to fund their wishes."
    ] }),
    /* @__PURE__ */ jsx("div", { className: "CartItemBox", children: /* @__PURE__ */ jsxs("div", { className: `border cartlist flex flex-wrap justify-between items-center content-between items-center border-purple shadow-purple rounded-xl mb-3 mb-md-4 mb-ml-5 p-3 p-md-4`, children: [
      /* @__PURE__ */ jsxs("div", { className: "prodcartbox items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "productimg", children: /* @__PURE__ */ jsx("img", { src: wish.perma_link || cartproductimg, alt: "img" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "cartProdTitle ps-3", children: wish.wishname }),
          data.message ? /* @__PURE__ */ jsxs("div", { className: "surprise-message ps-3", children: [
            "Surprise Message : ",
            data.message
          ] }) : "",
          /* @__PURE__ */ jsxs("div", { className: "badge bg-info text-dark me-4 ms-3 ", children: [
            "Pay ",
            reccure == "onetime" ? `Onetime` : wish.subscription_period
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "cartProRtbox mt-3 items-center", children: /* @__PURE__ */ jsx("div", { className: "cartPric pe-4", children: format(wish.price) }) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "cartTotal px-0 py-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "cartSubTotal text-right mt-1", children: [
        /* @__PURE__ */ jsx("span", { children: "Platform Fee :" }),
        " ",
        /* @__PURE__ */ jsx("strong", { className: "text-end", children: format(wish.tax_amount || "") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "cartSubTotal text-right mt-1", children: [
        /* @__PURE__ */ jsx("span", { children: "Subtotal :" }),
        " ",
        /* @__PURE__ */ jsx("strong", { className: "text-end", children: format(wish.price || "") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "cartSubTotal text-right mt-1", children: [
        /* @__PURE__ */ jsx("strong", { className: "text-dark", children: "Total :" }),
        " ",
        /* @__PURE__ */ jsx("strong", { className: "text-end", children: format(wish.tax_amount + wish.price || "") })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "addMessage", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxs("ul", { className: "row", children: [
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("label", { children: "Add Message " }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              onKeyUp: (e) => setData("message", e.target.value),
              placeholder: "Write message in under 800 Words...",
              defaultValue: data.message
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-red-600", children: errors.message })
        ] }),
        /* @__PURE__ */ jsx("li", { className: "w-100 mt-3", children: /* @__PURE__ */ jsxs("div", { className: "row", children: [
          /* @__PURE__ */ jsxs("div", { className: "col-md-12 mb-4", children: [
            /* @__PURE__ */ jsx("label", { className: "d-block text-start", children: "From" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                className: "form-input w-100 rounded",
                onChange: (e) => setData("name", e.target.value),
                value: data.name,
                type: "text",
                placeholder: "Enter Your Name..."
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-red-600", children: errors.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-md-12 mb-4", children: [
            /* @__PURE__ */ jsx("label", { className: "d-block text-start", children: "Email " }),
            /* @__PURE__ */ jsx("p", { className: "text-small text-muted mb-1", children: "Your e-mail remains private. It is used for the creator to reply to your gift with a message via Spenny Piggy" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                className: `${auth && auth.user && auth.user.email ? "disabled" : ""} form-input w-100 rounded`,
                value: data.email,
                disabled: auth && auth.user && auth.user.email ? true : false,
                onChange: (e) => setData("email", e.target.value),
                type: "email",
                placeholder: "Enter Your Email..."
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-red-600", children: errors.email })
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
                    onChange: (e) => setData("agree", e.target.checked),
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
      /* @__PURE__ */ jsx("div", { className: "mt-4 d-flex align-items-center justify-content-center", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: `${!data.agree || processing ? "disabled" : ""} btn-pink md px-4 mt-3 text-center`,
          disabled: !data.agree || processing,
          children: processing ? "Processing..." : "Subscribe"
        }
      ) })
    ] }) })
  ] }) }) });
}
export {
  SubCheckout as default
};
