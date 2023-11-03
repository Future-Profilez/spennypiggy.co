import * as LR from "@uploadcare/blocks";
import { useCallback, useEffect, useRef } from "react";

LR.registerBlocks(LR);

export default function GlobalUploader({ options, sendFile }) {

    const dataOutputRef = useRef();

    const handleUploaderEvent = useCallback((e) => {
        const { data } = e.detail;
        console.log("data", data);
        sendFile(data);
    }, []);

    useEffect(() => {
        const el = dataOutputRef && dataOutputRef.current;
        el && el.addEventListener("lr-data-output", handleUploaderEvent);
        return () => {
            el && el.removeEventListener("lr-data-output", handleUploaderEvent);
        };
    }, [handleUploaderEvent]);

    return <>

        <lr-file-uploader-minimal
            class={options}
            css-src="https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.25.0/web/lr-file-uploader-minimal.min.css">
            <lr-data-output
                use-event ref={dataOutputRef}
                hidden use-template
                class={options}
                onEvent={handleUploaderEvent}>
            </lr-data-output>
        </lr-file-uploader-minimal>

    </>
}