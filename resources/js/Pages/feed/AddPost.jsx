import React, { useEffect } from "react";
import { useState } from "react";
import Popup from "@/Components/Popup";
import { piggy } from '@/includes/Icons';
import st from "../../../css/uploader.module.css";
import GlobalUploader from "@/uploadcare/Uploader";
import LoaderButton from "@/Components/LoaderButton";
import axios from "axios";
import { toast } from 'react-hot-toast';
import AdultScan from "@/includes/AdultScan";
import { useAlerts } from "@/Components/Alerts";

export default function AddPost({item, text, classes, isEdit, updateState}) {

    const [ close, setClose ] = useState();
    const [ clear, setClear ] = useState();
    const { errorsHandling } = useAlerts();
    const [filetype, setfiletype] =  useState('image');
    const [rewardImage, setRewardImage] = useState(item?.image || '');
    const getfile = async (data) => {
        setRewardImage(data?.uuid);
        setfiletype(data && data.contentInfo && data.contentInfo.mime && data.contentInfo.mime.type)
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
        setLoading(true);
        e && e.preventDefault();
        axios.post(`${isEdit ? `/post/edit/${item.uuid}` : "/post/save"}`, {...data, image:rewardImage, type: rewardImage ? 'image' : "blog" })
        .then((resp) => {
            if(resp.data.status){
                setRewardImage();
                setData({
                    for_module: "membership",
                    title: "",
                    content:""
                });
                updateState && updateState(new Date());
                toast.success(resp.data.msg);
                setClose(false);
                setTimeout(()=>{
                    setClose();
                },100);
                setClear(new Date());
            } else {
                toast.error(resp.data.msg);
            }
            setLoading(false);
        }).catch((_err) => {
            setLoading(false);
            errorsHandling(_err);
        });
    }

 
    

    return (
    <Popup modalclass='' space="4" size='md' action={close} classes={`${classes} dropdown-item text-start p-0 `} text={text ? text : `Add Post`} >
        {/* <form onSubmit={submitPost} > */}
            <div className="flex align-items-center" >
                <div className={`gift-icon me-2 voilet`} 
                dangerouslySetInnerHTML={{ __html: piggy }} />  
                <h2 className="text-xl font-bold text-dark-500" >Add Post</h2>
            </div>
            
            <input onChange={handleInput} defaultValue={item?.title || ''} name="title" placeholder="Enter Title ..."
             className="text-normal form-input border px-3 py-3 text-dark rounded-4 mt-4 text-post-content form-control"/>   
            <textarea onChange={handleInput} defaultValue={item?.content || ''}  name="content" placeholder="Say Something..." className="text-lg border form-input h-[150px] mt-4 text-post-content form-control" ></textarea>   
            <div className="chhoseimage mt-4" >
                <p className="font-bold text-lg text-dark-500 mb-1" >Choose Media</p>
                <p className="text-grey-500 mb-3" >Choose a image file to attached with your post.</p>

                {item && item.image_url ? 
                <>
                    <div className="default-wish-img border relative mb-1 ">
                        <img src={item && item.image_url}
                        className="img-fluid" />
                    </div>
                    <h2 className="w-100 my-2 text-center" >Or</h2>
                </>
                : ''}

                <GlobalUploader  view={false} type="minimal" clear={clear} sendFile={getfile} options={st.post} />
            </div>

           { rewardImage ? <>
                <p className="text-grey-500 mb-1 mt-4" >Choose Audience</p>
                <div className="flex align-center justify-content-center flex-wrap" >
                    <select id="countries" defaultValue={item?.for_module} onChange={handleInput} name="for_module" class="form-input  
                    text-md w-full focus:ring-green-50 block ">
                        {/* <option value="everyone">Everyone</option> */}
                        <option value="membership">Memberships</option>
                        <option value="subscription">Subscription</option>
                        <option value="support">Supporters</option>
                    </select>
                </div>
           </> :'' 
            }

            <AdultScan type={filetype} 
                fileuid={rewardImage}
                onScan={submitPost} 
                content={<>
                     <LoaderButton 
                        disabled={loading}
                        className="flex btn-pink sm mt-4 w-full "
                        spinnerClassName="fill-red-600">
                        {isEdit ? 
                          loading ? "Updating.." :"Update Post" 
                        : 
                          loading ? "Posting.." : "Add New Post" 
                        }
                    </LoaderButton>
                </>} 
            />

        {/* </form> */}
        
    </Popup>
    );
}
