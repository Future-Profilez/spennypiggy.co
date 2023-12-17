import { jsx } from "react/jsx-runtime";
function InputError({ message, className = "", ...props }) {
  return message ? /* @__PURE__ */ jsx("span", { ...props, className: "text-sm text-red-600 " + className, children: message }) : null;
}
export {
  InputError as I
};
