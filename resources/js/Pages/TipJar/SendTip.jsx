import React, { useState } from "react";
import TipInner from "./TipInner";
const Popup = React.lazy(() => import("@/Components/Popup"));
export default function SendTip({auth}) {
    const [close, setClose] = useState();
    return (
        <>
            <Popup hidecontrols={true} bodyclassName=' bg-voilet' modalclassName="pinkmodals basic full" space="0" size="md"
            action={close} classes={`uppercase text-sm btn-shadow font-gulfs rounded-full px-4 pt-[10px] pb-[7px] pinkbg text-white sfillbankbtn ${auth?.user ? 'loggedin' : 'logout'} `}
            text={`Support Me`} >
                <TipInner idd={2} />
            </Popup>
        </>
    );
}
