import { jsx, Fragment } from "react/jsx-runtime";
import Popup from "./Popup-7b8a2e20.js";
import { useState } from "react";
import "react-bootstrap/Modal";
function ContentPrefrences(props) {
  useState(true);
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
    Popup,
    {
      space: "0",
      modalclassName: "pinkmodal",
      size: "md",
      text: "Consent Preferences",
      classes: `${props.classes} content-pre `,
      children: /* @__PURE__ */ jsx("div", { className: "content-pr-modal", children: /* @__PURE__ */ jsx("iframe", { src: "https://app.termly.io/notify/696baafc-17cd-4a28-b758-a8f597cf2ad6" }) })
    }
  ) });
}
export {
  ContentPrefrences as default
};
