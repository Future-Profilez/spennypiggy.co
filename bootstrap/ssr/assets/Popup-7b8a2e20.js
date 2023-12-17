import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
function Popup(props) {
  const { children, text, classes, action, custom, size, space, modalclass } = props;
  const [open, setOpen] = useState(false);
  useRef(null);
  useEffect(() => {
    if (action === false || void 0) {
      setOpen(false);
    }
    if (action === true) {
      setOpen(true);
    }
  }, [action]);
  const closeModal = () => {
    props.onHide;
    setOpen(false);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("button", { onClick: () => setOpen(true), className: classes, children: text }),
    /* @__PURE__ */ jsx(
      Modal,
      {
        onHide: () => setOpen(false),
        size: size || "md",
        show: open,
        "aria-labelledby": "contained-modal-title-vcenter",
        centered: true,
        className: modalclass,
        children: /* @__PURE__ */ jsxs(Modal.Body, { className: `p-${space || 0} `, children: [
          /* @__PURE__ */ jsxs("button", { onClick: closeModal, className: "absolute right-5 top-5 z-2", children: [
            " ",
            /* @__PURE__ */ jsxs("svg", { width: "30", height: "30", viewBox: "0 0 30 30", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
              " ",
              /* @__PURE__ */ jsxs("g", { "clip-path": "url(#clip0_386_414)", children: [
                " ",
                /* @__PURE__ */ jsx("path", { d: "M20.5581 23.7753L21 24.2172L21.4419 23.7753L23.7753 21.4419L24.2172 21L23.7753 20.5581L18.2172 15L23.7753 9.44194L24.2172 9L23.7753 8.55806L21.4419 6.22472L21 5.78278L20.5581 6.22472L15 11.7828L9.44194 6.22472L9 5.78278L8.55806 6.22472L6.22472 8.55806L5.78278 9L6.22472 9.44194L11.7828 15L6.22472 20.5581L5.78278 21L6.22472 21.4419L8.55806 23.7753L9 24.2172L9.44194 23.7753L15 18.2172L20.5581 23.7753ZM3.33333 0.625H26.6667C27.385 0.625 28.0738 0.910341 28.5817 1.41825C29.0897 1.92616 29.375 2.61504 29.375 3.33333V26.6667C29.375 27.385 29.0897 28.0738 28.5817 28.5817C28.0738 29.0897 27.385 29.375 26.6667 29.375H3.33333C2.61504 29.375 1.92616 29.0897 1.41825 28.5817C0.910341 28.0738 0.625 27.385 0.625 26.6667V3.33333C0.625 2.61504 0.910341 1.92616 1.41825 1.41825C1.92616 0.910341 2.61504 0.625 3.33333 0.625Z", fill: "#8C52FF", stroke: "black", strokeWidth: "1.25" }),
                " "
              ] }),
              " ",
              /* @__PURE__ */ jsxs("defs", { children: [
                " ",
                /* @__PURE__ */ jsxs("clipPath", { id: "clip0_386_414", children: [
                  " ",
                  /* @__PURE__ */ jsx("rect", { width: "30", height: "30", fill: "white" }),
                  " "
                ] }),
                " "
              ] }),
              " "
            ] }),
            " "
          ] }),
          children
        ] })
      }
    )
  ] });
}
export {
  Popup as default
};
