import { Helmet } from "react-helmet";
import React from 'react';
import trust from '../../../assets/img/trust.png';
const TrustBox = () => {
  const ref = React.useRef(null);
    // React.useEffect(() => {
    //   if (window.Trustpilot) {
    //     window.Trustpilot.loadFromElement(ref.current, true);
    //   }
    // }, []);
  return (
    <>
    <div className="trust-pilot pt-4 pb-2 mt-4 lg:mt-0" >
        <div ref={ref} className="trustpilot-widget"
            // data-locale="en-GB"
            // data-template-id="56278e9abfbbba0bdcd568bc"
            // data-businessunit-id="6577b210459a86f997ab6735"
            // data-style-height="40px"
            // data-style-width="250px"
            // data-theme="dark"
            // data-style-width="100%" data-theme="light"
            // data-scroll-to-list='true'
            // data-allow-robots="true" data-stars="4,5"
            // data-style-alignment="left"
            >
            <a href="https://uk.trustpilot.com/review/spennypiggy.co" className="d-inline-flex items-center text-white font-bold text-[20px]"
            target="_blank" rel="noopener">Review us on&nbsp;<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.227 16.6699L19.417 23.4119L12.004 18.0239L17.227 16.6699ZM24 9.30987H14.835L12.005 0.588867L9.165 9.31187L0 9.29987L7.422 14.6969L4.582 23.4109L12.004 18.0239L16.587 14.6969L24 9.30987Z" fill="#00B67A"/>
            </svg>&nbsp;Trustpilot
            </a>
        </div>
    </div>
    </>
  );
};
export default TrustBox;
