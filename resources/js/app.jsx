import "bootstrap/dist/css/bootstrap.min.css";
import "../css/theme.css";
import "../css/app.css";
import "../css/index.css";
import "../css/home.css";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import "../assets/fonts/newfont.woff";
import "../assets/fonts/newfont.woff2";
import "../assets/fonts/CeraGRMedium.woff";
import "../assets/fonts/CeraGRMedium.woff2";
import { Provider } from "react-redux";
import store from "./Pages/redux/Store";

createInertiaApp({
    title: (title) =>
        `${title || "Spenny Piggy"} - Financial Gifts, Exclusive Content & Memberships`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <Provider store={store}>
                <App {...props} />
            </Provider>
        );
    },
    progress: {
        color: "var(--mint)",
        delay: 100,
        includeCSS: true,
        showSpinner: false,
    },
});
