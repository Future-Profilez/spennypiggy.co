import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/free-mode';
import { Autoplay, FreeMode } from 'swiper/modules';
import PaymentIcon1 from "../../../assets/new/PaymentIcon1.png";
import PaymentIcon2 from "../../../assets/new/PaymentIcon2.png";
import PaymentIcon3 from "../../../assets/new/PaymentIcon3.png";
import PaymentIcon4 from "../../../assets/new/PaymentIcon4.png";
import PaymentIcon5 from "../../../assets/new/PaymentIcon5.png";
import PaymentIcon6 from "../../../assets/new/PaymentIcon6.png";

const logos = [
    { src: PaymentIcon1, alt: 'Plaid' },
    { src: PaymentIcon2, alt: 'Apple Pay' },
    { src: PaymentIcon3, alt: 'Cash App' },
    { src: PaymentIcon4, alt: 'Stripe' },
    { src: PaymentIcon5, alt: 'Visa' },
    { src: PaymentIcon6, alt: 'Mastercard' },
    { src: PaymentIcon1, alt: 'Plaid' },
    { src: PaymentIcon2, alt: 'Apple Pay' },
    { src: PaymentIcon3, alt: 'Cash App' },
    { src: PaymentIcon4, alt: 'Stripe' },
    { src: PaymentIcon5, alt: 'Visa' },
    { src: PaymentIcon6, alt: 'Mastercard' },
  ];

export default function PaymentSlider() {
  return (
    <div className="py-4 overflow-x-hidden mb-8">
    <Swiper
      modules={[Autoplay, FreeMode]}
      spaceBetween={20}
      slidesPerView={'auto'}
      freeMode={true}
      autoplay={{
        delay: 0,
        disableOnInteraction: false,
      }}
      speed={3000}
      loop={true}
      grabCursor={false}
    >
      {logos.map((logo, index) => (
        <SwiperSlide
          key={index}
          className="!w-auto overflow-visible h-full"
        >
          <div className={` h-[150px] flex  items-center  `}>
          <div className={`bg-[#FFC4E2]   px-4 py-1 border-[2px] border-[#8C52FF] rounded-[16px] ${index%2==0 ? "-rotate-[45deg]":"rotate-[45deg]"} shadow-md`}>
            <img
              src={logo.src}
              alt={logo.alt}
              className={`w-16 h-16 object-contain`}
            />
          </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
  )
}
