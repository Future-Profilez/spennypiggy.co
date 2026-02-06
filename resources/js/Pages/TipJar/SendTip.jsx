import { useState, lazy } from "react";
import TipInner from "./TipInner";
const Popup = lazy(() => import("@/Components/Popup"));
export default function SendTip({auth, classes}) {
    const [close, setClose] = useState();
    return (
        <>
            <Popup hidecontrols={true} bodyclassName=' bg-voilet' modalclass="pinkmodals basic full" space="0" size="md"
            action={close} classes={`uppercase text-sm font-bold rounded-full px-6 py-2.5 bg-[#F94F97] text-white shadow-lg shadow-[#F94F97]/20 hover:scale-105 transition-all ${classes} ${auth?.user ? 'loggedin' : 'logout'} `}
            text={`Support Me`} >
                <TipInner idd={2} />
            </Popup>
        </>
    );
}
