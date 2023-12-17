import { jsx, Fragment } from "react/jsx-runtime";
import toast from "react-hot-toast";
function ShareProfile({ children, username, classes, custom }) {
  function shareTo() {
    const width = window && window.innerWidth;
    const currentURL = custom ? custom : window.location.href;
    if (width > 991) {
      navigator.clipboard.writeText(currentURL);
      toast.success("Copied to Clipboard.");
    } else {
      navigator.share({
        url: currentURL,
        title: username ? username : "Spenny Piggy"
      });
    }
  }
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("button", { className: classes, onClick: shareTo, children }) });
}
export {
  ShareProfile as default
};
