import { jsx, Fragment } from "react/jsx-runtime";
import * as LR from "@uploadcare/blocks";
import { useRef, useCallback, useEffect } from "react";
LR.registerBlocks(LR);
function GlobalUploader({ options, sendFile, clear }) {
  const dataOutputRef = useRef();
  const handleUploaderEvent = useCallback((e) => {
    const { data } = e.detail;
    sendFile(data[0]);
  }, []);
  const handleResetUploader = () => {
    if (dataOutputRef.current) {
      dataOutputRef.current.uploadCollection.clearAll();
      dataOutputRef.current.$["*modalActive"] = false;
    }
  };
  useEffect(() => {
    handleResetUploader();
  }, [clear]);
  useEffect(() => {
    const el = dataOutputRef && dataOutputRef.current;
    el && el.addEventListener("lr-data-output", handleUploaderEvent);
    return () => {
      el && el.removeEventListener("lr-data-output", handleUploaderEvent);
    };
  }, [handleUploaderEvent]);
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
    "lr-file-uploader-minimal",
    {
      class: options,
      "css-src": "https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.25.0/web/lr-file-uploader-minimal.min.css",
      children: /* @__PURE__ */ jsx(
        "lr-data-output",
        {
          "use-event": true,
          ref: dataOutputRef,
          hidden: true,
          "use-template": true,
          class: options,
          onEvent: handleUploaderEvent
        }
      )
    }
  ) });
}
const wishitemUploader = "_wishitemUploader_81p7t_1";
const profileimage = "_profileimage_81p7t_26";
const thankyoumessage = "_thankyoumessage_81p7t_51";
const st = {
  wishitemUploader,
  profileimage,
  thankyoumessage
};
export {
  GlobalUploader as G,
  st as s
};
