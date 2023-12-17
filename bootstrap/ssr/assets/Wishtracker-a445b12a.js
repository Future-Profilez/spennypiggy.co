import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { A as Authenticated } from "./AuthenticatedLayout-57b60e02.js";
import { Head, Link, router } from "@inertiajs/react";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { A as Avatar } from "./Avatar-70608b1c.js";
import { P as PriceFormat } from "./PriceFormat-18bf11fa.js";
import SayThanks from "./SayThanks-271fbb98.js";
import Collapse from "react-bootstrap/Collapse";
import axios from "axios";
import confetti from "canvas-confetti";
import Nocontent from "./Nocontent-a5a8d2f7.js";
import { u as userphoto } from "./userphoto-76727e42.js";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { u as useAlerts } from "./Alerts-5da797d1.js";
import "react-hot-toast";
import "./LoaderButton-91d3595f.js";
import "./uploader.module-d5dbf507.js";
import "@uploadcare/blocks";
function Confetti({ sender, is_read_owner, children, onclick, classes }) {
  const startConfetti = () => {
    console.log("clicked");
    if (sender) {
      return false;
    }
    console.log("clicked 1");
    if (is_read_owner == 1) {
      return false;
    }
    console.log("clicked 2");
    onclick && onclick();
    const button = document.getElementById("button-conf");
    button.getBoundingClientRect();
    const origin = {
      x: 0.5,
      y: 0.1
    };
    const myCanvas = document.createElement("canvas");
    document.body.appendChild(myCanvas);
    const defaults = {
      disableForReducedMotion: true
    };
    const colors = ["#05EFB8", "#8C52FF", "#E6EA7B", "#F94F97", "#05EFB8", "#8C52FF", "#E6EA7B", "#F94F97"];
    function fire(particleRatio, opts) {
      confetti(
        Object.assign({}, defaults, opts, {
          particleCount: Math.floor(200 * particleRatio)
        })
      );
    }
    setTimeout(() => {
      fire(0.25, {
        spread: 26,
        startVelocity: 10,
        origin,
        colors
      });
      fire(0.2, {
        spread: 200,
        startVelocity: 40,
        origin,
        colors
      });
      fire(0.35, {
        spread: 150,
        startVelocity: 55,
        decay: 0.91,
        origin,
        colors
      });
      fire(0.1, {
        spread: 150,
        startVelocity: 60,
        decay: 0.92,
        origin,
        colors
      });
      fire(0.1, {
        spread: 220,
        startVelocity: 20,
        origin,
        colors
      });
    }, 1);
  };
  useEffect(() => {
    return () => {
      const myCanvas = document.querySelector("canvas");
      myCanvas && myCanvas.remove();
    };
  }, []);
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("div", { className: classes, id: "button-conf", onClick: startConfetti, children }) });
}
const defaultsec = "https://ucarecdn.com/be9060ab-1a76-452f-b805-1c71d9af4fb7/";
function Wishtracker(props) {
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const TruncatedString = ({ inputString, maxLength }) => {
    if ((inputString == null ? void 0 : inputString.length) <= maxLength) {
      return /* @__PURE__ */ jsx("span", { children: inputString });
    }
    const truncatedString = `${inputString == null ? void 0 : inputString.slice(0, 7)}..`;
    return /* @__PURE__ */ jsx("span", { children: truncatedString });
  };
  const { format } = PriceFormat();
  const { auth, user, tracks, user_subs, creator_subs } = props;
  const [stab, setStab] = useState(1);
  const handleTabs = (e) => {
    setStab(e);
  };
  const Wish = ({ n }) => {
    const [open, setOpen] = useState(false);
    const [isUserRead, setIsUserRead] = useState(n && n.is_read_user);
    const [isOwnerRead, setIsOwnerRead] = useState(n && n.is_read_owner);
    const [message_media, setmessage_media] = useState(n && n.message_media);
    const [msgSent, setMsgSent] = useState(n && n.message);
    const [media_type, setmedia_type] = useState(n && n.media_type);
    const [message_url, setmessage_url] = useState(n && n.message_url);
    const getMessageStatus = (m, f) => {
      if (f) {
        setmessage_media(true);
        setmessage_url(f && f.cdnUrl);
        setmedia_type(f && f.contentInfo && f.contentInfo.mime.type);
      }
      setMsgSent(m);
    };
    async function handleStatus(e) {
      setIsUserRead(1);
      e.preventDefault();
      axios.get(`/read-status/${n.id}/${n.sender ? "user" : "owner"}`).then((resp) => {
        console.error("resp", resp);
        return true;
      }).catch((_err) => {
        console.error("error", _err);
        return true;
      });
    }
    const openState = () => {
      setOpen(!open);
    };
    async function controlStatus(e) {
      openState();
      setIsOwnerRead(1);
    }
    console.log("props track", props);
    return /* @__PURE__ */ jsx(
      Confetti,
      {
        sender: n && n.sender,
        is_read_owner: isOwnerRead,
        onclick: controlStatus,
        classes: "w-100",
        children: /* @__PURE__ */ jsxs("div", { onClick: handleStatus, className: "trackItem cursor-pointer shadow-pink box mb-4", children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: openState,
              "aria-controls": "example-collapse-text",
              "aria-expanded": open,
              className: " cursor-pointer trackbar ",
              children: [
                n && !n.sender && isOwnerRead !== 1 ? /* @__PURE__ */ jsx("div", { className: "newwish justify-content-between py-2 d-flex align-items-center", children: /* @__PURE__ */ jsx("h2", { className: "granted-wish  font-GillSans ", children: "New Wish Granted. Tap to see" }) }) : "",
                /* @__PURE__ */ jsxs("div", { className: "d-flex align-items-center justify-content-between", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-dark", children: /* @__PURE__ */ jsx(
                    Avatar,
                    {
                      name: `From : ${n && n.user && n.user.name || "Anonymous"}`,
                      link: n.user && n.user.username || null,
                      subhead: n.wish && n.wish.wishname || "Surprise Gift",
                      username: n.user && n.user.username || "Surprise Gift",
                      src: n && n.user && n.user.avatar_url || userphoto
                    }
                  ) }),
                  /* @__PURE__ */ jsxs("div", { className: "text-muted rightbar d-flex align-items-center ", children: [
                    n && n.sender ? /* @__PURE__ */ jsxs("div", { className: "identity text-danger text-nowrap", children: [
                      "-",
                      format(n.amount * (+n.quantity || 1))
                    ] }) : /* @__PURE__ */ jsxs("div", { className: "identity text-success text-nowrap", children: [
                      "+",
                      format(n.amount * (+n.quantity || 1))
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "angle-icon", children: /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
                      " ",
                      /* @__PURE__ */ jsx("g", { id: "SVGRepo_bgCarrier", "stroke-width": "0" }),
                      " ",
                      /* @__PURE__ */ jsx("g", { id: "SVGRepo_tracerCarrier", "stroke-linecap": "round", "stroke-linejoin": "round" }),
                      " ",
                      /* @__PURE__ */ jsxs("g", { id: "SVGRepo_iconCarrier", children: [
                        " ",
                        /* @__PURE__ */ jsx("path", { d: "M12 14.5C11.9015 14.5005 11.8038 14.4813 11.7128 14.4435C11.6218 14.4057 11.5392 14.3501 11.47 14.28L8 10.78C7.90861 10.6391 7.86719 10.4715 7.88238 10.3042C7.89756 10.1369 7.96848 9.97954 8.08376 9.85735C8.19904 9.73515 8.352 9.65519 8.51814 9.63029C8.68428 9.6054 8.85396 9.63699 9 9.72003L12 12.72L15 9.72003C15.146 9.63699 15.3157 9.6054 15.4819 9.63029C15.648 9.65519 15.801 9.73515 15.9162 9.85735C16.0315 9.97954 16.1024 10.1369 16.1176 10.3042C16.1328 10.4715 16.0914 10.6391 16 10.78L12.5 14.28C12.3675 14.4144 12.1886 14.4931 12 14.5Z", fill: "#000000" }),
                        " "
                      ] }),
                      " "
                    ] }) }),
                    n && n.sender && !isUserRead ? /* @__PURE__ */ jsx("div", { className: "counter_name", children: "1" }) : ""
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx(Collapse, { in: open, children: /* @__PURE__ */ jsx("div", { id: "example-collapse-text", children: /* @__PURE__ */ jsxs("div", { className: "track-summary mt-4", children: [
            /* @__PURE__ */ jsx("div", { className: "table", children: /* @__PURE__ */ jsxs("table", { children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { children: "Item" }),
                /* @__PURE__ */ jsx("td", { children: "Name" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("div", { className: "wish-item", children: /* @__PURE__ */ jsx("img", { src: n.wish && n.wish.perma_link || defaultsec, alt: "image", className: "img-fluid" }) }) }),
                /* @__PURE__ */ jsxs("td", { children: [
                  /* @__PURE__ */ jsx("p", { children: n.wish && n.wish.wishname || "Surprise Gift" }),
                  /* @__PURE__ */ jsx("p", { className: "text-muted text-small", children: n && n.surprise_message }),
                  /* @__PURE__ */ jsxs("p", { className: "text-muted text-small", children: [
                    n.quantity || 1,
                    " x ",
                    format(n.amount)
                  ] })
                ] })
              ] }) })
            ] }) }),
            /* @__PURE__ */ jsxs("p", { children: [
              "Date ",
              n.created_at
            ] }),
            n && n.cart_message ? /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Sender Note : " }),
              /* @__PURE__ */ jsx("p", { className: "text-muted", children: n && n.cart_message })
            ] }) : "",
            msgSent ? /* @__PURE__ */ jsxs("div", { className: "msgSent my-2", children: [
              /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Thank you note : " }),
              /* @__PURE__ */ jsx("p", { className: "text-muted", children: msgSent }),
              message_media ? /* @__PURE__ */ jsx("div", { className: "message-media my-2", children: media_type == "image" ? /* @__PURE__ */ jsx(
                LazyLoadImage,
                {
                  src: message_url,
                  alt: "image",
                  height: "100%",
                  useIntersectionObserver: true,
                  effect: "blur",
                  width: "100%"
                }
              ) : /* @__PURE__ */ jsx("video", { playsInline: false, controlsList: "nodownload", controls: true, src: message_url }) }) : ""
            ] }) : "",
            n && n.sender == false && !msgSent ? /* @__PURE__ */ jsx(
              SayThanks,
              {
                clearAction: open,
                getMessageStatus,
                name: n && n.user && n.user.name,
                payment_id: n.id
              }
            ) : ""
          ] }) }) })
        ] })
      }
    );
  };
  const CancelSub = ({ id, status }) => {
    const [loading, setLoading] = useState(false);
    const [manageStatus, setmanageStatus] = useState(status == 1 ? false : true);
    const cancel = (id2) => {
      setLoading(true);
      setmanageStatus(true);
      router.get(`cancel-subscription/${id2}`).then((resp) => {
        successAlert("Subscription has been cancelled.");
        setLoading(false);
        console.log("resp", resp);
        setmanageStatus(false);
      }).catch((_err) => {
        console.error("error", _err);
        setLoading(false);
      });
    };
    return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
      "button",
      {
        disabled: status !== "initiated",
        onClick: () => cancel(id),
        className: `${status !== "initiated" ? "disabled" : ""} btn-pink sm w-100 px-2 mt-3`,
        children: loading ? "Wait.." : manageStatus ? "Cancelled" : "Cancel Subscription"
      }
    ) });
  };
  return /* @__PURE__ */ jsxs(Authenticated, { auth: auth.user, user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Wish Tracker" }),
    /* @__PURE__ */ jsx("div", { className: " wishtracker blackbg min-h-screen pb-5", children: /* @__PURE__ */ jsx("div", { className: "containerbox blackbg cartPage", children: /* @__PURE__ */ jsxs(
      Tabs,
      {
        defaultActiveKey: "1",
        id: "tracker-tab",
        className: "mb-4 ",
        children: [
          /* @__PURE__ */ jsx(Tab, { eventKey: "1", title: "Wish Tracker", children: /* @__PURE__ */ jsxs("div", { className: "tracks mt-4 pt-4", children: [
            tracks && tracks.map((n, i) => {
              return /* @__PURE__ */ jsx(Wish, { n }, `track-${i}`);
            }),
            tracks && tracks.length < 1 ? /* @__PURE__ */ jsx(Nocontent, { text: "nothing to see" }) : ""
          ] }) }),
          /* @__PURE__ */ jsxs(Tab, { eventKey: "2", title: "Subscriptions", children: [
            /* @__PURE__ */ jsxs("div", { className: "subsctabs d-block d-sm-flex mb-4", children: [
              /* @__PURE__ */ jsx("button", { onClick: () => handleTabs(1), className: `${stab == 1 ? "active" : ""} me-3 btn w-100 mt-2`, children: "Active Subscription " }),
              /* @__PURE__ */ jsx("button", { onClick: () => handleTabs(0), className: `${stab == 0 ? "active" : ""} me-3 btn w-100 mt-2`, children: "My Subscribed" })
            ] }),
            stab == 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "row", children: user_subs && user_subs.map((s, i) => {
                return /* @__PURE__ */ jsx("div", { className: "col-sm-6 mb-4", children: /* @__PURE__ */ jsxs("div", { className: "subsbox box p-4", children: [
                  /* @__PURE__ */ jsx("h2", { className: "plantitle", children: s && s.wish_item && s.wish_item.wishname }),
                  /* @__PURE__ */ jsxs("ul", { className: "ps-0 mt-3", children: [
                    /* @__PURE__ */ jsxs("li", { className: "mt-2 d-flex justify-content-between border-top py-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Item Owner" }),
                      /* @__PURE__ */ jsx("p", { className: "text-dark text-capitalize", children: /* @__PURE__ */ jsx(Link, { href: `/${s && s.username || s && s.guest_name}`, className: "text-voilet", children: s && s.guest_name || "Anonymous" }) })
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "mt-2 d-flex justify-content-between border-top py-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Subscription Period" }),
                      /* @__PURE__ */ jsx("p", { className: "text-dark text-capitalize", children: s && s.recurring_type })
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "mt-2 d-flex justify-content-between border-top py-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Price" }),
                      /* @__PURE__ */ jsx("p", { className: "text-dark text-capitalize", children: format(s && s.amount) })
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "mt-2 d-flex justify-content-between border-top py-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Start Date" }),
                      /* @__PURE__ */ jsx("p", { className: "text-dark text-capitalize", children: s && s.created_at })
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "mt-2 d-flex justify-content-between border-top py-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Status" }),
                      /* @__PURE__ */ jsx("p", { className: "text-dark text-capitalize", children: s && s.status == "initiated" ? /* @__PURE__ */ jsx("span", { className: "badge bg-success", children: s && s.status }) : /* @__PURE__ */ jsx("span", { className: "badge bg-danger", children: "Expired" }) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx(CancelSub, { status: s && s.status, id: s && s.id })
                ] }) }, `subscription-${i}`);
              }) }),
              user_subs && user_subs.length < 1 ? /* @__PURE__ */ jsx(Nocontent, { classes: "mt-5", text: "Nothing to see." }) : ""
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "row", children: creator_subs && creator_subs.map((s, i) => {
                return /* @__PURE__ */ jsx("div", { className: "col-sm-6 mb-4", children: /* @__PURE__ */ jsxs("div", { className: "subsbox box p-3", children: [
                  /* @__PURE__ */ jsx(
                    Avatar,
                    {
                      name: /* @__PURE__ */ jsx(TruncatedString, { inputString: s && s.user && s.user.name || "Anonymous", maxLength: 10 }),
                      username: `${s && s.user && s.user.username || "Anonymous"}`,
                      src: `${s && s.user && s.user.avatar || userphoto}`
                    }
                  ),
                  /* @__PURE__ */ jsxs("ul", { className: "ps-0 mt-3", children: [
                    /* @__PURE__ */ jsxs("li", { className: "mt-2 d-flex justify-content-between border-top py-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Subscription Item" }),
                      /* @__PURE__ */ jsx("p", { className: "text-dark text-capitalize wishname-text", children: s && s.wish_item && s.wish_item.wishname })
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "mt-2 d-flex justify-content-between border-top py-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Subscription Period" }),
                      /* @__PURE__ */ jsx("p", { className: "text-dark text-capitalize", children: s && s.wish_item && s.wish_item.subscription_period })
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "mt-2 d-flex justify-content-between border-top py-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Price" }),
                      /* @__PURE__ */ jsx("p", { className: "text-dark text-capitalize", children: format(s && s.wish_item && s.wish_item.price) })
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "mt-2 d-flex justify-content-between border-top py-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Start Date" }),
                      /* @__PURE__ */ jsx("p", { className: "text-dark text-capitalize", children: s && s.created_at })
                    ] }),
                    /* @__PURE__ */ jsxs("li", { className: "mt-2 d-flex justify-content-between border-top py-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Status" }),
                      /* @__PURE__ */ jsx("p", { className: "text-dark text-capitalize", children: s && s.status ? /* @__PURE__ */ jsx("span", { className: "badge bg-success", children: "Active" }) : /* @__PURE__ */ jsx("span", { className: "badge bg-danger", children: "Expired" }) })
                    ] })
                  ] })
                ] }) }, `subscription-${i}`);
              }) }),
              creator_subs && creator_subs.length < 1 ? /* @__PURE__ */ jsx(Nocontent, { classes: "mt-5", text: "Nothing to see." }) : ""
            ] })
          ] })
        ]
      }
    ) }) })
  ] });
}
export {
  Wishtracker as default
};
