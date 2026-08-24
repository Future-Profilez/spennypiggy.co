import { useState } from "react";
import TipInner from "./TipInner";
import lazyRetry from "@/utils/lazyRetry";
const Popup = lazyRetry(() => import("@/Components/Popup"));
export default function SendTip({auth, classes, card_capabilities}) {
    const [close, setClose] = useState();
    return (
        <>
            <Popup hidecontrols={true} bodyclass=' bg-voilet' modalclass="pinkmodals basic full" space="0" size="md"
            action={close} classes={`border-black uppercase font-bold text-xs md:text-sm rounded-box-sm px-4 md:px-6 py-2 md:py-3 !bg-[#FF007F] text-black whitespace-nowrap transition-[filter] duration-200 hover:brightness-110 active:brightness-95 ${classes} ${auth?.user ? 'loggedin' : 'logout'} `}
            text={`Support Me`} >
                <TipInner idd={2} card_capabilities={card_capabilities} />
            </Popup>
        </>
    );
}
