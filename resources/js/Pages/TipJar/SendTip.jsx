import { useState, lazy } from "react";
import TipInner from "./TipInner";
const Popup = lazy(() => import("@/Components/Popup"));
export default function SendTip({auth, classes, card_capabilities}) {
    const [close, setClose] = useState();
    return (
        <>
            <Popup hidecontrols={true} bodyclass=' bg-voilet' modalclass="pinkmodals basic full" space="0" size="md"
            action={close} classes={`border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-bold text-xs md:text-sm rounded-[15px] px-4 md:px-6 py-2 md:py-3 !bg-[#FF007F] text-black whitespace-nowrap hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300 mr-3 ${classes} ${auth?.user ? 'loggedin' : 'logout'} `}
            text={`Support Me`} >
                <TipInner idd={2} card_capabilities={card_capabilities} />
            </Popup>
        </>
    );
}
