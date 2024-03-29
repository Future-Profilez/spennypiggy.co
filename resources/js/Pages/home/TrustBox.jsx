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
    <div className="trust-pilot mt-2 pb-2" >
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
            <a href="https://uk.trustpilot.com/review/spennypiggy.co"
            target="_blank" rel="noopener"><img src={trust} placeholder='Trustpilot' />
            </a>
        </div>
    </div>
    </>
  );
};
export default TrustBox;
