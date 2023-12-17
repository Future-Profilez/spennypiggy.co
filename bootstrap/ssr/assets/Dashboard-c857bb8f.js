import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import { w as wishlistbannerimg } from "./wishlistbannerimg-66b5ad17.js";
import axios from "axios";
import { G as Guest } from "./GuestLayout-4a28627b.js";
import "react-hot-toast";
import "./Alerts-5da797d1.js";
const Wishlist = React.lazy(() => import("./Wishlist-d01d9430.js").then((n) => n.a));
const Wishlistbox = React.lazy(() => import("./Wishlistbox-63e31c22.js"));
const Userprofile = React.lazy(() => import("./Userprofile-b8f8e63a.js"));
const EditProfile = React.lazy(() => import("./EditProfile-d8edc6d0.js"));
const ShareProfile = React.lazy(() => import("./ShareProfile-d3c3ccb4.js"));
const Nocontent = React.lazy(() => import("./Nocontent-a5a8d2f7.js"));
const LoadingScreen = React.lazy(() => import("./LoadingScreen-e3e448fa.js"));
const Social = React.lazy(() => import("./Social-cbcb0214.js"));
const PaymentDashboard = React.lazy(() => import("./PaymentDashboard-f9bed3e2.js"));
function Dashboard(props) {
  const { auth, items, categories, user, itemid, sociallinks, global_currency, slinks } = props;
  const [its, setIts] = useState();
  async function conCat(pinned, items2) {
    const result = pinned.concat(items2);
    setIts(result);
    return result;
  }
  useMemo(() => {
    conCat(items.pinned || [], items.list || []);
  }, []);
  const [loading, setLoading] = useState(false);
  const fetchingcats = (e) => {
    setLoading(true);
    axios.get(`${user.username}/${e}`).then((resp) => {
      console.log("resp", resp);
      const result = resp.data.items;
      conCat(result.pinned || [], result.list || []);
      setLoading(false);
    }).catch((_err) => {
      console.error("error", _err);
      setLoading(false);
    });
  };
  const showCategory = (e) => {
    const v = e.target.value;
    fetchingcats(v);
  };
  const [IsloggedIn, setIsLoggedIn] = useState(
    (auth && auth.user && auth.user.username) == (user && user.username)
  );
  return /* @__PURE__ */ jsxs(Guest, { auth: auth.user, user, children: [
    /* @__PURE__ */ jsx(Head, { title: user && user.name }),
    /* @__PURE__ */ jsx("div", { className: "wishlistPage blackbg pt-8 pb-14 ", children: /* @__PURE__ */ jsxs("div", { className: "containerbox", children: [
      /* @__PURE__ */ jsx("div", { className: "wishbanner d-lg-block d-none", children: /* @__PURE__ */ jsx("img", { className: "w-full border-black border-2 shadow-mint rounded-2xl", src: (user == null ? void 0 : user.cover_url) || wishlistbannerimg, alt: "img" }) }),
      /* @__PURE__ */ jsx("div", { className: "wishManage", children: /* @__PURE__ */ jsxs("div", { className: "row", children: [
        /* @__PURE__ */ jsx("div", { className: "col-lg-4", children: /* @__PURE__ */ jsxs("div", { className: "userProfile whbg rounded-3xl shadow-voilet border-2", children: [
          /* @__PURE__ */ jsx(
            Userprofile,
            {
              auth: auth && auth.user,
              IsloggedIn,
              links: sociallinks,
              user
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "userProfileDate pt-0", children: IsloggedIn ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(EditProfile, { user: auth.user }),
            auth.user && auth.user.stripe_details_submitted == 1 ? /* @__PURE__ */ jsx(
              PaymentDashboard,
              {
                classes: "btn-pink lg w-100 mt-4",
                text: "Payment Dashboard"
              }
            ) : /* @__PURE__ */ jsxs("div", { className: "finish mt-4 d-block", children: [
              /* @__PURE__ */ jsx("p", { className: "mb-4", children: "Finish setting up your account to receive funds. You have more steps to complete your payment setup." }),
              /* @__PURE__ */ jsx(
                Link,
                {
                  href: "/stripe",
                  className: "btn-pink lg",
                  children: "Finish Setup"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "addsocial flex", children: /* @__PURE__ */ jsxs("ul", { children: [
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                Social,
                {
                  links: slinks
                }
              ) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
                ShareProfile,
                {
                  username: user && user.name,
                  classes: "d-flex ms-auto",
                  children: [
                    /* @__PURE__ */ jsx(
                      "svg",
                      {
                        width: "24",
                        height: "25",
                        viewBox: "0 0 24 25",
                        fill: "none",
                        xmlns: "http://www.w3.org/2000/svg",
                        children: /* @__PURE__ */ jsx(
                          "path",
                          {
                            d: "M22.46 6.5C21.69 6.85 20.86 7.08 20 7.19C20.88 6.66 21.56 5.82 21.88 4.81C21.05 5.31 20.13 5.66 19.16 5.86C18.37 5 17.26 4.5 16 4.5C13.65 4.5 11.73 6.42 11.73 8.79C11.73 9.13 11.77 9.46 11.84 9.77C8.28004 9.59 5.11004 7.88 3.00004 5.29C2.63004 5.92 2.42004 6.66 2.42004 7.44C2.42004 8.93 3.17004 10.25 4.33004 11C3.62004 11 2.96004 10.8 2.38004 10.5V10.53C2.38004 12.61 3.86004 14.35 5.82004 14.74C5.19077 14.9122 4.53013 14.9362 3.89004 14.81C4.16165 15.6625 4.69358 16.4084 5.41106 16.9429C6.12854 17.4775 6.99549 17.7737 7.89004 17.79C6.37367 18.9904 4.49404 19.6393 2.56004 19.63C2.22004 19.63 1.88004 19.61 1.54004 19.57C3.44004 20.79 5.70004 21.5 8.12004 21.5C16 21.5 20.33 14.96 20.33 9.29C20.33 9.1 20.33 8.92 20.32 8.73C21.16 8.13 21.88 7.37 22.46 6.5Z",
                            fill: "#5D25FD"
                          }
                        )
                      }
                    ),
                    "Share Profile"
                  ]
                }
              ) })
            ] }) })
          ] }) : "" })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "col-lg-8 ps-3 ps-lg-4", children: /* @__PURE__ */ jsxs("div", { className: "userManageRt mt-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "userManageHead flex items-center justify-between mb-8", children: [
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(
              "select",
              {
                id: "country",
                onChange: showCategory,
                name: "country",
                autoComplete: "country-name",
                className: "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "all", children: "All" }),
                  categories && categories.map(
                    (c, i) => {
                      return /* @__PURE__ */ jsx("option", { value: c.id, children: c.category }, `cats-${i}`);
                    }
                  )
                ]
              }
            ) }),
            IsloggedIn ? /* @__PURE__ */ jsx(
              Wishlist,
              {
                setuped: auth.user && auth.user.stripe_details_submitted == 1 ? true : false,
                fetchingcats,
                categories
              }
            ) : ""
          ] }),
          loading ? /* @__PURE__ */ jsx(LoadingScreen, {}) : "",
          /* @__PURE__ */ jsx("div", { className: "row items-lists", children: IsloggedIn || (user == null ? void 0 : user.stripe_details_submitted) == 1 ? /* @__PURE__ */ jsx(Fragment, { children: its && its.length ? !loading && its.map((c, i) => {
            return /* @__PURE__ */ jsx("div", { className: "col-xl-4 col-lg-6 col-6", children: /* @__PURE__ */ jsx(
              Wishlistbox,
              {
                currency: global_currency,
                fetchingcats,
                categories,
                IsloggedIn,
                auth: auth.user,
                itemid,
                setuped: auth && auth.user && auth.user.stripe_details_submitted == 1 ? true : false,
                itm: c
              },
              `wish-${c.uuid}`
            ) }, `wish-item-${i}`);
          }) : /* @__PURE__ */ jsx(Fragment, { children: !loading ? /* @__PURE__ */ jsx("div", { className: "col-md-12", children: /* @__PURE__ */ jsx(Nocontent, { text: "Nothing to see." }) }) : "" }) }) : /* @__PURE__ */ jsxs("div", { className: "col-md-12 p-5 my-5 notactive", children: [
            /* @__PURE__ */ jsxs("h5", { className: "loadingtext w-full text-center text-white  mb-1", children: [
              user.name,
              "'s WishList not activated yet."
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-center  text-white text-large ", children: "Until they activate their wishlist, this user won't be able to receive gifts" })
          ] }) })
        ] }) })
      ] }) })
    ] }) })
  ] });
}
export {
  Dashboard as default
};
