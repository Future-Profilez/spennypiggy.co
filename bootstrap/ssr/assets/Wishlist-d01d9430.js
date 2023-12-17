import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { L as LoaderButton } from "./LoaderButton-91d3595f.js";
import { useForm, router } from "@inertiajs/react";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import { G as GlobalUploader, s as st } from "./uploader.module-d5dbf507.js";
import { useRef, useState, useEffect } from "react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Accordion from "react-bootstrap/Accordion";
import Popup from "./Popup-7b8a2e20.js";
import { Pagination, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
/* empty css                     */const uploadedimg = "/build/assets/uploadedimg-d99c9c99.png";
const navigation = "";
function Wishlist(props) {
  const { categories, auth, fetchingcats, item, editpop, openPop, setuped } = props;
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const inputRef = useRef(null);
  const [defaultKey, setDefaultKey] = useState(item && item.subscription !== null ? +item.subscription : null);
  const [clear, setClear] = useState();
  const [close, setClose] = useState();
  useEffect(() => {
    setClose(openPop);
  }, [openPop]);
  const [repeat, setRepeat] = useState(true);
  const [thumbnail, setThumbnail] = useState("");
  const [adding, setAdding] = useState(false);
  const AddCategory = async () => {
    const value = inputRef.current.value;
    setAdding(true);
    router.post(
      "save-category",
      { category: value },
      {
        preserveScroll: true,
        onSuccess: (resp2) => {
          var _a, _b, _c, _d;
          inputRef.current.value = "";
          if ((_a = resp2.props.flash) == null ? void 0 : _a.success) {
            successAlert(((_b = resp2.props.flash) == null ? void 0 : _b.success) || "Added");
          }
          if ((_c = resp2.props.flash) == null ? void 0 : _c.error) {
            errorAlert((_d = resp2.props.flash) == null ? void 0 : _d.error);
          }
          setAdding(false);
        },
        onError: (_err) => {
          console.table("error", _err);
          setAdding(false);
          errorAlert(_err == null ? void 0 : _err.category);
        }
      }
    );
  };
  const imageLinks = [
    "be9060ab-1a76-452f-b805-1c71d9af4fb7",
    "01bbc3bd-7e79-4dc0-817c-2c260da43c20",
    "f0c45dc9-cc56-4955-a406-7527004a1373",
    "4c42426a-1396-49e2-8b46-2381a2ae5d7b"
  ];
  const { data, setData, post, processing, errors, reset } = useForm({
    wishname: item && item.wishname ? item.wishname : "",
    price: item && item.price ? item.price : "",
    item_url: item && item.item_url ? item.item_url : "",
    thumbnail: item && item.thumbnail ? item.thumbnail : imageLinks[0],
    subscription: item && item.subscription ? item.subscription : "",
    subscription_period: item && item.subscription_period ? item.subscription_period : "",
    repeat_purchase: item && item.repeat_purchase ? item.repeat_purchase : 0,
    category: item && item.category ? item.category : 0
  });
  const [period, setPeriod] = useState(data.subscription_period || item && item.subscription_period);
  const onSlideChange = (swiper) => {
    setData("thumbnail", imageLinks[swiper && swiper.activeIndex]);
  };
  const setSubs = (e) => {
    setData("subscription", e);
    setRepeat(true);
  };
  const [checkboxes, setCheckboxes] = useState([]);
  const catValue = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setCheckboxes([...checkboxes, value]);
    } else {
      setCheckboxes(checkboxes.filter((item2) => item2 !== value));
    }
  };
  const getFileUID = async (data2) => {
    let ss = data2 == null ? void 0 : data2.uuid;
    setThumbnail(ss);
  };
  const rpValue = (e) => {
    setRepeat(e.target.checked);
    setData("repeat_purchase", e.target.checked ? 1 : 0);
  };
  const spValue = (e) => {
    setData("subscription_period", e.target.value);
    setPeriod(e.target.value);
  };
  useEffect(() => {
    setData("category", checkboxes);
  }, [checkboxes]);
  useEffect(() => {
    setData("thumbnail", thumbnail);
  }, [thumbnail]);
  const createWishList = (e) => {
    e.preventDefault();
    if (!setuped) {
      errorAlert("You need to connect your account with stripe first.");
      return false;
    }
    if (editpop) {
      post(route(`update_wish_item`, [item && item.uuid]), {
        preserveScroll: true,
        onSuccess: (resp2) => {
          var _a, _b, _c, _d;
          if ((_a = resp2.props.flash) == null ? void 0 : _a.success) {
            successAlert(((_b = resp2.props.flash) == null ? void 0 : _b.success) || "Updated successfully.");
          }
          if ((_c = resp2.props.flash) == null ? void 0 : _c.error) {
            errorAlert(((_d = resp2.props.flash) == null ? void 0 : _d.error) || "Something went wrong.");
          }
          reset();
          setClose(false);
          setClear(/* @__PURE__ */ new Date());
          setTimeout(() => {
            setClose();
          }, 100);
          fetchingcats("all");
        },
        onError: (_err) => {
          var _a;
          console.error(_err);
          errorsHandling(_err);
          errorAlert(((_a = resp.props.flash) == null ? void 0 : _a.success) || "Added");
        }
      });
    } else {
      post(route("save_wish_item"), {
        preserveScroll: true,
        onSuccess: (resp2) => {
          var _a, _b, _c, _d;
          reset();
          if ((_a = resp2.props.flash) == null ? void 0 : _a.success) {
            successAlert(((_b = resp2.props.flash) == null ? void 0 : _b.success) || "Wish added successfully.");
          }
          if ((_c = resp2.props.flash) == null ? void 0 : _c.error) {
            errorAlert(((_d = resp2.props.flash) == null ? void 0 : _d.error) || "Something went wrong.");
          }
          setClose(false);
          setClear(/* @__PURE__ */ new Date());
          setTimeout(() => {
            setClose();
          }, 100);
          fetchingcats("all");
        },
        onError: (_err) => {
          var _a;
          console.error(_err);
          errorsHandling(_err);
          errorAlert(((_a = resp.props.flash) == null ? void 0 : _a.success) || "Added");
        }
      });
    }
  };
  return /* @__PURE__ */ jsx(
    Popup,
    {
      modalclass: "pinkmodal",
      size: "md",
      action: close,
      classes: `${editpop ? "editpop" : "btn-pink lg px-4"}`,
      text: `${editpop ? "" : "+ Add wish"}`,
      children: /* @__PURE__ */ jsx("div", { className: "editprofileModal  wishlistModal ", children: /* @__PURE__ */ jsxs("div", { className: "editprofileModalInner  ", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-GillSans pt-4 px-3", children: "Add A Wish " }),
        /* @__PURE__ */ jsx(
          Tabs,
          {
            defaultActiveKey: "1",
            id: "uncontrolled-tab-example",
            className: "mb-3",
            children: /* @__PURE__ */ jsx(Tab, { eventKey: "1", title: "Custom", children: /* @__PURE__ */ jsx("div", { className: "wishinfo", children: /* @__PURE__ */ jsxs("form", { onSubmit: createWishList, children: [
              /* @__PURE__ */ jsxs("ul", { className: "ps-0", children: [
                /* @__PURE__ */ jsxs("li", { className: "mb-4", children: [
                  /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "Wish Name" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      id: "wishname",
                      name: "wishname",
                      type: "text",
                      placeholder: "Eg. Buy me a coffee",
                      value: data.wishname,
                      className: "form-input px-2 py-2 border w-full rounded-md",
                      autoComplete: "name",
                      onChange: (e) => setData("wishname", e.target.value),
                      required: true
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "mb-4", children: [
                  /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "Price " }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      id: "price",
                      type: "number",
                      name: "price",
                      placeholder: "Eg. 50",
                      value: data.price || item && item.price,
                      step: `0.01`,
                      className: "form-input px-2 py-2 border w-full rounded-md",
                      autoComplete: "price",
                      onChange: (e) => setData(
                        "price",
                        e.target.value
                      )
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "mb-4", children: [
                  /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "URL (Optional)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      id: "item_url",
                      type: "text",
                      placeholder: "URL",
                      name: "item_url",
                      value: data.item_url || item && item.item_url,
                      className: "form-input px-2 py-2 border w-full rounded-md",
                      autoComplete: "item_url",
                      onChange: (e) => setData("item_url", e.target.value)
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "mb-4", children: [
                  /* @__PURE__ */ jsx("label", { className: "mb-2 text-start d-block", children: "Choose Image or Upload" }),
                  item && item.perma_link ? /* @__PURE__ */ jsx("div", { className: "default-wish-img mb-1", children: /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: item && item.perma_link || uploadedimg,
                      className: "img-fluid"
                    }
                  ) }) : /* @__PURE__ */ jsx(
                    Swiper,
                    {
                      spaceBetween: 0,
                      pagination: { clickable: true },
                      navigation: true,
                      onSlideChange,
                      modules: [Pagination, Navigation],
                      slidesPerView: 1,
                      children: imageLinks && imageLinks.map((image) => {
                        return /* @__PURE__ */ jsx(SwiperSlide, { children: /* @__PURE__ */ jsx("div", { className: "default-wish-img mb-1", children: /* @__PURE__ */ jsx("img", { src: `https://ucarecdn.com/${image}/`, className: "img-fluid" }) }) }, `swiper-item-${image}`);
                      })
                    }
                  ),
                  /* @__PURE__ */ jsx("h4", { className: "mt-2 mb-2 w-100 text-center", children: "OR" }),
                  /* @__PURE__ */ jsx(
                    GlobalUploader,
                    {
                      clear,
                      sendFile: getFileUID,
                      options: st.wishitemUploader
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "wishlistAccordian mt-3", children: /* @__PURE__ */ jsxs(Accordion, { defaultActiveKey: defaultKey, children: [
                /* @__PURE__ */ jsxs(Accordion.Item, { eventKey: 0, children: [
                  /* @__PURE__ */ jsxs(
                    Accordion.Header,
                    {
                      onClick: (e) => setSubs(0),
                      children: [
                        /* @__PURE__ */ jsx("span", { className: "activedote" }),
                        " ",
                        "Single Wish"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(Accordion.Body, { children: /* @__PURE__ */ jsxs("div", { className: "singlewishbox", children: [
                    /* @__PURE__ */ jsx("div", { className: "repeatpurchase text-start", children: /* @__PURE__ */ jsxs("label", { htmlFor: "allow", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          checked: repeat,
                          type: "checkbox",
                          id: "allow",
                          name: "repeat_purchase",
                          onChange: rpValue
                        }
                      ),
                      "Allow Repeat Purchases"
                    ] }) }),
                    /* @__PURE__ */ jsx("p", { className: "text-start", children: "Check if you want repeat purchases of this gift. If unchecked, the item will automatically delete from your wishlist after the first purchase." })
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxs(Accordion.Item, { eventKey: 1, children: [
                  /* @__PURE__ */ jsxs(
                    Accordion.Header,
                    {
                      onClick: (e) => setSubs(1),
                      children: [
                        /* @__PURE__ */ jsx("span", { className: "activedote" }),
                        " ",
                        "Subscription"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(Accordion.Body, { children: /* @__PURE__ */ jsxs("div", { className: "singlewishbox rounded ", children: [
                    /* @__PURE__ */ jsx("strong", { className: "mb-2 text-start d-block ", children: "Allows gifter to purchase this item on a recurring basis." }),
                    /* @__PURE__ */ jsx("div", { className: "repeatpurchase text-start", children: /* @__PURE__ */ jsxs("label", { htmlFor: "daily", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          checked: period == "daily",
                          type: "radio",
                          id: "daily",
                          value: "daily",
                          name: "subscription_period",
                          onChange: spValue
                        }
                      ),
                      " ",
                      "Daily"
                    ] }) }),
                    /* @__PURE__ */ jsx("div", { className: "repeatpurchase mt-2 text-start", children: /* @__PURE__ */ jsxs("label", { htmlFor: "weekly", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          checked: period == "weekly",
                          type: "radio",
                          id: "weekly",
                          value: "weekly",
                          name: "subscription_period",
                          onChange: spValue
                        }
                      ),
                      " ",
                      "Weekly"
                    ] }) }),
                    /* @__PURE__ */ jsx("div", { className: "repeatpurchase mt-2 text-start", children: /* @__PURE__ */ jsxs("label", { htmlFor: "monthly", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          checked: period == "monthly",
                          type: "radio",
                          id: "monthly",
                          value: "monthly",
                          name: "subscription_period",
                          onChange: spValue
                        }
                      ),
                      "Monthly"
                    ] }) })
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxs(Accordion.Item, { eventKey: 2, children: [
                  /* @__PURE__ */ jsxs(
                    Accordion.Header,
                    {
                      onClick: (e) => setSubs(2),
                      children: [
                        /* @__PURE__ */ jsx("span", { className: "activedote" }),
                        " ",
                        "Crowdfund"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(Accordion.Body, { children: /* @__PURE__ */ jsx("p", { className: "text-start d-block", children: "Allows multiple gifters to contribute to your wish item." }) })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "publish text-start", children: editpop ? /* @__PURE__ */ jsx(
                LoaderButton,
                {
                  disabled: processing,
                  type: "submit",
                  className: "flex w-100 btn-pink lg mx-auto",
                  spinnerClassName: "fill-red-600",
                  children: processing ? "Updating.." : "Update Wish"
                }
              ) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("strong", { children: "Categorize this wish ( Optional )" }),
                /* @__PURE__ */ jsx("p", { children: "Organize your wishes to help gifters find what they're looking for while on your wishlist." }),
                /* @__PURE__ */ jsx("div", { className: "catslists", children: categories && categories.map((c, i) => {
                  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("div", { className: "repeatpurchase mb-2 text-start", children: /* @__PURE__ */ jsxs(
                    "label",
                    {
                      className: "text-capitalize",
                      htmlFor: "categories" + i,
                      children: [
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "checkbox",
                            id: "categories" + i,
                            value: c.id,
                            name: "category",
                            onChange: catValue
                          }
                        ),
                        c.category
                      ]
                    }
                  ) }) });
                }) }),
                /* @__PURE__ */ jsxs("div", { className: "cate-items mb-3 mt-4 d-flex ", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      id: "cats",
                      type: "text",
                      ref: inputRef,
                      className: "form-input px-2 py-2 border w-full rounded-md"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "p-2 border cursor-pointer",
                      onClick: AddCategory,
                      children: adding ? "Adding.." : "Add"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(
                  LoaderButton,
                  {
                    disabled: processing,
                    type: "submit",
                    className: "flex w-100 btn-pink lg mx-auto",
                    spinnerClassName: "fill-red-600",
                    children: processing ? "Processing" : "Add Wish"
                  }
                )
              ] }) })
            ] }) }) })
          }
        )
      ] }) })
    }
  );
}
const Wishlist$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Wishlist
}, Symbol.toStringTag, { value: "Module" }));
export {
  Wishlist as W,
  Wishlist$1 as a,
  uploadedimg as u
};
