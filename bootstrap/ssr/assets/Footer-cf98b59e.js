import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import React, { useEffect } from "react";
import { Link } from "@inertiajs/react";
import { Helmet } from "react-helmet";
import { LazyLoadImage } from "react-lazy-load-image-component";
const footlogo = "/build/assets/footlogo-e9f400d1.png";
const ContentPrefrences = React.lazy(() => import("./ContentPrefrences-b3c2f721.js"));
function Footer(props) {
  const { auth } = props;
  async function configIntercom() {
    setTimeout(() => {
      if (auth && auth.user) {
        window.intercomSettings = {
          api_base: "https://api-iam.intercom.io",
          app_id: "xomg14o9",
          name: auth && (auth == null ? void 0 : auth.name),
          // Full name
          email: auth && (auth == null ? void 0 : auth.email),
          // Email address
          custom_launcher_selector: ".livechat",
          // Email address
          created_at: auth && (auth == null ? void 0 : auth.createdAt)
          // Signup date as a Unix timestamp
        };
        (function() {
          var w = window;
          var ic = w.Intercom;
          if (typeof ic === "function") {
            ic("reattach_activator");
            ic("update", w.intercomSettings);
          } else {
            var d = document;
            var i = function() {
              i.c(arguments);
            };
            i.q = [];
            i.c = function(args) {
              i.q.push(args);
            };
            w.Intercom = i;
            var l = function() {
              var s = d.createElement("script");
              s.type = "text/javascript";
              s.async = true;
              s.defer = true;
              s.src = "https://widget.intercom.io/widget/xomg14o9";
              var x = d.getElementsByTagName("script")[0];
              x.parentNode.insertBefore(s, x);
            };
            if (document.readyState === "complete") {
              l();
            } else if (w.attachEvent) {
              w.attachEvent("onload", l);
            } else {
              w.addEventListener("load", l, false);
            }
          }
        })();
      } else {
        window.intercomSettings = {
          api_base: "https://api-iam.intercom.io",
          app_id: "xomg14o9",
          custom_launcher_selector: ".livechat"
        };
        (function() {
          var w = window;
          var ic = w.Intercom;
          if (typeof ic === "function") {
            ic("reattach_activator");
            ic("update", w.intercomSettings);
          } else {
            var d = document;
            var i = function() {
              i.c(arguments);
            };
            i.q = [];
            i.c = function(args) {
              i.q.push(args);
            };
            w.Intercom = i;
            var l = function() {
              var s = d.createElement("script");
              s.type = "text/javascript";
              s.async = true;
              s.src = "https://widget.intercom.io/widget/xomg14o9";
              var x = d.getElementsByTagName("script")[0];
              x.parentNode.insertBefore(s, x);
            };
            if (document.readyState === "complete") {
              l();
            } else if (w.attachEvent) {
              w.attachEvent("onload", l);
            } else {
              w.addEventListener("load", l, false);
            }
          }
        })();
      }
    }, 7e3);
  }
  async function confgureGtag() {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    gtag("js", /* @__PURE__ */ new Date());
    gtag("config", "G-9F1M3QZZB3");
  }
  useEffect(() => {
    configIntercom();
  }, [auth && (auth == null ? void 0 : auth.name)]);
  useEffect(() => {
    confgureGtag();
  }, []);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Helmet, { children: [
      /* @__PURE__ */ jsx("script", { async: true, type: "text/javascript", src: "https://app.termly.io/embed.min.js", "data-auto-block": "on", "data-website-uuid": "ced8ded9-995d-471a-bf54-880b8c679a81" }),
      /* @__PURE__ */ jsx("script", { async: true, src: "https://www.googletagmanager.com/gtag/js?id=G-9F1M3QZZB3" })
    ] }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { id: "footer", className: "footer", children: [
      /* @__PURE__ */ jsxs("div", { className: "containerbox", children: [
        /* @__PURE__ */ jsx("div", { className: "footlogo", children: /* @__PURE__ */ jsx(
          LazyLoadImage,
          {
            alt: "image",
            height: "auto",
            src: footlogo,
            width: "auto"
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "footlinksbox", children: /* @__PURE__ */ jsx("div", { className: "footlinks", children: /* @__PURE__ */ jsxs("ul", { children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { target: "_blank", href: "https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6", children: " Privacy Policy " }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { target: "_blank", href: "https://app.termly.io/document/cookie-policy/45944c26-6e99-4065-833a-8fa224fb8e20", children: " Cookie Policy " }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { target: "_blank", href: "https://app.termly.io/document/acceptable-use/458f5fac-0c41-406f-a02f-b50adff1ec9c", children: " Acceptable Use Policy " }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { target: "_blank", href: "https://app.termly.io/notify/696baafc-17cd-4a28-b758-a8f597cf2ad6", children: " DSAR Form " }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { target: "_blank", href: "https://intercom.help/spenny-piggy", children: " FAQ's " }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: route("how-it-works"), children: " How it works " }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "https://blog.spennypiggy.co", children: " Blog " }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: route("terms-and-conditions"), children: " Terms " }) }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx(ContentPrefrences, { classes: "m-auto d-table" }),
            " "
          ] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "copyright", children: "Copyright © 2023 Spenny Piggy" })
    ] }) })
  ] });
}
export {
  Footer as default
};
