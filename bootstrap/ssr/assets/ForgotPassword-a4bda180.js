import { jsxs, jsx } from "react/jsx-runtime";
import { G as Guest } from "./GuestLayout-4a28627b.js";
import { I as InputError } from "./InputError-eb0c91b3.js";
import { T as TextInput } from "./TextInput-1224a4d9.js";
import { useForm, Head, Link } from "@inertiajs/react";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import axios from "axios";
import { useState } from "react";
import "react-hot-toast";
function ForgotPassword(props) {
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const { status, auth } = props;
  const { data, setData, post, processing, errors } = useForm({
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    axios.post(`forgot-password`, { email: data.email }).then((resp) => {
      console.log("resp", resp);
      if (resp.data.status) {
        successAlert(resp.data.message);
        setData("email", "");
      } else {
        errorAlert(resp.data.message);
      }
      setLoading(false);
    }).catch((_err) => {
      console.error("error", _err);
      errorAlert("Unable to update quantity.");
      setQuantity(intialItem);
      setLoading(false);
    });
  };
  return /* @__PURE__ */ jsxs(Guest, { auth: auth && auth.user, user: auth && auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Forgot Password" }),
    /* @__PURE__ */ jsx("div", { className: "loginPage blackbg py-14", children: /* @__PURE__ */ jsxs("div", { className: "containerbox ", children: [
      /* @__PURE__ */ jsx("h2", { className: "headingLg pb-0 pb-md-4 text-center px-3", children: "Forgot password ?" }),
      /* @__PURE__ */ jsxs("p", { className: "text-center text-white mb-5 text-large m-auto", children: [
        "Have an another account ?",
        " ",
        /* @__PURE__ */ jsxs(Link, { className: "text-pink", href: route("login"), children: [
          " ",
          "Log In"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "loginform mt-4 mt-md-5 mx-auto border-black whbg shadow-mint", children: [
        /* @__PURE__ */ jsxs("div", { className: "loginheadbox pinkbg", children: [
          /* @__PURE__ */ jsx("span", { className: "mintbg" }),
          /* @__PURE__ */ jsx("span", { className: "bluebg" })
        ] }),
        status && /* @__PURE__ */ jsx("div", { className: "mb-4 font-medium text-sm text-green-600", children: status }),
        /* @__PURE__ */ jsx("form", { onSubmit: submit, children: /* @__PURE__ */ jsxs("div", { className: "login-step1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-start text-dark mb-2 text-md m-auto", children: "Forgot your password?" }),
          /* @__PURE__ */ jsx("p", { className: "text-start text-muted mb-5 text-small m-auto", children: "No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one." }),
          /* @__PURE__ */ jsx("ul", { children: /* @__PURE__ */ jsxs("li", { className: "mb-0", children: [
            /* @__PURE__ */ jsx("label", { children: "Email Address" }),
            /* @__PURE__ */ jsx(
              TextInput,
              {
                id: "email",
                required: "required",
                type: "email",
                placeholder: "Enter your email address",
                name: "email",
                value: data.email,
                className: "mt-1 block w-full",
                isFocused: true,
                onChange: (e) => setData("email", e.target.value)
              }
            ),
            /* @__PURE__ */ jsx(
              InputError,
              {
                message: errors.email,
                className: "mt-2"
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "wishlistbtn mt-3  mb-0 text-center flex justify-center ", children: /* @__PURE__ */ jsx(
              LoaderButton,
              {
                disabled: loading,
                className: "btn-pink mb-2 w-100 lg lg2  mb-md-0",
                spinnerClassName: "fill-red-600",
                children: loading ? "Sending..." : "Email Password Reset Link"
              }
            ) })
          ] }) })
        ] }) })
      ] })
    ] }) })
  ] });
}
export {
  ForgotPassword as default
};
