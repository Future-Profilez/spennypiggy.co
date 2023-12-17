import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
const payoutimg = "/build/assets/payoutimg-78efbc74.png";
const fraudprotecicon = "/build/assets/fraudprotecicon-245f49a6.png";
const twowayicon = "/build/assets/twowayicon-a32f5a3c.png";
function WhyLove() {
  return /* @__PURE__ */ jsx("div", { className: "whylove pinkbg", children: /* @__PURE__ */ jsx("div", { className: "containerbox", children: /* @__PURE__ */ jsxs("div", { className: "whylovebox", children: [
    /* @__PURE__ */ jsxs("h2", { className: "headingMd text-shadow-black text-mint text-center w-full mb-16", children: [
      "Why we love ",
      /* @__PURE__ */ jsx("br", {}),
      " Spenny piggy"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "loveboxes", children: [
      /* @__PURE__ */ jsx(
        LazyLoadImage,
        {
          alt: "image",
          height: "auto",
          useIntersectionObserver: true,
          effect: "blur",
          src: payoutimg,
          width: "auto"
        }
      ),
      /* @__PURE__ */ jsx("h3", { className: "headingSm text-shadow-black text-mint", children: "100% payout" }),
      /* @__PURE__ */ jsx("p", { className: "text-wh", children: "We're all about creators, so they get every cent they earn - no middlemen." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "loveboxes", children: [
      /* @__PURE__ */ jsx(
        LazyLoadImage,
        {
          alt: "image",
          useIntersectionObserver: true,
          effect: "blur",
          height: "auto",
          src: fraudprotecicon,
          width: "auto"
        }
      ),
      /* @__PURE__ */ jsxs("h3", { className: "headingSm text-shadow-black text-mint", children: [
        "Fraud ",
        /* @__PURE__ */ jsx("br", {}),
        " protection"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-wh", children: "Your earnings are secure with us; we've got your back." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "loveboxes", children: [
      /* @__PURE__ */ jsx(
        LazyLoadImage,
        {
          alt: "image",
          height: "auto",
          useIntersectionObserver: true,
          effect: "blur",
          src: twowayicon,
          width: "auto"
        }
      ),
      /* @__PURE__ */ jsxs("h3", { className: "headingSm text-shadow-black text-mint", children: [
        "Two way ",
        /* @__PURE__ */ jsx("br", {}),
        " anonymity"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-wh", children: "Privacy for both fans and creators - because discretion matters." })
    ] })
  ] }) }) });
}
export {
  WhyLove as default
};
