import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import Popup from "./Popup-7b8a2e20.js";
import { useForm } from "@inertiajs/react";
import { useState } from "react";
import "react-hot-toast";
import "react-bootstrap/Modal";
function Social({ links }) {
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const [close, setClose] = useState();
  const { data, setData, post, processing, errors, reset } = useForm({
    twitter: (links == null ? void 0 : links.twitter) ? links.twitter : "",
    whoyouinto: (links == null ? void 0 : links.whoyouinto) ? links.whoyouinto : "",
    reddit: (links == null ? void 0 : links.reddit) ? links.reddit : "",
    instagram: (links == null ? void 0 : links.instagram) ? links.instagram : "",
    discord: (links == null ? void 0 : links.discord) ? links.discord : "",
    onlyfans: (links == null ? void 0 : links.onlyfans) ? links.onlyfans : "",
    loyalfans: (links == null ? void 0 : links.loyalfans) ? links.loyalfans : "",
    fansly: (links == null ? void 0 : links.fansly) ? links.fansly : "",
    manyvids: (links == null ? void 0 : links.manyvids) ? links.manyvids : "",
    other: (links == null ? void 0 : links.other) ? links.other : ""
  });
  const createSocial = (e) => {
    e.preventDefault();
    post(route("save_social_links"), {
      preserveScroll: true,
      onSuccess: (resp2) => {
        var _a, _b, _c, _d;
        reset();
        if ((_a = resp2.props.flash) == null ? void 0 : _a.success) {
          successAlert(((_b = resp2.props.flash) == null ? void 0 : _b.success) || "Updated successfully.");
        }
        if ((_c = resp2.props.flash) == null ? void 0 : _c.error) {
          errorAlert(((_d = resp2.props.flash) == null ? void 0 : _d.error) || "Something went wrong.");
        }
        setClose(false);
        setTimeout(() => {
          setClose();
        }, 100);
      },
      onError: (_err) => {
        var _a;
        console.error(_err);
        errorsHandling(_err);
        errorAlert(((_a = resp.props.flash) == null ? void 0 : _a.success) || "Added");
      }
    });
  };
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
    Popup,
    {
      action: close,
      space: "4",
      modalclassName: "pinkmodal",
      size: "md",
      classes: "",
      text: "Add Socials",
      children: /* @__PURE__ */ jsx("div", { className: "editprofileModalInner  ", children: /* @__PURE__ */ jsxs("div", { className: "swishinfo", children: [
        /* @__PURE__ */ jsx("h2", { className: "pb-4 font-GillSans text-center text-uppercase", children: "Social Links" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: createSocial, children: [
          /* @__PURE__ */ jsxs("ul", { className: " ps-0  row", children: [
            /* @__PURE__ */ jsxs("li", { className: "mb-4 col-md-6", children: [
              /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "Whoyouinto" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "whoyouinto",
                  name: "whoyouinto",
                  type: "text",
                  placeholder: "URL",
                  value: (data == null ? void 0 : data.whoyouinto) || "",
                  className: "form-input px-2 py-2 border w-full rounded-md",
                  onChange: (e) => setData("whoyouinto", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "mb-4 col-md-6", children: [
              /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "Twitter" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "twitter",
                  name: "twitter",
                  type: "text",
                  placeholder: "URL",
                  value: (data == null ? void 0 : data.twitter) || "",
                  className: "form-input px-2 py-2 border w-full rounded-md",
                  onChange: (e) => setData("twitter", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "mb-4 col-md-6", children: [
              /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "Instagram " }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "instagram",
                  type: "text",
                  placeholder: "URL",
                  name: "instagram",
                  value: (data == null ? void 0 : data.instagram) || "",
                  className: "form-input px-2 py-2 border w-full rounded-md",
                  onChange: (e) => setData("instagram", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "mb-4 col-md-6", children: [
              /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "Reddit" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "reddit",
                  name: "reddit",
                  type: "text",
                  placeholder: "URL",
                  value: (data == null ? void 0 : data.reddit) || "",
                  className: "form-input px-2 py-2 border w-full rounded-md",
                  onChange: (e) => setData("reddit", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "mb-4 col-md-6", children: [
              /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "Discord" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "discord",
                  name: "discord",
                  type: "text",
                  placeholder: "URL",
                  value: (data == null ? void 0 : data.discord) || "",
                  className: "form-input px-2 py-2 border w-full rounded-md",
                  onChange: (e) => setData("discord", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "mb-4 col-md-6", children: [
              /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "OnlyFans" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "onlyfans",
                  name: "onlyfans",
                  type: "text",
                  placeholder: "URL",
                  value: (data == null ? void 0 : data.onlyfans) || "",
                  className: "form-input px-2 py-2 border w-full rounded-md",
                  onChange: (e) => setData("onlyfans", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "mb-4 col-md-6", children: [
              /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "LoyalFans" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "loyalfans",
                  name: "loyalfans",
                  type: "text",
                  placeholder: "URL",
                  value: (data == null ? void 0 : data.loyalfans) || "",
                  className: "form-input px-2 py-2 border w-full rounded-md",
                  onChange: (e) => setData("loyalfans", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "mb-4 col-md-6", children: [
              /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "Fansly" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "fansly",
                  name: "fansly",
                  type: "text",
                  placeholder: "URL",
                  value: (data == null ? void 0 : data.fansly) || "",
                  className: "form-input px-2 py-2 border w-full rounded-md",
                  onChange: (e) => setData("fansly", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "mb-4 col-md-6", children: [
              /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "ManyVids" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "manyvids",
                  name: "manyvids",
                  type: "text",
                  placeholder: "URL",
                  value: (data == null ? void 0 : data.manyvids) || "",
                  className: "form-input px-2 py-2 border w-full rounded-md",
                  onChange: (e) => setData("manyvids", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "mb-4 col-md-6", children: [
              /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "Other" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "other",
                  name: "other",
                  type: "text",
                  placeholder: "URL",
                  value: (data == null ? void 0 : data.other) || "",
                  className: "form-input px-2 py-2 border w-full rounded-md",
                  onChange: (e) => setData("other", e.target.value)
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            LoaderButton,
            {
              disabled: processing,
              type: "submit",
              className: " flex btn-pink sm w-100 mx-auto",
              spinnerClassName: "fill-red-600",
              children: processing ? "Processing" : "Add Links"
            }
          )
        ] })
      ] }) })
    }
  ) });
}
export {
  Social as default
};
