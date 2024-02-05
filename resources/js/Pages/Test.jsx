import axios from "axios";
import { useRef } from "react";
import { useEffect } from "react";
import AddBills from "./bills/AddBills";
import Billslist from "./bills/Billslist";
export default function Test() {
    const file = {
        uuid: "5360fd62-eb19-4ac8-91b8-528c08a2e79b",
        name: "c3.png",
        size: 415841,
        isStored: true,
        isImage: true,
        mimeType: "image/png",
        cdnUrl: "https://ucarecdn.com/5360fd62-eb19-4ac8-91b8-528c08a2e79b/-/crop/352x348/192,0/-/preview/",
        s3Url: null,
        originalFilename: "c3.png",
        imageInfo: {
            dpi: [72, 72],
            width: 700,
            format: "PNG",
            height: 460,
            sequence: false,
            colorMode: "RGBA",
            orientation: null,
            geoLocation: null,
            datetimeOriginal: null,
        },
        videoInfo: null,
        contentInfo: {
            mime: {
                mime: "image/png",
                type: "image",
                subtype: "png",
            },
            image: {
                dpi: [72, 72],
                width: 700,
                format: "PNG",
                height: 460,
                sequence: false,
                colorMode: "RGBA",
                orientation: null,
                geoLocation: null,
                datetimeOriginal: null,
            },
        },
        metadata: {},
        s3Bucket: null,
        defaultEffects: null,
        cdnUrlModifiers: "-/crop/352x348/192,0/",
    };

    const post = () => {
        axios
            .post(`/bill/save`, {
                name: "Bijli bill",
                price: 50.0,
                thumbnail: file,
            })
            .then((resp) => {
                console.log("resp", resp);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    const get = () => {
        axios
            .get(`/bills/test`)
            .then((resp) => {
                console.log("resp", resp);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    const qrcode = useRef();
    useEffect(() => {
        if (qrcode.current) {
            qrcode.current.focus();
        }
    }, []);

    return (
        <div className="text-white">
            <button onClick={get}>Test Get Request</button>
            <button onClick={post}>Test Post Request</button>

            <button>
                {" "}
                <AddBills />
            </button>

            <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque
                rem velit ipsam dolorem aspernatur assumenda fuga magnam est
                ducimus neque a officia, alias dicta deserunt asperiores
                explicabo distinctio, aut doloribus.
            </p>
            <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque
                rem velit ipsam dolorem aspernatur assumenda fuga magnam est
                ducimus neque a officia, alias dicta deserunt asperiores
                explicabo distinctio, aut doloribus.
            </p>
            <button
                ref={qrcode}
                className="box p-5 text-dark rounded w-25 mx-5 my-5"
            >
                QR CODE
            </button>
            <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque
                rem velit ipsam dolorem aspernatur assumenda fuga magnam est
                ducimus neque a officia, alias dicta deserunt asperiores
                explicabo distinctio, aut doloribus.
            </p>
        </div>
    );
}
