import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import { G as GlobalUploader, s as st } from "./uploader.module-d5dbf507.js";
import axios from "axios";
import { useState, useEffect } from "react";
import "react-hot-toast";
import "@uploadcare/blocks";
function SayThanks(props) {
  const { name, payment_id, getMessageStatus, clearAction } = props;
  const [clear, setClear] = useState();
  useEffect(() => {
    setClear(clearAction);
  }, [clearAction]);
  const [msgMedia, setMsgMedia] = useState();
  const getFileUID = async (data) => {
    setMsgMedia(data);
  };
  const [close, setClose] = useState();
  const [message, setMessage] = useState();
  const [loading, setloading] = useState(false);
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const saythankyou = () => {
    if (!message) {
      errorAlert("Message can not be empty.");
      return false;
    }
    setloading(true);
    axios.post(`say-thankyou/${payment_id}`, {
      "messages": message,
      "message_media": msgMedia ? msgMedia : null
    }).then((resp) => {
      if (resp.data.success) {
        successAlert(resp.data.message);
        setClose(false);
        setTimeout(() => {
          setClose();
        }, 1e3);
        getMessageStatus(message, msgMedia);
        setClear(/* @__PURE__ */ new Date());
      } else {
        errorAlert(resp.data.message);
      }
      setloading(false);
    }).catch((_err) => {
      console.error("error", _err);
      setloading(false);
    });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "form-field mb-4 border-top pt-4 mt-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "heading", children: [
        "Send a thankyou note to ",
        name,
        " :"
      ] }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          rows: 5,
          placeholder: "Say Something...",
          className: "form-input w-100 rounded",
          onChange: (e) => setMessage(e.target.value),
          type: "text"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "mb-2 mt-3", children: "Choose Video or Picture" }),
      /* @__PURE__ */ jsx(
        GlobalUploader,
        {
          clear,
          sendFile: getFileUID,
          options: st.thankyoumessage
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      LoaderButton,
      {
        onClick: saythankyou,
        disabled: loading,
        className: "flex px-4  mb-3 btn-pink sm mx-auto",
        spinnerClassName: "fill-red-600",
        children: loading ? "Sending..." : "Say Thanks"
      }
    )
  ] });
}
export {
  SayThanks as default
};
