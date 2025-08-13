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
                modalclassName="editprofile full"
                size="md"
                action={close}
                text={<> USE AI 🤖</>}
                classes={`${
                    classes
                        ? classes
                        : "button bg-pink d-table d-sm-flex m-auto m-sm-0 hover:opacity-80"
                }`}
            >
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
                                        className="w-full max-h-[350px] object-cover rounded-xl"
                                        src={AiImage.url}
                                        alt="image"
                                    />
                                    <button
                                        className="btn bg-gray-300 text-black py-2 px-3 hover:border-gray-300 uppercase m-auto table rounded-2xl mt-4"
                                        onClick={ReDesign}
                                    >
                                        Re-Generate
                                    </button>
                                    <button
                                        className="btn pinkbg py-2 px-3 text-white hover:border-gray-300 hover:bg-black
                                 uppercase m-auto table rounded-2xl mt-2"
                                        onClick={useThis}
                                    >
                                        {updating
                                            ? "Uploading..."
                                            : "Use this image"}
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-4">
                                    <div className="mt-4">
                                        <textarea
                                            defaultValue={prompt}
                                            onChange={(e) =>
                                                setPrompt(e.target.value)
                                            }
                                            className="input rounded-xl border border-gray-500 w-full p-3"
                                            placeholder="Enter prompt for AI image generation...."
                                        />
                                    </div>
                                    <button
                                        className="btn pinkbg py-2 px-3 text-white uppercase hover:border-gray-300 hover:bg-black m-auto table rounded-2xl mt-3"
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
