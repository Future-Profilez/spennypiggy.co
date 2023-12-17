import { jsxs, jsx } from "react/jsx-runtime";
import "./GuestLayout-4a28627b.js";
import { P as PrimaryButton } from "./PrimaryButton-eeb7392f.js";
import { useForm, Head } from "@inertiajs/react";
import { useState } from "react";
import axios from "axios";
import "react-hot-toast";
import "./Alerts-5da797d1.js";
function VerifyEmail({ status }) {
  useForm({});
  const [loading, setLoading] = useState(false);
  const [send, setSent] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    axios.get(`/email/send-verification-email`).then((resp) => {
      setSent(true);
      setLoading(false);
    }).catch((_err) => {
      console.error("error", _err);
      setLoading(false);
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "blackbg pageheight p-4", children: [
    /* @__PURE__ */ jsx("style", { children: `
            .mailicon svg {max-width:200px;}
        ` }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Head, { title: "Email Verification" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "mailicon m-auto d-table", children: /* @__PURE__ */ jsxs("svg", { width: "341", height: "287", viewBox: "0 0 341 287", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
          /* @__PURE__ */ jsx("path", { d: "M54.1393 241.814V237.535H49.8604H31.1628C16.3152 237.535 4.27889 225.499 4.27889 210.651V79.7678C4.27889 64.9202 16.3152 52.8839 31.1628 52.8839H261.767C276.615 52.8839 288.651 64.9202 288.651 79.7677V210.651C288.651 225.499 276.615 237.535 261.767 237.535H102.837H101.26L100.06 238.559L54.1393 277.727V241.814Z", fill: "#F94F97", stroke: "#E6EA7B", "stroke-width": "8.55778" }),
          /* @__PURE__ */ jsx("rect", { x: "266.941", width: "4.62903", height: "33.9462", rx: "2.31452", fill: "#E6EA7B" }),
          /* @__PURE__ */ jsx("rect", { x: "302.994", y: "9.2583", width: "4.62903", height: "33.9462", rx: "2.31452", transform: "rotate(31.1065 302.994 9.2583)", fill: "#E6EA7B" }),
          /* @__PURE__ */ jsx("rect", { x: "327.876", y: "30.0889", width: "4.62903", height: "33.9462", rx: "2.31452", transform: "rotate(57.1905 327.876 30.0889)", fill: "#E6EA7B" }),
          /* @__PURE__ */ jsx("rect", { x: "340.071", y: "62.4917", width: "4.62903", height: "33.9462", rx: "2.31452", transform: "rotate(84.3885 340.071 62.4917)", fill: "#E6EA7B" }),
          /* @__PURE__ */ jsx("path", { d: "M70.207 101.583H232.648V199.048H70.207V101.583Z", fill: "#3CFCCF" }),
          /* @__PURE__ */ jsx("path", { d: "M79.2324 16.7536C79.2324 8.77908 85.6971 2.31445 93.6716 2.31445H189.331L204.673 17.6561L225.429 38.4124V159.341C225.429 167.315 218.965 173.78 210.99 173.78H93.6716C85.6971 173.78 79.2324 167.315 79.2324 159.341V16.7536Z", fill: "#8C52FF" }),
          /* @__PURE__ */ jsx("path", { d: "M189.331 2.31445L225.429 38.4124H194.746C191.755 38.4124 189.331 35.9882 189.331 32.9977V2.31445Z", fill: "#05EFB8" }),
          /* @__PURE__ */ jsx("path", { d: "M146.733 90.07C143.724 93.0795 138.844 93.0795 135.835 90.07L128.659 82.8938C126.603 80.8381 126.603 77.5052 128.659 75.4495C130.717 73.3916 134.054 73.3941 136.109 75.455L140.475 79.8342C140.921 80.2822 141.647 80.2825 142.094 79.835L163.569 58.3386C165.625 56.2801 168.961 56.2793 171.019 58.3367C173.075 60.3934 173.075 63.728 171.019 65.7847L146.733 90.07Z", fill: "#05EFB8" }),
          /* @__PURE__ */ jsx("g", { filter: "url(#filter0_d_1039_862)", children: /* @__PURE__ */ jsx("path", { d: "M70.207 101.583L149.623 145.803L70.207 199.048V101.583Z", fill: "#05EFB8" }) }),
          /* @__PURE__ */ jsx("g", { filter: "url(#filter1_d_1039_862)", children: /* @__PURE__ */ jsx("path", { d: "M232.648 101.583L153.233 145.803L232.648 199.048V101.583Z", fill: "#05EFB8" }) }),
          /* @__PURE__ */ jsx("g", { filter: "url(#filter2_d_1039_862)", children: /* @__PURE__ */ jsx("path", { d: "M70.207 199.048L139.714 130.359C143.767 126.354 150.231 126.174 154.5 129.949L232.648 199.048H70.207Z", fill: "#05EFB8" }) }),
          /* @__PURE__ */ jsxs("defs", { children: [
            /* @__PURE__ */ jsxs("filter", { id: "filter0_d_1039_862", x: "70.207", y: "88.9492", width: "119.123", height: "122.733", filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB", children: [
              /* @__PURE__ */ jsx("feFlood", { "flood-opacity": "0", result: "BackgroundImageFix" }),
              /* @__PURE__ */ jsx("feColorMatrix", { in: "SourceAlpha", type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0", result: "hardAlpha" }),
              /* @__PURE__ */ jsx("feOffset", { dx: "27.0735" }),
              /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: "6.31714" }),
              /* @__PURE__ */ jsx("feComposite", { in2: "hardAlpha", operator: "out" }),
              /* @__PURE__ */ jsx("feColorMatrix", { type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" }),
              /* @__PURE__ */ jsx("feBlend", { mode: "normal", in2: "BackgroundImageFix", result: "effect1_dropShadow_1039_862" }),
              /* @__PURE__ */ jsx("feBlend", { mode: "normal", in: "SourceGraphic", in2: "effect1_dropShadow_1039_862", result: "shape" })
            ] }),
            /* @__PURE__ */ jsxs("filter", { id: "filter1_d_1039_862", x: "113.526", y: "88.9492", width: "119.123", height: "122.733", filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB", children: [
              /* @__PURE__ */ jsx("feFlood", { "flood-opacity": "0", result: "BackgroundImageFix" }),
              /* @__PURE__ */ jsx("feColorMatrix", { in: "SourceAlpha", type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0", result: "hardAlpha" }),
              /* @__PURE__ */ jsx("feOffset", { dx: "-27.0735" }),
              /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: "6.31714" }),
              /* @__PURE__ */ jsx("feComposite", { in2: "hardAlpha", operator: "out" }),
              /* @__PURE__ */ jsx("feColorMatrix", { type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" }),
              /* @__PURE__ */ jsx("feBlend", { mode: "normal", in2: "BackgroundImageFix", result: "effect1_dropShadow_1039_862" }),
              /* @__PURE__ */ jsx("feBlend", { mode: "normal", in: "SourceGraphic", in2: "effect1_dropShadow_1039_862", result: "shape" })
            ] }),
            /* @__PURE__ */ jsxs("filter", { id: "filter2_d_1039_862", x: "57.5727", y: "100.159", width: "187.709", height: "98.8894", filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB", children: [
              /* @__PURE__ */ jsx("feFlood", { "flood-opacity": "0", result: "BackgroundImageFix" }),
              /* @__PURE__ */ jsx("feColorMatrix", { in: "SourceAlpha", type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0", result: "hardAlpha" }),
              /* @__PURE__ */ jsx("feOffset", { dy: "-14.4392" }),
              /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: "6.31714" }),
              /* @__PURE__ */ jsx("feComposite", { in2: "hardAlpha", operator: "out" }),
              /* @__PURE__ */ jsx("feColorMatrix", { type: "matrix", values: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" }),
              /* @__PURE__ */ jsx("feBlend", { mode: "normal", in2: "BackgroundImageFix", result: "effect1_dropShadow_1039_862" }),
              /* @__PURE__ */ jsx("feBlend", { mode: "normal", in: "SourceGraphic", in2: "effect1_dropShadow_1039_862", result: "shape" })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("h3", { className: "headingSm shadow-yellow mb-3 text-center", children: "Confirm your email" }),
        /* @__PURE__ */ jsx("h5", { className: "font-large  text-center text-mint w-75 m-auto d-table", children: "Thanks for signing up! Before getting started, please verify your email." }),
        /* @__PURE__ */ jsx("form", { onSubmit: submit, children: /* @__PURE__ */ jsx("div", { className: "mt-4 flex items-center justify-content-center", children: /* @__PURE__ */ jsx(PrimaryButton, { className: "btn-pink md   py-3 px-2", disabled: loading, children: loading ? "Sending..." : send ? " Email Sent" : "Send Verification Link" }) }) })
      ] })
    ] })
  ] });
}
export {
  VerifyEmail as default
};
