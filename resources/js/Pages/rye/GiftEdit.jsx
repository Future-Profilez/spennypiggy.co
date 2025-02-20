import Popup from "@/Components/Popup";
import React from "react";
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
            modalclassName="pinkmodal"
            classes="d-none"
        >
            GiftEdit
        </Popup>
    );
}
