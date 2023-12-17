import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
const sharewishimg01 = "/build/assets/sharewishimg01-7fba8c3e.png";
const receivegiftimg = "/build/assets/receivegiftimg-7cf2a624.png";
const thankfansimg = "/build/assets/thankfansimg-b231db93.png";
function FunPart() {
  return /* @__PURE__ */ jsx("div", { className: "funpart", children: /* @__PURE__ */ jsxs("div", { className: "containerbox", children: [
    /* @__PURE__ */ jsxs("h2", { className: "headingMd text-shadow-black", children: [
      "let’s dive into ",
      /* @__PURE__ */ jsx("br", {}),
      " the fun part",
      " "
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "funboxs mintbg shadow-black border-black mb-10", children: [
      /* @__PURE__ */ jsx("div", { className: "funboximg", children: /* @__PURE__ */ jsx(
        LazyLoadImage,
        {
          alt: "image",
          useIntersectionObserver: true,
          effect: "blur",
          height: 326,
          src: sharewishimg01,
          width: 468
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "funcnt", children: [
        /* @__PURE__ */ jsxs("h3", { className: "headingSm text-shadow-black mb-3", children: [
          "Create & share ",
          /* @__PURE__ */ jsx("br", {}),
          " your Wishlist"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-CeraGR", children: "Join Spenny Piggy, add items to your Wishlist and start sharing your page just in minutes!" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "funboxs pinkbg shadow-black border-black mb-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "funcnt", children: [
        /* @__PURE__ */ jsxs("h3", { className: "headingSm text-shadow-black mb-3 text-purple", children: [
          "Receive gifts ",
          /* @__PURE__ */ jsx("br", {}),
          " from your fans"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-CeraGR text-wh", children: "Cash Gift, Secret Gift, Surprise Gift, Crowdfunding Gifts! There are many ways your fans can support you on Spenny Piggy" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "funboximg", children: /* @__PURE__ */ jsx(
        LazyLoadImage,
        {
          alt: "image",
          useIntersectionObserver: true,
          effect: "blur",
          height: 298,
          src: receivegiftimg,
          width: 490
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "funboxs bluebg shadow-black border-black mb-10", children: [
      /* @__PURE__ */ jsx("div", { className: "funboximg", children: /* @__PURE__ */ jsx(
        LazyLoadImage,
        {
          alt: "image",
          height: 278,
          useIntersectionObserver: true,
          effect: "blur",
          src: thankfansimg,
          width: 430
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "funcnt", children: [
        /* @__PURE__ */ jsxs("h3", { className: "headingSm text-shadow-black mb-3 text-pink", children: [
          "Thank your ",
          /* @__PURE__ */ jsx("br", {}),
          " fans!"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-CeraGR text-wh", children: "Showcase your gift with a shout-out on your socials or thank your fans directly on Spenny Piggy via a personal text or video message." })
      ] })
    ] })
  ] }) });
}
export {
  FunPart as default
};
