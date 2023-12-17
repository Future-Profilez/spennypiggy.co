import { jsx } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { Provider } from "react-redux";
import { createSlice, combineReducers, configureStore } from "@reduxjs/toolkit";
const bootstrap_min = "";
const theme = "";
const app = "";
const index = "";
const home = "";
async function resolvePageComponent(path, pages) {
  const page = pages[path];
  if (typeof page === "undefined") {
    throw new Error(`Page not found: ${path}`);
  }
  return typeof page === "function" ? page() : page;
}
const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: false
  },
  reducers: {
    add_to_cart: (state, action) => {
      state.cart = action.payload;
    }
  }
});
const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: null
  },
  reducers: {
    set_user_info: (state, action) => {
      state.userInfo = action.payload;
    }
  }
});
const rootReducer = combineReducers({
  cart: cartSlice.reducer,
  user: userSlice.reducer
});
const { add_to_cart } = cartSlice.actions;
const { set_user_info } = userSlice.actions;
const UserSlice = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add_to_cart,
  default: rootReducer,
  set_user_info
}, Symbol.toStringTag, { value: "Module" }));
const Store = configureStore({
  reducer: {
    data: rootReducer
  }
});
const Store$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Store
}, Symbol.toStringTag, { value: "Module" }));
const appName = "SpennyPiggy";
createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, /* @__PURE__ */ Object.assign({ "./Pages/Auth/ConfirmPassword.jsx": () => import("./assets/ConfirmPassword-32eaff11.js"), "./Pages/Auth/ForgotPassword.jsx": () => import("./assets/ForgotPassword-a4bda180.js"), "./Pages/Auth/Login.jsx": () => import("./assets/Login-2de14f6b.js"), "./Pages/Auth/Register.jsx": () => import("./assets/Register-722f7216.js"), "./Pages/Auth/ResetPassword.jsx": () => import("./assets/ResetPassword-ff0a6754.js"), "./Pages/Auth/Social.jsx": () => import("./assets/Social-cbcb0214.js"), "./Pages/Auth/VerifyEmail.jsx": () => import("./assets/VerifyEmail-93b5003a.js"), "./Pages/Auth/Wishlist.jsx": () => import("./assets/Wishlist-d01d9430.js").then((n) => n.a), "./Pages/Dashboard.jsx": () => import("./assets/Dashboard-c857bb8f.js"), "./Pages/Lists.jsx": () => import("./assets/Lists-81aefac5.js"), "./Pages/NotFound.jsx": () => import("./assets/NotFound-455ee4b5.js"), "./Pages/Profile/Edit.jsx": () => import("./assets/Edit-f32abfa8.js"), "./Pages/Profile/Partials/DeleteUserForm.jsx": () => import("./assets/DeleteUserForm-0566f913.js"), "./Pages/Profile/Partials/UpdatePasswordForm.jsx": () => import("./assets/UpdatePasswordForm-84dab7e7.js"), "./Pages/Profile/Partials/UpdateProfileInformationForm.jsx": () => import("./assets/UpdateProfileInformationForm-3bebcef6.js"), "./Pages/Terms.jsx": () => import("./assets/Terms-12354a3c.js"), "./Pages/Welcome.jsx": () => import("./assets/Welcome-8ab053fb.js"), "./Pages/account/EditProfile.jsx": () => import("./assets/EditProfile-d8edc6d0.js"), "./Pages/account/UpdateAvatar.jsx": () => import("./assets/UpdateAvatar-74e2dabd.js"), "./Pages/accountsetting/Accountsetting.jsx": () => import("./assets/Accountsetting-8ad76e7f.js"), "./Pages/cart/Cart.jsx": () => import("./assets/Cart-f6ab1572.js"), "./Pages/cart/CartItem.jsx": () => import("./assets/CartItem-aa598f3f.js"), "./Pages/cart/SubCheckout.jsx": () => import("./assets/SubCheckout-02cfd33f.js"), "./Pages/cart/UserCarts.jsx": () => import("./assets/UserCarts-77ab1fb2.js"), "./Pages/home/FunPart.jsx": () => import("./assets/FunPart-424afb1e.js"), "./Pages/home/HappyCreators.jsx": () => import("./assets/HappyCreators-e2a331e3.js"), "./Pages/home/Hero.jsx": () => import("./assets/Hero-f151ea9f.js"), "./Pages/home/TrustBox.jsx": () => import("./assets/TrustBox-61d46987.js"), "./Pages/home/WhyLove.jsx": () => import("./assets/WhyLove-eccf895d.js"), "./Pages/howitworks/Works.jsx": () => import("./assets/Works-c26ccc02.js"), "./Pages/leaderboard/Board.jsx": () => import("./assets/Board-5ae9e939.js"), "./Pages/leaderboard/LargestGifts.jsx": () => import("./assets/LargestGifts-b952acc3.js"), "./Pages/redux/Store.jsx": () => Promise.resolve().then(() => Store$1), "./Pages/redux/UserSlice.jsx": () => Promise.resolve().then(() => UserSlice), "./Pages/stripe/PaymentDashboard.jsx": () => import("./assets/PaymentDashboard-f9bed3e2.js"), "./Pages/stripe/Stripe.jsx": () => import("./assets/Stripe-93c9cb9c.js"), "./Pages/tracker/SayThanks.jsx": () => import("./assets/SayThanks-271fbb98.js"), "./Pages/tracker/Wishtracker.jsx": () => import("./assets/Wishtracker-a445b12a.js"), "./Pages/twitter/LinkTwitter.jsx": () => import("./assets/LinkTwitter-93e51b89.js") })),
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(
      /* @__PURE__ */ jsx(Provider, { store: Store, children: /* @__PURE__ */ jsx(App, { ...props }) })
    );
  },
  progress: {
    color: "var(--mint)",
    delay: 100,
    includeCSS: true,
    showSpinner: false
  }
});
export {
  add_to_cart as a
};
