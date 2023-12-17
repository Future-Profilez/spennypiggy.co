import { jsxs, jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { G as Guest } from "./GuestLayout-4a28627b.js";
import { useForm, Head, Link } from "@inertiajs/react";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import "react-hot-toast";
function Login({ status, canResetPassword }) {
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false
  });
  useEffect(() => {
    return () => {
      reset("password");
    };
  }, []);
  const submit = (e) => {
    e.preventDefault();
    post(route("login-user"), {
      preserveScroll: true,
      onSuccess: (resp) => {
        localStorage.removeItem("cart");
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
  return /* @__PURE__ */ jsxs(Guest, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Log in" }),
    status && /* @__PURE__ */ jsx("div", { className: "mb-4 font-medium text-sm text-green-600", children: status }),
    /* @__PURE__ */ jsxs("div", { className: "loginPage blackbg px-3 py-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "headingLg mb-3 text-center ", children: "Welcome Back !" }),
      /* @__PURE__ */ jsxs("p", { className: "text-center text-white mb-5 font-CeraGRBold", children: [
        "Don't have an account? ",
        /* @__PURE__ */ jsx(Link, { href: route("register"), className: " mb-6 text-pink", children: "Signup" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "loginform mx-auto border-black whbg shadow-mint", children: [
        /* @__PURE__ */ jsxs("div", { className: "loginheadbox pinkbg", children: [
          /* @__PURE__ */ jsx("span", { className: "mintbg" }),
          /* @__PURE__ */ jsx("span", { className: "bluebg" })
        ] }),
        /* @__PURE__ */ jsx("form", { onSubmit: submit, children: /* @__PURE__ */ jsxs("div", { className: "login-step1", children: [
          /* @__PURE__ */ jsxs("ul", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("label", { children: "Enter Email" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "email",
                  type: "email",
                  name: "email",
                  value: data.email,
                  className: "mt-1 block w-full",
                  autoComplete: "username",
                  autoFocus: true,
                  onChange: (e) => setData("email", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("label", { children: "Password" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "password",
                  type: "password",
                  name: "password",
                  value: data.password,
                  className: "mt-1 block w-full",
                  autoComplete: "current-password",
                  onChange: (e) => setData("password", e.target.value)
                }
              ),
              canResetPassword && /* @__PURE__ */ jsx("div", { className: " mt-4 m-auto d-table ", children: /* @__PURE__ */ jsx(
                Link,
                {
                  href: route("password.request"),
                  className: "text-sm text-sm text-gray-600 hover:text-gray-900",
                  children: "Forgot your password?"
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "rotate-btn text-center flex justify-center mt-10", children: /* @__PURE__ */ jsx(LoaderButton, { disabled: processing, className: "btn-pink lg2 lg w-80 mb-4 mb-md-0", spinnerClassName: "fill-red-600", children: processing ? "Wait" : "Log in" }) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Login as default
};
