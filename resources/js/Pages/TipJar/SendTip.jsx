import { useState, lazy } from "react";
import TipInner from "./TipInner";
const Popup = lazy(() => import("@/Components/Popup"));
export default function SendTip({auth, classes, card_capabilities}) {
    const [close, setClose] = useState();
    return (
        <>
            <Popup hidecontrols={true} bodyclass=' bg-voilet' modalclass="pinkmodals basic full" space="0" size="md"
            action={close} classes={`border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-gulfs  text-[15px] font-bold rounded-[17px] px-6 py-2.5 !bg-[#FF007F] text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]  transition-all ${classes} ${auth?.user ? 'loggedin' : 'logout'} `}
            text={`Support Me`} >
                <TipInner idd={2} card_capabilities={card_capabilities} />
            </Popup>
        </>
    );
}
