import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
/* empty css                     */import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
function HappyCreators() {
  const [width, setWidth] = useState(window && window.innerWidth);
  function windowWidth() {
    const w = window && window.innerWidth;
    setWidth(w);
  }
  useEffect(() => {
    window.addEventListener("resize", windowWidth);
  }, []);
  const msg = [
    {
      "id": 1,
      "date": "Nov 12, 2023, 04:00 pm",
      "name": "Titch_dnb",
      "message": "Honestly, this site has been a game changer for me! I’ve been able to get new decks and keep creating the music I love! All thanks to my fans and anonymous gifts I’ve received!"
    },
    {
      "id": 2,
      "name": "ysheeblack",
      "date": "Oct 26, 2023, 05:35 pm",
      "message": "Girl… I never leave reviews but trust and believe this site is the goat! I’ve been able to upgrade my looks and put on such elevated shows! All thanks to my fans who love me! I didn’t realize how much! And I keep all the cash! Honestly, it’s crazy!"
    },
    {
      "id": 3,
      "name": "legitjustjack",
      "date": "Nov 15, 2023, 04:15 am",
      "message": "I honestly didn’t realize how much I needed spenny piggy in my life! I’ve had loads of gifts funded already and from random strangers! I didn’t realize how easy and simple it could be to get support from my fans!"
    },
    {
      "id": 4,
      "name": "_thrasytrashybitch",
      "date": "Nov 08, 2023, 11:45 pm",
      "message": "Getting to keep everything I earn has been crazy next level! This site has been key in supporting me and my goals!! Genuinely so so impressed! And it’s sexy AF to look at too! x"
    }
  ];
  return /* @__PURE__ */ jsx("div", { className: "happycreator mintbg", children: /* @__PURE__ */ jsxs("div", { className: "containerbox", children: [
    /* @__PURE__ */ jsx("h2", { className: "headingMd text-shadow-black text-pink text-center mb-10", children: "Happy Creators" }),
    /* @__PURE__ */ jsx("div", { className: "creatorslider", children: /* @__PURE__ */ jsx(
      Swiper,
      {
        spaceBetween: 0,
        pagination: { clickable: true },
        modules: [Pagination],
        slidesPerView: width < "1199" ? 1 : 3,
        children: msg && msg.map((m, i) => {
          return /* @__PURE__ */ jsx(SwiperSlide, { children: /* @__PURE__ */ jsxs("div", { className: "happyclientSec", children: [
            /* @__PURE__ */ jsx("div", { className: "clientdetail", children: /* @__PURE__ */ jsx("div", { className: "clientname ps-0", children: /* @__PURE__ */ jsxs("strong", { className: "font-CeraGRBold", children: [
              "@",
              m.name
            ] }) }) }),
            /* @__PURE__ */ jsx("p", { children: m.message }),
            /* @__PURE__ */ jsx("div", { className: "postdate", children: m.date })
          ] }) }, `swiper-item-${i}`);
        })
      }
    ) })
  ] }) });
}
export {
  HappyCreators as default
};
