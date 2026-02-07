import { useState, lazy } from "react";
import TipInner from "./TipInner";
const Popup = lazy(() => import("@/Components/Popup"));
export default function SendTip({auth, classes}) {
    const [close, setClose] = useState();
    return (
        <>
            <Popup hidecontrols={true} bodyclass=' bg-voilet' modalclass="pinkmodals basic full" space="0" size="md"
            action={close} classes={`uppercase text-sm btn-shadow font-gulfs rounded-full px-4 pt-[10px] pb-[7px] pinkbg text-white sfillbankbtn ${auth?.user ? 'loggedin' : 'logout'} `}
            text={`Support Me`} >
                <TipInner idd={2} />
            </Popup>
        </>
    );
}
