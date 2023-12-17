import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useRef, useState, useEffect } from "react";
import { G as Guest } from "./GuestLayout-4a28627b.js";
import { I as InputError } from "./InputError-eb0c91b3.js";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import { useForm, Head, Link } from "@inertiajs/react";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import "react-hot-toast";
import axios from "axios";
function Register() {
  const CheckCircleIcon = () => {
    return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
      /* @__PURE__ */ jsx("g", { id: "SVGRepo_bgCarrier", "stroke-width": "0" }),
      /* @__PURE__ */ jsx("g", { id: "SVGRepo_tracerCarrier", "stroke-linecap": "round", "stroke-linejoin": "round" }),
      /* @__PURE__ */ jsxs("g", { id: "SVGRepo_iconCarrier", children: [
        " ",
        /* @__PURE__ */ jsx("path", { opacity: "0.1", d: "M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z", fill: "#000000" }),
        " ",
        /* @__PURE__ */ jsx("path", { d: "M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z", stroke: "#000000", "stroke-width": "2" }),
        " ",
        /* @__PURE__ */ jsx("path", { d: "M9 12L10.6828 13.6828V13.6828C10.858 13.858 11.142 13.858 11.3172 13.6828V13.6828L15 10", stroke: "#000000", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }),
        " "
      ] })
    ] }) });
  };
  const checkRef = useRef();
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const lowerLetter = /[a-z]/g;
  const capitalLetter = /[A-Z]/g;
  const numberLetter = /[0-9]/g;
  const specialLetter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/]/g;
  const inputField = typeof window !== "undefined" && document.getElementById("password");
  const letter = typeof window !== "undefined" && document.getElementById("letter");
  const capital = typeof window !== "undefined" && document.getElementById("capital");
  const number = typeof window !== "undefined" && document.getElementById("number");
  const special = typeof window !== "undefined" && document.getElementById("special");
  const length = typeof window !== "undefined" && document.getElementById("length");
  const [mypass, setmypass] = useState();
  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    username: "",
    email: "",
    password: "",
    password_confirmation: ""
  });
  useEffect(() => {
    return () => {
    };
  }, []);
  useEffect(() => {
    console.log("data", data);
  }, [data]);
  const termsaccept = () => {
    errorAlert("Please check accept terms & conditions checkbox");
    checkRef.current.focus();
    return false;
  };
  const [validMsg, setValidMsg] = useState("");
  const [usernameValid, setUsernameValid] = useState(null);
  const checkUsername = (e) => {
    axios.get(`/check-username/${e.target.value}`).then((resp) => {
      if (resp.data.status == false) {
        setUsernameValid(0);
        setValidMsg(resp.data.msg);
      } else {
        setUsernameValid(1);
        setValidMsg(resp.data.msg);
      }
    }).catch((_err) => {
      console.error("error", _err);
    });
  };
  const submit = (e) => {
    e.preventDefault();
    if (!checkRef.current.checked) {
      termsaccept();
      return false;
    }
    post(route("register"), {
      preserveScroll: true,
      onSuccess: (resp) => {
        var _a, _b, _c, _d;
        if ((_a = resp.props.flash) == null ? void 0 : _a.success) {
          successAlert(((_b = resp.props.flash) == null ? void 0 : _b.success) || "Signup successfully.");
        }
        if ((_c = resp.props.flash) == null ? void 0 : _c.error) {
          errorAlert(((_d = resp.props.flash) == null ? void 0 : _d.error) || "Something went wrong.");
        }
      },
      onError: (err) => {
        Object.keys(err).map((key) => {
          errorAlert(err[key]);
        });
      }
    });
  };
  const handlePassHints = (e) => {
    setmypass(e.target.value);
    if (inputField.value.match(lowerLetter)) {
      letter.classList.remove("text-grey");
      letter.classList.add("valid");
    } else {
      letter.classList.remove("valid");
      letter.classList.add("text-grey");
    }
    if (inputField.value.match(capitalLetter)) {
      capital.classList.remove("text-grey");
      capital.classList.add("valid");
    } else {
      capital.classList.remove("valid");
      capital.classList.add("text-grey");
    }
    if (inputField.value.match(numberLetter)) {
      number.classList.remove("text-grey");
      number.classList.add("valid");
    } else {
      number.classList.remove("valid");
      number.classList.add("text-grey");
    }
    if (inputField.value.match(specialLetter)) {
      special.classList.remove("text-grey");
      special.classList.add("valid");
    } else {
      special.classList.remove("valid");
      special.classList.add("text-grey");
    }
    if (inputField.value.length > 7) {
      length.classList.remove("text-grey");
      length.classList.add("valid");
    } else {
      length.classList.add("text-grey");
      length.classList.remove("valid");
    }
  };
  return /* @__PURE__ */ jsxs(Guest, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Register" }),
    /* @__PURE__ */ jsx("div", { className: "loginPage blackbg py-14", children: /* @__PURE__ */ jsxs("div", { className: "containerbox ", children: [
      /* @__PURE__ */ jsx("h2", { className: "headingLg pb-0 pb-md-4 text-center  px-2", children: "Create Account" }),
      /* @__PURE__ */ jsxs("p", { className: "text-center text-white mb-5 font-CeraGRBold", children: [
        "Already registered? ",
        /* @__PURE__ */ jsx(Link, { className: "text-pink", href: route("login"), children: " Log In" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "loginform mt-4 mt-md-5 mx-auto border-black whbg shadow-mint", children: [
        /* @__PURE__ */ jsxs("div", { className: "loginheadbox pinkbg", children: [
          /* @__PURE__ */ jsx("span", { className: "mintbg" }),
          /* @__PURE__ */ jsx("span", { className: "bluebg" })
        ] }),
        /* @__PURE__ */ jsx("form", { onSubmit: submit, children: /* @__PURE__ */ jsxs("div", { className: "login-step1", children: [
          /* @__PURE__ */ jsxs("ul", { children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("label", { children: "Display Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "name",
                  name: "name",
                  value: data.name,
                  className: "mt-1 block w-full",
                  autoComplete: "name",
                  onChange: (e) => setData("name", e.target.value),
                  required: true
                }
              ),
              /* @__PURE__ */ jsx(InputError, { children: (errors == null ? void 0 : errors.name) || "" })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("label", { children: "Username" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "username",
                  name: "username",
                  onBlur: checkUsername,
                  value: data.username,
                  className: "mt-1 block w-full",
                  autoComplete: "username",
                  isFocused: true,
                  onChange: (e) => setData("username", e.target.value),
                  required: true
                }
              ),
              data.username && usernameValid == 1 ? /* @__PURE__ */ jsx("p", { className: "text-success text-small username-text", children: "Username is available." }) : "",
              data.username && usernameValid == 0 ? /* @__PURE__ */ jsx("p", { className: "text-danger text-small username-text", children: validMsg }) : ""
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("label", { children: "Email" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "email",
                  type: "email",
                  name: "email",
                  value: data.email,
                  className: "mt-1 block w-full",
                  autoComplete: "username",
                  onChange: (e) => setData("email", e.target.value),
                  required: true
                }
              ),
              /* @__PURE__ */ jsx(InputError, { children: (errors == null ? void 0 : errors.email) || "" })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("label", { children: "Password" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "password",
                  type: "password",
                  name: "password",
                  value: mypass,
                  className: "mt-1 block w-full",
                  autoComplete: "off",
                  onKeyUp: (e) => setData("password", e.target.value),
                  onChange: handlePassHints,
                  required: true
                }
              ),
              /* @__PURE__ */ jsx(InputError, { children: (errors == null ? void 0 : errors.password) || "" })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("label", { children: "Confirm Password" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "password_confirmation",
                  type: "password",
                  name: "password_confirmation",
                  value: data.password_confirmation,
                  className: "mt-1 block w-full",
                  autoComplete: "off",
                  onChange: (e) => setData("password_confirmation", e.target.value),
                  required: true
                }
              ),
              /* @__PURE__ */ jsx(InputError, { children: (errors == null ? void 0 : errors.password_confirmation) || "" }),
              /* @__PURE__ */ jsx("div", { className: `mt-3 ${mypass ? "d-block" : "d-none"}`, children: /* @__PURE__ */ jsx("div", { className: "pass greybox border-0 p-3", children: /* @__PURE__ */ jsxs("div", { id: "msgText", children: [
                /* @__PURE__ */ jsx("h3", { children: "Password must contain the following:" }),
                /* @__PURE__ */ jsxs("p", { id: "letter", className: "text-grey", children: [
                  /* @__PURE__ */ jsx(CheckCircleIcon, {}),
                  "  A ",
                  /* @__PURE__ */ jsx("b", { children: " lowercase" }),
                  " letter"
                ] }),
                /* @__PURE__ */ jsxs("p", { id: "capital", className: "text-grey", children: [
                  /* @__PURE__ */ jsx(CheckCircleIcon, {}),
                  "  A ",
                  /* @__PURE__ */ jsx("b", { children: " capital (uppercase)" }),
                  " letter"
                ] }),
                /* @__PURE__ */ jsxs("p", { id: "number", className: "text-grey", children: [
                  /* @__PURE__ */ jsx(CheckCircleIcon, {}),
                  "  A ",
                  /* @__PURE__ */ jsx("b", { children: " number" })
                ] }),
                /* @__PURE__ */ jsxs("p", { id: "special", className: "text-grey", children: [
                  /* @__PURE__ */ jsx(CheckCircleIcon, {}),
                  "  Special characters"
                ] }),
                /* @__PURE__ */ jsxs("p", { id: "length", className: "text-grey mb-0", children: [
                  /* @__PURE__ */ jsx(CheckCircleIcon, {}),
                  "  Password should minimum 8 characters."
                ] })
              ] }) }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "termselect", children: /* @__PURE__ */ jsx("label", { htmlFor: "termaccept", children: /* @__PURE__ */ jsxs("p", { className: "tersms-accept", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                ref: checkRef,
                id: "termaccept",
                name: "termaccept",
                value: "termaccept",
                required: true,
                onChange: (e) => setData("termaccept", e.target.value)
              }
            ),
            "By signing up you agree to our ",
            /* @__PURE__ */ jsx(Link, { className: "text-voilet font-bold", target: "_blank", href: route("terms-and-conditions"), children: "Terms & Conditions" }),
            "  and ",
            /* @__PURE__ */ jsx("a", { className: "text-voilet font-bold", target: "_blank", href: "https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6", children: "Privacy Policy," }),
            "  and confirm that you are at least 18. years old."
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "wishlistbtn  rotate-btn text-center flex justify-center mt-4", children: /* @__PURE__ */ jsx(LoaderButton, { disabled: processing, className: "btn-pink lg lg2 mb-4 mb-md-0", spinnerClassName: "fill-red-600", children: processing ? "Processing" : " Create Account" }) })
        ] }) })
      ] })
    ] }) })
  ] });
}
export {
  Register as default
};
