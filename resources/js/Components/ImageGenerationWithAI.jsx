import axios from "axios";
import { useState } from "react";
import Popup from "./Popup";
import { useAlerts } from "./Alerts";

export default function ImageGenerationWithAI({ classes, size, update }) {
    const [close, setClose] = useState();
    const [prompt, setPrompt] = useState("");
    const [generating, setGenerating] = useState(false);
    const [AiImage, setAiImage] = useState(null);
    const { successAlert, errorAlert } = useAlerts();

    const renerate = () => {
        setGenerating(true);
        axios
            .post("/dalle-image", { prompt: prompt, size: size || "1024x1024" })
            .then((resp) => {
                setGenerating(false);
                if (resp.data.status) {
                    successAlert(
                        resp.data.success || "Image generated successfully."
                    );
                    setAiImage(resp.data.image_url);
                } else {
                    errorAlert(
                        resp.data.data.error.message ||
                            "Failed to generate image. Please try again."
                    );
                }
            })
            .catch((err) => {
                setGenerating(false);
                errorAlert(
                    err.response.data.errors.prompt || "Something went wrong."
                );
            });
    };

    const ReDesign = () => {
        setAiImage(null);
    };

    const [updating, setUpdating] = useState(false);
    const useThis = () => {
        setUpdating(true);
        axios
            .post("/upload-dalle-image", { url: AiImage.url })
            .then((resp) => {
                setUpdating(false);
                if (resp.data.status) {
                    setClose(false);
                    setAiImage(null);
                    update && update({ uuid: resp.data.uuid, url: AiImage.url });
                } else {
                    errorAlert(
                        resp.data.message ||
                            "Failed to upload image. Please try again."
                    );
                }
            })
            .catch((err) => {
                setUpdating(false);
                errorAlert(err.response.data.error || "Something went wrong.");
            });
    };

    return (
        <div>
            <Popup
                modalclass="editprofile full"
                size="md" space="6"
                action={close}
                text={<> USE AI 🤖</>}
                classes={`${ classes ? classes : "button bg-pink block sm:flex mx-auto sm:mx-0 hover:opacity-80"
                }`} >
                <div className="p-4">
                    <h2 className="mb-0 text-large font-bold">
                        IMAGE GENERATE WITH AI
                    </h2>
                    {generating ? (
                        <div className="pt-4">
                            <div className="spinner ">
                                <div className="flex animate-bounce justify-center items-center min-h-[100px]">
                                    <div className="flex flex-row gap-2">
                                        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce"></div>
                                        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.3s]"></div>
                                        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:-.5s]"></div>
                                    </div>
                                </div>
                                <h2 className="text-center text-lg font-normal">
                                    Image Generating...
                                </h2>
                            </div>
                        </div>
                    ) : (
                        <>
                            {AiImage && AiImage.url ? (
                                <div className="pt-4">
                                    <img
                                        className="w-full max-h-[350px] object-cover rounded-box md:rounded-box  "
                                        src={AiImage.url}
                                        alt="image"
                                    />
                                    <button
                                        className="bg-gray-300 text-black py-2 px-3 uppercase mx-auto block rounded-box mt-4 transition-colors duration-200 hover:bg-gray-400"
                                        onClick={ReDesign}
                                    >
                                        Re-Generate
                                    </button>
                                    <button
                                        className="pinkbg py-2 px-3 text-black uppercase mx-auto block rounded-box mt-2 transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                                        onClick={useThis}
                                    >
                                        {updating
                                            ? "Uploading..."
                                            : "Use this image"}
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-4">
                                    <div className="mt-1">
                                        <textarea
                                            defaultValue={prompt}
                                            onChange={(e) =>
                                                setPrompt(e.target.value)
                                            }
                                            className="input rounded-box-sm md:rounded-box  border border-gray-500 w-full p-3"
                                            placeholder="Enter prompt for AI image generation...."
                                        />
                                    </div>
                                    <button
                                        /* ⚠️ This used to be `hover:bg-black` — with the
                                           button's type now black on pink, hovering painted
                                           black on black and the label disappeared. An accent
                                           button brightens; it does not change hue. */
                                        className="pinkbg w-full font-gulfs py-2 px-3 text-black uppercase transition-[filter] duration-200 hover:brightness-110 active:brightness-95 mx-auto block rounded-box mt-3"
                                        onClick={renerate}
                                    >
                                        Generate
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Popup>
        </div>
    );
}
