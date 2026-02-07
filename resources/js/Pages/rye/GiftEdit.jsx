import Popup from "@/Components/Popup";
import { useState } from "react";
import { useEffect } from "react";

export default function GiftEdit({action, IsloggedIn}) {
    const [close, setClose] = useState(action);
    
        useEffect(() => {
            setClose(action);
        }, [action]);
    return (
        <Popup
            size="md"
            action={close}
            modalclass="pinkmodal"
            classes="d-none"
        >
            GiftEdit
        </Popup>
    );
}
