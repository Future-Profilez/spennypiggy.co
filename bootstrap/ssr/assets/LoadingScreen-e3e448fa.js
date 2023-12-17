import { jsxs, jsx } from "react/jsx-runtime";
import "react";
const loading = "/build/assets/loading-849cd90c.gif";
function LoadingScreen() {
  return /* @__PURE__ */ jsxs("div", { className: "loadingwrap  flex justify-center items-center content-center flex-wrap p-4  ", children: [
    /* @__PURE__ */ jsx("div", { className: "noresultimg mb-3", children: /* @__PURE__ */ jsx("img", { alt: "img", src: loading }) }),
    /* @__PURE__ */ jsx("h6", { className: "headingLg loadingtext w-full text-center shadow-yellow mb-5", children: "Loading..." })
  ] });
}
export {
  LoadingScreen as default
};
