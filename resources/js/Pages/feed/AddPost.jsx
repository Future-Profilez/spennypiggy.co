import React, { useEffect } from "react";
import { usePage, useForm } from '@inertiajs/react';
import { useState } from "react";
import Popup from "@/Components/Popup";
import { piggy } from '@/includes/Icons';
import st from "../../../css/uploader.module.css";
import GlobalUploader from "@/uploadcare/Uploader";
import LoaderButton from "@/Components/LoaderButton";


export default function AddPost(props) {

    const { global_currency, auth } = usePage().props;
    const [ close, setClose ] = useState();
    const [ clear, setClear ] = useState();

    const [rewardImage, setRewardImage] = useState('');
    const getfile = async (data) => {
        setRewardImage(data?.uuid);
    };

    const [data, setData] = useState({
        type: "",
        title: "",
        content:""
    });

    const handleInput = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
        console.log("data",data)
    }
    
    const submitPost = (e) => { 
        e.preventDefault();
        axios.post("")
        console.log("data", {...data, image:rewardImage, for_module:rewardImage ? 'imagepost' : "blogpost"});
    }

    return (
    <Popup modalclass='full' space="4" size='md' action={true} classes={`text-start `} text={`Add Post`} >
        <form onSubmit={submitPost} >
            <div className="flex align-items-center" >
                <div className={`gift-icon me-2 voilet`} 
                dangerouslySetInnerHTML={{ __html: piggy }} />  
                <h2 className="text-xl font-bold text-dark-500" >Add Post</h2>
            </div>

            <textarea onChange={handleInput}  name="content" placeholder="Say Something..." className="text-xl border-0 p-0 text-dark mt-4 text-post-content form-control" ></textarea>   
            

            <input onChange={handleInput}  name="title" placeholder="Enter Title ..."
             className="text-xl border-0 border-bottom ps-0 py-3 text-dark rounded-0 mt-4 text-post-content form-control"/>   


            <div className="chhoseimage mt-4" >
                <p className="font-bold text-lg text-dark-500 mb-1" >Choose Media</p>
                <p className="text-grey-500 mb-3" >Choose a image file to attached with your post.</p>
                <GlobalUploader  view={true} type="minimal" clear={clear} sendFile={getfile} options={st.post} />
            </div>



            <div className="flex mt-4 align-center justify-content-between" >
            
            <select id="countries" onChange={handleInput} name="type" class="bg-gray-50 border-0 text-gray-900 
            text-lg rounded-md focus:ring-green-50 block ">
                {/* <option value="everyone">Everyone</option> */}
                <option value="membership">Memberships</option>
                <option value="subscription">Subscription</option>
                <option value="support">Supporters</option>
            </select>

            <LoaderButton 
                // disabled={processing}
                type="submit"
                className="flex btn-pink sm me-2 "
                spinnerClassName="fill-red-600">
                    Post
            </LoaderButton>
            </div>
        </form>
    </Popup>
    );
}
