import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { Head } from "@inertiajs/react";
import { A as Authenticated } from "./AuthenticatedLayout-57b60e02.js";
import JoinUs from "./JoinUs-e19999b9.js";
import "react-hot-toast";
import "./Alerts-5da797d1.js";
const vishitimg01 = "/build/assets/vishitimg01-d5d0c2e2.png";
const giftbasketimg01 = "/build/assets/giftbasketimg01-a84cd464.png";
const fundbasketimg01 = "/build/assets/fundbasketimg01-fcfb1753.png";
const yourwishlist01 = "/build/assets/yourwishlist01-74dcdb2e.png";
const setuppaymentimg01 = "/build/assets/setuppaymentimg01-a3950941.png";
const sharlinkimg = "/build/assets/sharlinkimg-4429113a.png";
function Works(props) {
  const { auth } = props;
  return /* @__PURE__ */ jsxs(Authenticated, { auth: (auth == null ? void 0 : auth.user) || "", children: [
    /* @__PURE__ */ jsx(Head, { title: "How it works" }),
    /* @__PURE__ */ jsxs("div", { className: "pt-20 howitmain", children: [
      /* @__PURE__ */ jsxs("div", { className: "containerbox", children: [
        /* @__PURE__ */ jsx("h2", { className: "headingMd text-shadow-black text-center mb-4", children: "How it works" }),
        /* @__PURE__ */ jsxs("p", { className: "text-center", children: [
          "Setting up your wishlist on Spenny Piggy only takes a few minutes. Add gifts from our ",
          /* @__PURE__ */ jsx("br", {}),
          " partner brand catalog or any other retailer in the world."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "howWorkTab mt-12 pb-12 mx-auto", children: /* @__PURE__ */ jsxs(Tabs, { defaultActiveKey: "1", id: "uncontrolled-tab-example", className: "mb-3", children: [
          /* @__PURE__ */ jsxs(Tab, { eventKey: "1", title: "for Gifters", children: [
            /* @__PURE__ */ jsxs("div", { className: "funboxs mintbg shadow-black border-black mb-10", children: [
              /* @__PURE__ */ jsx("div", { className: "funboximg", children: /* @__PURE__ */ jsx("img", { src: vishitimg01, alt: "img" }) }),
              /* @__PURE__ */ jsxs("div", { className: "funcnt", children: [
                /* @__PURE__ */ jsx("h5", { className: "text-voilet mb-2", children: "STEP 1" }),
                /* @__PURE__ */ jsxs("h3", { className: "headingSm text-shadow-black mb-3", children: [
                  "Visit A ",
                  /* @__PURE__ */ jsx("br", {}),
                  " Wishlist"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-CeraGR", children: "Browse your favorite creator's wishes on their wishlist. From items, to outing, to treats, you can see everything your creator wishes for and add them to your gift basket." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "funboxs pinkbg shadow-black border-black mb-10", children: [
              /* @__PURE__ */ jsxs("div", { className: "funcnt", children: [
                /* @__PURE__ */ jsx("h5", { className: "text-voilet text-black mb-2", children: "STEP 2" }),
                /* @__PURE__ */ jsxs("h3", { className: "headingSm text-shadow-black mb-3 text-purple", children: [
                  "Create a Gift ",
                  /* @__PURE__ */ jsx("br", {}),
                  "  Basket"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-CeraGR text-wh", children: "Pick one or more items to add to your gift basket" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "funboximg", children: /* @__PURE__ */ jsx("img", { src: giftbasketimg01, alt: "img" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "funboxs bluebg shadow-black border-black mb-10", children: [
              /* @__PURE__ */ jsx("div", { className: "funboximg", children: /* @__PURE__ */ jsx("img", { src: fundbasketimg01, alt: "img" }) }),
              /* @__PURE__ */ jsxs("div", { className: "funcnt", children: [
                /* @__PURE__ */ jsx("h5", { className: "text-mint mb-2", children: "STEP 3" }),
                /* @__PURE__ */ jsxs("h3", { className: "headingSm text-shadow-black mb-3 text-pink", children: [
                  "Fund Basket ",
                  /* @__PURE__ */ jsx("br", {}),
                  " with Message"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-CeraGR text-wh", children: "You can choose to leave a message and a pseudonym. Your email will be kept hidden, but we will relay any picture messages from the creator to this email." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Tab, { eventKey: "2", title: "for wishers", children: [
            /* @__PURE__ */ jsxs("div", { className: "funboxs mintbg shadow-black border-black mb-10", children: [
              /* @__PURE__ */ jsx("div", { className: "funboximg", children: /* @__PURE__ */ jsx("img", { src: yourwishlist01, alt: "img" }) }),
              /* @__PURE__ */ jsxs("div", { className: "funcnt", children: [
                /* @__PURE__ */ jsx("h5", { className: "text-voilet mb-2", children: "STEP 1" }),
                /* @__PURE__ */ jsxs("h3", { className: "headingSm text-shadow-black mb-3", children: [
                  "Create Your ",
                  /* @__PURE__ */ jsx("br", {}),
                  " Wishlist"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-CeraGR", children: "Add items from any online store or manually add offline wishes. With our custom gift entry, you can get creative. List full outfits, trips to the spa, shopping sprees, and more." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "funboxs pinkbg shadow-black border-black mb-10", children: [
              /* @__PURE__ */ jsxs("div", { className: "funcnt", children: [
                /* @__PURE__ */ jsx("h5", { className: "text-voilet text-black mb-2", children: "STEP 2" }),
                /* @__PURE__ */ jsxs("h3", { className: "headingSm text-shadow-black mb-3 text-purple", children: [
                  "Set up your ",
                  /* @__PURE__ */ jsx("br", {}),
                  " payments"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-CeraGR text-wh", children: "Using our secure established third party payment processor, set up your payments. This information is never seen by your gifter." })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "funboximg", children: /* @__PURE__ */ jsx("img", { src: setuppaymentimg01, alt: "img" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "funboxs bluebg shadow-black border-black mb-10", children: [
              /* @__PURE__ */ jsx("div", { className: "funboximg", children: /* @__PURE__ */ jsx("img", { src: sharlinkimg, alt: "img" }) }),
              /* @__PURE__ */ jsxs("div", { className: "funcnt", children: [
                /* @__PURE__ */ jsx("h5", { className: "text-mint mb-2", children: "STEP 3" }),
                /* @__PURE__ */ jsxs("h3", { className: "headingSm text-shadow-black mb-3 text-pink", children: [
                  "Share links to ",
                  /* @__PURE__ */ jsx("br", {}),
                  " different ",
                  /* @__PURE__ */ jsx("br", {}),
                  " platforms "
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-CeraGR text-wh", children: "Showcase your gift with a shout-out on your socials or thank your fans directly on Spenny Piggy via a personal text or video message." })
              ] })
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(JoinUs, {})
    ] })
  ] });
}
export {
  Works as default
};
