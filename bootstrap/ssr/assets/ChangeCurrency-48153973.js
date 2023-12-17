import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import { useState } from "react";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import { usePage, useForm, Link } from "@inertiajs/react";
import Select from "react-select";
import Dropdown from "react-bootstrap/Dropdown";
function ChangeCurrency({ defaultvalue, changer }) {
  const { flash } = usePage().props;
  const { successAlert, errorAlert } = useAlerts();
  const { data, setData, get, processing, errors, reset } = useForm({
    currency: defaultvalue
  });
  const currencies = [
    { value: "GBP", label: "£ British Pound Sterling", symbolAndCode: "£ GBP" },
    { value: "USD", label: "$ United States Dollar", symbolAndCode: "$ USD" },
    { value: "AUD", label: "$ Australian Dollar", symbolAndCode: "$ AUD" },
    { value: "EUR", label: "€ Euro", symbolAndCode: "€ EUR" },
    { value: "JPY", label: "¥ Japanese Yen", symbolAndCode: "¥ JPY" },
    { value: "HKD", label: "$ Hong Kong Dollar", symbolAndCode: "$ HKD" },
    { value: "CAD", label: "$ Canadian Dollar", symbolAndCode: "$ CAD" },
    { value: "CHF", label: "Swiss Franc", symbolAndCode: "CHF CHF" },
    { value: "SEK", label: "Swedish Krona", symbolAndCode: "SEK SEK" },
    { value: "NZD", label: "$ New Zealand Dollar", symbolAndCode: "$ NZD" }
  ];
  const [selectedCurrency, setSelectedCurrency] = useState(defaultvalue);
  const handleSelect = (e) => {
    setSelectedCurrency(e.value);
    setData("currency", e.value);
  };
  const changeCurrency = (e) => {
    get(route(`change.currency`, { c: e }), {
      preserveScroll: true,
      onSuccess: (resp) => {
        if (flash == null ? void 0 : flash.error) {
          errorAlert(flash.error);
        }
        if (flash == null ? void 0 : flash.success) {
          successAlert(flash.success);
        }
        if (flash == null ? void 0 : flash.warning) {
          warningAlert(flash.warning);
        }
        if (flash == null ? void 0 : flash.info) {
          successAlert(flash.info);
        }
      },
      onError: (_err) => {
        console.error(_err);
        errorAlert("Failed to change display currency.");
      }
    });
  };
  return /* @__PURE__ */ jsx(Fragment, { children: changer ? /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(Dropdown, { children: [
    /* @__PURE__ */ jsx(Dropdown.Toggle, { variant: "info", id: "pricebasic", children: /* @__PURE__ */ jsxs("span", { className: "mb-0 text-white display-inline", children: [
      " ",
      selectedCurrency ? selectedCurrency : "$N/A"
    ] }) }),
    /* @__PURE__ */ jsx(Dropdown.Menu, { children: currencies && currencies.map((c, i) => {
      return /* @__PURE__ */ jsx(Link, { className: "dropdown-item", href: route("change.currency", { c: c.value }), children: c.label }, `currency-selector-${c.value}`);
    }) })
  ] }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("h2", { className: "text-uppercase font-GillSans pb-4 font-large", children: " Display Currency " }),
    /* @__PURE__ */ jsxs("div", { className: "form-field mb-4", children: [
      /* @__PURE__ */ jsx("label", { className: "d-block text-start mb-2", children: "Display Currency" }),
      /* @__PURE__ */ jsx(
        Select,
        {
          classNamePrefix: "react-select",
          className: "react-select my-4 ",
          options: currencies,
          placeholder: data.currency || "Select..",
          defaultValue: data.currency,
          onChange: (e) => handleSelect(e)
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      LoaderButton,
      {
        onClick: () => changeCurrency(data.currency),
        disabled: processing,
        type: "submit",
        className: "flex w-100 btn-pink lg mx-auto",
        spinnerClassName: "fill-red-600",
        children: processing ? "Updating.." : "Update"
      }
    )
  ] }) });
}
export {
  ChangeCurrency as C
};
