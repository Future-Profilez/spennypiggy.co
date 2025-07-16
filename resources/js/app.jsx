import "bootstrap/dist/css/bootstrap.min.css";
import "../css/theme.css";
import "../css/app.css";
import "../css/index.css";
import "../css/home.css";
import "../assets/fonts/newfont.woff";
import "../assets/fonts/newfont.woff2";
import "../assets/fonts/CeraGRMedium.woff";
import "../assets/fonts/CeraGRMedium.woff2";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { Provider } from "react-redux";
import store from "./Pages/redux/Store";
import * as Sentry from "@sentry/react";
// if(import.meta.env.VITE_APP_ENV == 'production'){
    console.log("sentry enabled");
    Sentry.init({
      dsn: "https://14cda094324469c174a7e04a2298502d@o4509650305679360.ingest.us.sentry.io/4509650314526720",
      sendDefaultPii: true,
      integrations: [
        Sentry.replayIntegration(),
        Sentry.feedbackIntegration({
          colorScheme: "system",
          autoInject: false,
        }),
      ],
      replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
      replaysOnErrorSampleRate: 1.0 // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    });
// } else {
//     console.log("sentry Disabled");
// }

createInertiaApp({
    title: (title) =>
        `${title || "Spenny Piggy"} - The Everything Wishlist - Gifts, Memberships, Exclusive Content & More.`,
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
        color: "var(--pink)",
        delay: 100,
        includeCSS: true,
        showSpinner: false,
    },
});
