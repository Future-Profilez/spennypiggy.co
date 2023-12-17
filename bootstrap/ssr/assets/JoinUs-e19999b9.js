import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
function JoinUs() {
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: "joinus blackbg ", children: [
    /* @__PURE__ */ jsx("h2", { className: "headingMd shadow-yellow mb-3 text-center mb-6 ", children: "Join thousands of creators" }),
    /* @__PURE__ */ jsx("p", { className: "text-CeraGR mb-6 text-center mb-16 font-CeraGRBold text-wh mb-5", children: "Create your wishlist and start receiving gift's from your fans right away!" }),
    /* @__PURE__ */ jsx("div", { className: "1text-center rotate-btn text-center flex items-center  justify-center content-center w-full", children: /* @__PURE__ */ jsx(
      Link,
      {
        href: route("register"),
        className: "btn-pink lg w-80 shadow-mint border-mint mb-4 mb-lg-0",
        children: "Join SpennyPiggy "
      }
    ) })
  ] }) });
}
export {
  JoinUs as default
};
