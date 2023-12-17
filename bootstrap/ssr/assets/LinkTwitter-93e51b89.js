import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import "react";
import { useForm } from "@inertiajs/react";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
const twitter = "/build/assets/twitterpost-a8789702.png";
function LinkTwitter(props) {
  const { username } = props;
  const { data, setData, get, processing, errors, reset } = useForm();
  const loginTwitter = (e) => {
    e.preventDefault();
    get(route("x.init"));
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("h2", { className: "text-uppercase font-GillSans pb-4 font-large text-center px-5", children: " Twitter Integration " }),
    /* @__PURE__ */ jsxs("div", { className: "twitter-steps", children: [
      /* @__PURE__ */ jsxs("div", { className: "step-t active", children: [
        /* @__PURE__ */ jsx("div", { className: "step-no ", children: "1" }),
        /* @__PURE__ */ jsx("p", { children: "Link Twitter" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "step-saprate" }),
      /* @__PURE__ */ jsxs("div", { className: `step-t ${username ? "active" : ""}`, children: [
        /* @__PURE__ */ jsx("div", { className: "step-no", children: "2" }),
        /* @__PURE__ */ jsx("p", { children: "Link Settings" })
      ] })
    ] }),
    username ? /* @__PURE__ */ jsx("div", { className: "step2", children: /* @__PURE__ */ jsxs("p", { className: "text-center", children: [
      "Linked Account : @",
      username
    ] }) }) : /* @__PURE__ */ jsxs("div", { className: "step1", children: [
      /* @__PURE__ */ jsx("p", { className: "text-large text-center px-5 mb-4", children: "Set up Twitter to auto tweet when you receive a gift." }),
      /* @__PURE__ */ jsx("div", { className: "twitter-img", children: /* @__PURE__ */ jsx("img", { src: twitter, alt: "twitter", className: "w-100 rounded-lg mt-3" }) }),
      /* @__PURE__ */ jsx(
        LoaderButton,
        {
          onClick: loginTwitter,
          disabled: processing,
          type: "submit",
          className: "flex w-100 btn-pink mt-4 lg mx-auto",
          spinnerClassName: "fill-red-600",
          children: processing ? "Processing.." : "Link Twitter"
        }
      )
    ] })
  ] });
}
export {
  LinkTwitter as default
};
