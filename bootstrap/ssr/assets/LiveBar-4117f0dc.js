import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import styled, { keyframes } from "styled-components";
const slideAnimation = keyframes`
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-50%);
  }
`;
const LiveBarWrapper = styled.div`
  position: relative;
  overflow: hidden;
`;
const ScrollingContainer = styled.div`
  white-space: nowrap;
  animation: ${slideAnimation} 18s linear infinite; 
  display: flex;
`;
const ScrollingContent = styled.div`
  display: flex;
  margin-right: 2rem; 
`;
const LiveBar = () => {
  return /* @__PURE__ */ jsx("div", { className: "pb-2 pb-md-0 blackbg", children: /* @__PURE__ */ jsxs(LiveBarWrapper, { className: "livebar mintbg py-3 pb-2 px-2", children: [
    /* @__PURE__ */ jsx("style", { children: `
         .livebar p{font-size:18px;text-transform:uppercase;}
         @media(max-width:575px){
            .livebar p{font-size:15px;}
         }
      ` }),
    /* @__PURE__ */ jsx(ScrollingContainer, { children: /* @__PURE__ */ jsxs(ScrollingContent, { children: [
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" }),
      /* @__PURE__ */ jsx("p", { className: "mb-0 mx-3 font-GillSans text-uppercase", children: "🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨" })
    ] }) })
  ] }) });
};
export {
  LiveBar as default
};
