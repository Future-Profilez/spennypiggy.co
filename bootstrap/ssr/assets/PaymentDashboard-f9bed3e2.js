import { jsx } from "react/jsx-runtime";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import { useForm } from "@inertiajs/react";
function PaymentDashboard({ auth, classes, text }) {
  const { data, post, processing } = useForm();
  const handleStripeLogin = (e) => {
    e.preventDefault();
    post(route("stripe.login"), {
      preserveScroll: true
    });
  };
  return /* @__PURE__ */ jsx(
    LoaderButton,
    {
      onClick: handleStripeLogin,
      disabled: processing,
      className: classes,
      spinnerClassName: "fill-red-600",
      children: processing ? "Connecting" : text
    }
  );
}
export {
  PaymentDashboard as default
};
