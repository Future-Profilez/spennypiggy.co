import { useEffect } from "react";
import { useState } from "react";
import Popup from "@/Components/Popup";
import { piggy } from '@/includes/Icons';
import st from "../../../css/uploader.module.css";
import GlobalUploader from "@/uploadcare/Uploader";
import LoaderButton from "@/Components/LoaderButton";
import axios from "axios";
import { toast } from 'react-hot-toast';
import { useAlerts } from "@/Components/Alerts";
import { useRef } from "react";
import { FaPenNib } from "react-icons/fa6";
import ImageGenerationWithAI from "@/Components/ImageGenerationWithAI";
import { router, usePage } from "@inertiajs/react";

export default function AddPost({item, text, classes, isEdit, title}) {

    const {auth} = usePage().props;
    const [ close, setClose ] = useState();
    const { errorsHandling } = useAlerts();
    const [filetype, setfiletype] =  useState('image');
    const [rewardImage, setRewardImage] = useState(item?.image || '');
    const [isAiImage, setIsAiImage] = useState();
    const getAIImage = (e) =>{
        setRewardImage(e.uuid+'/-/text_align/left/center/-/font/10/fff/-/text/80px8p/8p,100p/Made%20with%20AI%20/-/format/jpeg/-/preview/');
        setIsAiImage(e.url);
    }
    const uploaderRef = useRef();
    const resetUploader = () => {
        if (uploaderRef.current) {
            uploaderRef.current.reset();
        }
    };

    const getfile = async (data) => {
        setRewardImage(data?.uuid);
        setfiletype(data && data.contentInfo && data.contentInfo.mime && data.contentInfo.mime.type);
        setIsAiImage(false)
    };

    const [data, setData] = useState({
        for_module: "membership",
        title: "",
        content: ""
    });

    useEffect(()=>{
        if(item){
            setData({
                for_module: item?.for_module || "membership",
                title: item?.title || "",
                content: item?.content || ""
            });
        }
    },[item]);

    const handleInput = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    }

    const [loading, setLoading] = useState(false);
    const submitPost = (e) => {
        e && e.preventDefault();
        if(rewardImage == '' || rewardImage == null){
            toast.error("Please choose a media image for this post.");
            return false
        }
        setLoading(true);
        axios.post(`${isEdit ? `/post/edit/${item.uuid}` : "/post/save"}`, {...data,
            image:rewardImage,
            type: rewardImage ? 'image' : "blog",
            ai_generated : isAiImage ? 1 : item && item?.ai_generated || 0
         })
        .then((resp) => {
            if(resp.data.status){
                setRewardImage();
                setData({
                    for_module: "membership",
                    title: "",
                    content:""
                });

                toast.success(resp.data.msg);
                setClose(false);
                setTimeout(()=>{
                    setClose();
                },100);
                router.visit(route('user.show', { username: auth.user.username, page: 'about' }), {
                    preserveState: true,
                    preserveScroll: true,
                });
                resetUploader();
            } else {
                toast.error(resp.data.msg);
            }
            setLoading(false);
        }).catch((_err) => {
            setLoading(false);
            errorsHandling(_err);
        });
    }
    const AddItem = () => {
        return <div className="flex items-center">
            <div className="p-1 !rounded-[30px] bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]" >
                <FaPenNib color="var(--pink)"  size="1.5rem" />
            </div>
            <div className="ps-3 text-start">
                <h2 className="text-lg font-normal font-GillSans uppercase">Post Something</h2>
                <p className="text-sm font-poppins">Add an image, update or blog post</p>
            </div>
        </div>
    }
    return (
    <Popup modalclass='' space="6" size='md' action={close}
    classes={` w-full addop bg-white rounded-[30px]  py-2 px-3 ${classes}`}
    text={text ? text : <AddItem />} >
        {/* <form onSubmit={submitPost} > */}
            <div className="flex items-center" >
                {/* <div className={`gift-icon me-2 voilet`} dangerouslySetInnerHTML={{ __html: piggy }} /> */}
                <h2 className="text-xl font-bold text-dark-500" >{title ? title: "Say Something"}</h2>
            </div>

            <div className="mt-1 ">
                <input onChange={handleInput} defaultValue={item?.title || ''} name="title" placeholder="Post Title ..."
                className="text-normal border-gray-300 border px-3 py-3 text-lg text-gray-900 rounded-[15px] md:rounded-[20px]  mt-4 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"/>
                <textarea onChange={handleInput} defaultValue={item?.content || ''}  name="content" placeholder="Say Something..." className="text-lg border-gray-300 border h-[150px] mt-4 w-full rounded-[15px] md:rounded-[20px]  px-3 py-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500" ></textarea>
                <div className="chhoseimage mt-4 pt-2" >
                    <p className="text-grey-400 mb-2" >Choose a image file to attached with your post.</p>
                    {item && item.image_url ?
                        <>
                            <div className="default-wish-img border relative mb-1 ">
                                <img src={item && item.image_url}
                                className="max-w-full h-auto" />
                            </div>
                            <h2 className="w-full my-2 text-center" >Or</h2>
                        </>
                    : ''}
                    {isAiImage ?
                        <div className="default-wish-img border relative mb-2 ">
                            <img src={isAiImage}
                            className="max-w-full h-auto" />
                        </div>
                    : ""}

                    <div className="relative">
                        <GlobalUploader 
                        ctxName='add-post-context' 
                        ref={uploaderRef} view={false} 
                        type="minimal"  imgonly={true}
                        accept="image/*"
                        sendFile={getfile} options={st.post} />
                        <div className="absolute top-[14px] right-12">
                            <ImageGenerationWithAI classes={`button bg-pink table text-[10px] sm:flex m-auto m-sm-0 hover:opacity-80`} update={getAIImage} />
                        </div>
                    </div>
                </div>

                <p className="text-grey-500 mb-1 mt-4" >Choose Audience</p>
                <div className="flex items-center justify-center flex-wrap" >
                    <select id="countries" defaultValue={item?.for_module} onChange={handleInput} name="for_module" className="border-gray-300 border px-4 py-2 text-md w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[15px] md:rounded-[20px]  block ">
                        <option value="membership">Memberships</option>
                        <option value="subscription">Subscription</option>
                        <option value="support">Supporters</option>
                    </select>
                </div>
            </div>


            <LoaderButton onClick={submitPost}
                disabled={loading}
                className={`${rewardImage == '' || rewardImage == null ? 'opacity-50 cursor-not-allowed' : ''}  b mt-4 w-full `}
                spinnerclass="fill-red-600">
                {isEdit ?
                    loading ? "Updating.." :"Update Post"
                :
                    loading ? "Posting.." : "Add New Post"
                }
            </LoaderButton>

        {/* </form> */}

    </Popup>
    );
}
