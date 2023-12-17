import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-57b60e02.js";
import { Head, Link } from "@inertiajs/react";
import { u as userphoto } from "./userphoto-76727e42.js";
import { A as Avatar } from "./Avatar-70608b1c.js";
import axios from "axios";
import { useState, useMemo } from "react";
import LargestGifts from "./LargestGifts-b952acc3.js";
import "react-hot-toast";
import "./Alerts-5da797d1.js";
function Board(props) {
  const { auth, data } = props;
  console.log("props leaderboard ", props);
  const [positions, setPositions] = useState([]);
  const [ranks, setRanks] = useState([]);
  const filterPositions = (d) => {
    const newData = [...d];
    const positionsData = newData.slice(0, 3);
    const ranksData = newData.slice(3);
    setPositions(positionsData);
    setRanks(ranksData);
  };
  useMemo(() => {
    filterPositions(data);
  }, [data]);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const switchTime = (e) => {
    setPeriod(e);
    setLoading(true);
    axios.get(`leaderboard/${e}`).then((resp) => {
      filterPositions(resp.data.data);
      setLoading(false);
    }).catch((_err) => {
      console.error("error", _err);
      setLoading(false);
    });
  };
  const Rank = ({ r }) => {
    return /* @__PURE__ */ jsxs("div", { className: "rank py-3 border-bottom d-flex align-items-center justify-content-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "d-flex align-items-center justify-content-between", children: [
        /* @__PURE__ */ jsx("div", { className: "sno me-4 ps-2", children: /* @__PURE__ */ jsxs("p", { children: [
          "#",
          r && r.rank
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "wisher", children: /* @__PURE__ */ jsx(
          Avatar,
          {
            name: r && r.name || "Anonymous",
            link: r && r.username || "",
            subhead: r && r.username || null,
            username: r && r.username || null,
            src: r && r.avatar || userphoto
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rank-stats", children: /* @__PURE__ */ jsx("p", { className: "toppercentage pe-4", children: "0.01%" }) })
    ] });
  };
  const Position = ({ p, position }) => {
    return /* @__PURE__ */ jsx(Fragment, { children: p && p.username ? /* @__PURE__ */ jsx(Link, { href: p && p.username, className: `position-${position} position text-center rounded-lg shadow-pink bg-white`, children: /* @__PURE__ */ jsxs("div", { className: "profile p-3 pb-0", children: [
      /* @__PURE__ */ jsx("div", { className: "profile-image", children: /* @__PURE__ */ jsx("img", { src: p && p.avatar || userphoto, className: "img-fluid", alt: "image" }) }),
      /* @__PURE__ */ jsxs("div", { className: "profile-content", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-bold text-large pt-2", children: p && p.name || "Anonymous" }),
        /* @__PURE__ */ jsxs("p", { className: "toppercentage text-center", children: [
          p && p.top,
          "% "
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: `rank-position `, children: /* @__PURE__ */ jsx("h2", { className: "font-GillSans", children: position }) })
    ] }) }) : /* @__PURE__ */ jsx("div", { className: `position-${position} position text-center rounded-lg shadow-pink bg-white`, children: /* @__PURE__ */ jsxs("div", { className: "profile p-3 pb-0", children: [
      /* @__PURE__ */ jsx("div", { className: "profile-image", children: /* @__PURE__ */ jsx("img", { src: p && p.avatar || userphoto, className: "img-fluid", alt: "image" }) }),
      /* @__PURE__ */ jsxs("div", { className: "profile-content", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-bold text-large pt-2", children: p && p.name || "Anonymous" }),
        /* @__PURE__ */ jsxs("p", { className: "toppercentage text-center", children: [
          p && p.top,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: `rank-position `, children: /* @__PURE__ */ jsx("h2", { className: "font-GillSans", children: position }) })
    ] }) }) });
  };
  return /* @__PURE__ */ jsxs(Authenticated, { auth: auth && auth.user, children: [
    /* @__PURE__ */ jsx(Head, { title: "Cart" }),
    /* @__PURE__ */ jsx("div", { className: "blackbg", children: /* @__PURE__ */ jsx("div", { className: "containerbox pb-5 ", children: /* @__PURE__ */ jsxs("div", { className: "row", children: [
      /* @__PURE__ */ jsx("div", { className: "col-lg-8 mb-4", children: /* @__PURE__ */ jsxs("div", { className: "pe-md-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "pt-4 pt-md-0 d-block d-md-flex align-items-center justify-content-between mb-4 pb-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-bl font-GillSans  text-start text-2xl uppercase text-white ", children: "Leaderboard" }),
          /* @__PURE__ */ jsxs("div", { className: "changePeriod", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                className: period == "monthly" ? "active" : "",
                onClick: () => switchTime("monthly"),
                children: "Montly"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: period == "weekly" ? "active" : "",
                onClick: () => switchTime("weekly"),
                children: "Weekly"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: period == "daily" ? "active" : "",
                onClick: () => switchTime("daily"),
                children: "Daily"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: `${loading ? "loading-state" : ""}  postions pb-5 pt-5 mt-3`,
            children: [
              positions && positions[1] ? /* @__PURE__ */ jsx(
                Position,
                {
                  position: 2,
                  p: positions && positions[1]
                }
              ) : "",
              positions && positions[0] ? /* @__PURE__ */ jsx(
                Position,
                {
                  position: 1,
                  p: positions && positions[0]
                }
              ) : "",
              positions && positions[2] ? /* @__PURE__ */ jsx(
                Position,
                {
                  position: 3,
                  p: positions && positions[2]
                }
              ) : ""
            ]
          }
        ),
        ranks && ranks.length ? /* @__PURE__ */ jsx(
          "div",
          {
            className: `${loading ? "loading-state" : ""}  rank_lists bg-white py-3 px-3 rounded-lg`,
            children: ranks.map((r, i) => {
              return /* @__PURE__ */ jsx(Rank, { r }, i);
            })
          }
        ) : ""
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "col-lg-4", children: /* @__PURE__ */ jsx(LargestGifts, {}) })
    ] }) }) })
  ] });
}
export {
  Board as default
};
