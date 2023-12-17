import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import Popup from "./Popup-7b8a2e20.js";
import { G as GlobalUploader, s as st } from "./uploader.module-d5dbf507.js";
import { useState } from "react";
import "react-bootstrap/Modal";
import "@uploadcare/blocks";
function UpdateAvatar({ getImageUID, text, close, type }) {
  const [clear, setClear] = useState();
  const [ClosePop, setClosePop] = useState(close || null);
  const [file, setFile] = useState();
  const getFileUID = async (data) => {
    setFile(data);
  };
  const updateImage = () => {
    getImageUID(file);
    setClear(/* @__PURE__ */ new Date());
    setClosePop(false);
    setTimeout(() => {
      setClosePop();
    }, 1e3);
  };
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(Popup, { modalclassName: "updateavatar", action: ClosePop, text, children: /* @__PURE__ */ jsx("div", { className: "editprofileModal  innermodal  ", children: /* @__PURE__ */ jsxs("div", { className: "editprofileModalInner shadow-pink  p-4", children: [
    /* @__PURE__ */ jsxs("h2", { className: "updateprofile", children: [
      " Update ",
      type == "cover" ? "Cover" : "Profile",
      " Image "
    ] }),
    /* @__PURE__ */ jsx("div", { className: "py-4", children: /* @__PURE__ */ jsx(GlobalUploader, { clear, sendFile: getFileUID, options: st.profileimage }) }),
    /* @__PURE__ */ jsx("button", { onClick: updateImage, className: "btn-pink sm w-100", children: "Confirm" })
  ] }) }) }) });
}
export {
  UpdateAvatar as default
};
