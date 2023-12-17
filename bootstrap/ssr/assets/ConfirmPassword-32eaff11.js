import { jsxs, jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { G as Guest } from "./GuestLayout-4a28627b.js";
import { I as InputError } from "./InputError-eb0c91b3.js";
import { I as InputLabel } from "./InputLabel-747c5b8a.js";
import { T as TextInput } from "./TextInput-1224a4d9.js";
import { useForm, Head } from "@inertiajs/react";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import "react-hot-toast";
function ConfirmPassword(props) {
  const { uuid, auth } = props;
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const { data, setData, post, processing, errors, reset } = useForm({
    password: "",
    confirmpassword: ""
  });
  useEffect(() => {
    return () => {
      reset("password");
      reset("confirmpassword");
    };
  }, []);
  const submit = (e) => {
    e.preventDefault();
    post(route("changePassword", { uuid }), {
      preserveScroll: true,
      onSuccess: (resp) => {
        var _a, _b, _c, _d;
        if ((_a = resp.props.flash) == null ? void 0 : _a.success) {
          successAlert((_b = resp.props.flash) == null ? void 0 : _b.success);
        }
        if ((_c = resp.props.flash) == null ? void 0 : _c.error) {
          errorAlert((_d = resp.props.flash) == null ? void 0 : _d.error);
        }
        reset();
      },
      onError: (err) => {
        reset("password");
        Object.keys(err).map((key) => {
          errorAlert(err[key]);
        });
      }
    });
  };
  return /* @__PURE__ */ jsxs(Guest, { auth: auth && auth.user, user: auth && auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Confirm Password" }),
    /* @__PURE__ */ jsx("div", { className: "loginPage blackbg py-14", children: /* @__PURE__ */ jsx("div", { className: "containerbox ", children: /* @__PURE__ */ jsxs("div", { className: "loginform mx-auto border-black whbg shadow-mint", children: [
      /* @__PURE__ */ jsxs("div", { className: "loginheadbox pinkbg", children: [
        /* @__PURE__ */ jsx("span", { className: "mintbg" }),
        /* @__PURE__ */ jsx("span", { className: "bluebg" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, children: [
        /* @__PURE__ */ jsx("p", { className: "text-start text-muted mb-5 text-small m-auto", children: "This is a secure area of the application. Please confirm your password before continuing." }),
        /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { className: "mb-0", children: /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
            /* @__PURE__ */ jsx(
              InputLabel,
              {
                htmlFor: "password",
                value: "Password"
              }
            ),
            /* @__PURE__ */ jsx(
              TextInput,
              {
                id: "password",
                type: "password",
                name: "password",
                value: data.password,
                className: "mt-1 block w-full",
                isFocused: true,
                onChange: (e) => setData(
                  "password",
                  e.target.value
                )
              }
            ),
            /* @__PURE__ */ jsx(
              InputError,
              {
                message: errors.password,
                className: "mt-2"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "confirmpassword", children: "Confirm Password" }),
            /* @__PURE__ */ jsx(
              TextInput,
              {
                id: "confirmpassword",
                type: "password",
                name: "confirmpassword",
                value: data.confirmpassword,
                className: "mt-1 block w-full",
                isFocused: true,
                onChange: (e) => setData(
                  "confirmpassword",
                  e.target.value
                )
              }
            ),
            /* @__PURE__ */ jsx(
              InputError,
              {
                message: errors.confirmpassword,
                className: "mt-2"
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ jsx(
          LoaderButton,
          {
            spinnerClassName: "fill-red-600",
            className: "btn-pink w-100 lg lg2 mb-3  mb-md-0",
            disabled: processing,
            children: processing ? "Updating..." : "Confirm"
          }
        )
      ] })
    ] }) }) })
  ] });
}
export {
  ConfirmPassword as default
};
