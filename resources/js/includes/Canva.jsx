import { useEffect } from "react";
const CanvaButton = () => {
  const apiKey = '18dxRFfjOIGvPQbq1TSGErFi';
  //   useEffect(() => {
  //       if (window.Canva && apiKey) {
  //           window.Canva.init({
  //               apiKey: apiKey,
  //           });
  //       }
  //   }, [apiKey]);

    return (
        <div
            className="canva-design-button"
            data-design-button-api-key={apiKey}
            data-design-button-type="new"
            data-design-button-name="Create Design"
            data-design-button-redirect-to="/path-after-success"
        ></div>
    );
};

export default CanvaButton;