import React, { useState } from "react";
import TipInner from "./TipInner";
const Popup = React.lazy(() => import("@/Components/Popup"));
export default function SendTip(props) {
    const [close, setClose] = useState();
    return (
        <>
            <Popup hidecontrols={true} bodyclass=' bg-voilet'
            modalclass="pinkmodals basic full"
            space="0" size="md" action={close}
            classes={`btn-pink mt-3 fillbankbtn sm px-3 my-2`}
            text={`Fill my Piggy Bank`} >
                <TipInner idd={2} />
            </Popup>
        </>
    );
}
