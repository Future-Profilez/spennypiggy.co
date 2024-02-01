import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import PriceFormat from "@/includes/PriceFormat";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import PinWish from "@/includes/PinWish";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function Billslist(props) {
    const { format, formatMultiPrice } = PriceFormat();
    const {
        currency,
        itm,
        itemid,
        auth,
        IsloggedIn,
        fetchingcats,
        categories,
        setuped,
        classes,
        showall,
        key,
    } = props;

    const {
        attributes,
        listeners,
        isDragging,
        index,
        over,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: itm && itm.id });
    const style = {
        transform: CSS.Translate.toString(transform),
    };
    const stylenone = {
        transform: "",
    };

    const [itemUID, setItemUID] = useState(itemid);
    const [open, setOpen] = useState();

    // useEffect(() => {
    //     if (itemUID == itm.uuid) {
    //         setOpen(true);
    //     }
    // }, [itemUID]);

    const getPercentage = (actual, paid) => {
        const r = (paid / actual) * 100;
        return r.toFixed(1);
    };

    return (
        <div
            key={key}
            style={IsloggedIn ? style : stylenone}
            className={`wish-item-box ${classes} ${
                isDragging ? "dragging" : ""
            }`}
        >
            <div className="wishlistcntbox mb-3 mb-sm-4 whbg relative  shadow-voilet ">
                <div className="wishlistimg cursor-pointer">
                    <LazyLoadImage
                        alt={"image"}
                        useIntersectionObserver={true}
                        effect="blur"
                        height={193}
                        src={itm?.perma_link ? itm?.perma_link : <></>}
                        className=""
                        width={243}
                    />
                </div>
            </div>
        </div>
    );
}
