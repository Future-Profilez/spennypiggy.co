import { useState, lazy } from "react";
import TipInner from "./TipInner";
const Popup = lazy(() => import("@/Components/Popup"));
export default function SendTip({auth, classes, card_capabilities}) {
    const [close, setClose] = useState();
    return (
        <>
            <Popup hidecontrols={true} bodyclass=' bg-voilet' modalclass="pinkmodals basic full" space="0" size="md"
            action={close} classes={`border-[3px] border-black uppercase font-bold text-xs md:text-sm rounded-box-sm px-4 md:px-6 py-2 md:py-3 !bg-[#FF007F] text-white whitespace-nowrap hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-300 ${classes} ${auth?.user ? 'loggedin' : 'logout'} `}
            text={`Support Me`} >
                <TipInner idd={2} card_capabilities={card_capabilities} />
            </Popup>
        </>
    );
}
