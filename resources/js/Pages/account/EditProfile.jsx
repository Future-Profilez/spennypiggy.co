import React, { useRef, useState } from 'react'
import userdefaultphoto from '../../../assets/siteicon.png';
import coverimage from '../../../assets/img/wishlistbannerimg.jpg';
import editicon from '../../../assets/img/editicon.png';
import Popup from '@/Components/Popup';
import { useForm } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import UpdateAvatar from './UpdateAvatar';
import LoaderButton from '@/Components/LoaderButton';
import PriceFormat from '@/includes/PriceFormat';
import html2canvas from 'html2canvas';
import { useEffect } from 'react';

export default function EditProfile({ user, text, classes, updateProfileSteps }) {
 
    const [close, setClose] = useState()
    const { successAlert, errorAlert } = useAlerts();
    const [profileDP, setProfileDP] = useState();
    const [coverImage, setCoverImage] = useState();

    const [socialFile, setSocialFile] = useState();
    console.log("socialFile",socialFile);

    useEffect(() => {
        if (socialFile) {
            setData('social_image', socialFile);
        }
    },[socialFile]);

     const { data, setData, post, processing, errors, reset } = useForm({
        name: user?.name || '',
        username: user?.username || '',
        bio: user?.bio || '',
        avatar: '',
        cover: '',
        min_surprise_amount: user?.min_surprise_amount || '',
        social_image: socialFile || null,
    });

    const generateCardAndUpload = async (avataruid) => {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.zIndex = '-1';
        document.body.appendChild(container);

        const nameuper = data?.name ? data?.name.toUpperCase() : user?.name.toUpperCase();
        console.log("avataruid",avataruid)
        container.innerHTML = `
                    <div id="card-to-capture" style="
                    width: 600px;
                    height: 337.5px;
                    background: linear-gradient(135deg, #6f42c1, #1e90ff);
                    color: white;
                    font-family: sans-serif;
                    border-radius: 16px;
                    padding: 30px 50px;
                    display: flex;
                    align-items: center;
                    gap: 20px;">
                    <img  crossOrigin="anonymous" src="https://ucarecdn.com/${avataruid}/-/crop/face/1:1/-/preview/" style="
                        width: 130px;
                        height: 130px;
                        border-radius: 12px;
                        object-fit: cover;
                        border: 2px solid white;">
                    <div>
                        <h3 style="margin: 0; margin-top:-3px;font-size: 30px;font-family: cursive;">${nameuper}</h3>
                        <p style="margin: 0px 0;font-family: cursive;font-size: 22px;">is now on <b style="font-weight: 800;">🎁 SpennyPiggy</b></p> 
                        <p style="font-size: 19px;font-family: system-ui;margin-top: 20px;">https://spennypiggy.co/${data?.username || user?.username}</p>
                    </div>
                    </div>
        `;

        const card = container.querySelector('#card-to-capture');
        const img = card.querySelector('img');
        await new Promise((resolve, reject) => {
            if (img.complete) return resolve(); // already loaded
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image failed to load'));
        });
        // 4. Convert to canvas
        const canvas = await html2canvas(card, {
        useCORS: true,
        allowTaint: false,
        });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        console.log("blob",blob)
        if (!blob) {
            console.log('❌ Failed to convert card to image');
            return;
        }
        setTimeout(() => {
            setSocialFile(new File([blob],  `${user?.username}-social_avatar`, { type: blob.type }))
            setData('social_image', new File([blob], `${user?.username}-social_avatar`, { type: blob.type }));
        },500);
        return true;
        // 6. Download to user device
        // const localUrl = URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = localUrl;
        // a.download = `card.png`;
        // a.click();
        // URL.revokeObjectURL(localUrl);

        // // 7. Cleanup
        // document.body.removeChild(container);
    };
    
    const getImageUID = (e) => {
        setData('avatar', e);
        setProfileDP(e.cdnUrl);
        if(e){
            generateCardAndUpload(e?.uuid);
        }
    }

    const getCoverUID = (e) => {
        setCoverImage(e.cdnUrl);
        setData('cover', e);
    }

    const [username, setUsername] = useState(user?.username);

   
    console.log("data",data)

    const updateProfile = async (e) => {
        e.preventDefault();
        
         
        post(route('edit-profile', {data}), {
            preserveScroll: true,
            onSuccess: (resp) => {
                setClose(false);
                setTimeout(() => {
                    setClose();
                }, 1000);
                if(resp.props.flash?.success){
                    successAlert(resp.props.flash?.success || "Updated successfully.");
                    updateProfileSteps && updateProfileSteps();
                }
                if(resp.props.flash?.error){
                    errorAlert(resp.props.flash?.error || "Something went wrong.")
                }
            },
            onError: (_err) => {
                console.table("profile update error", _err);
                if(_err.username){
                    errorAlert(_err.username || "Something went wrong in username.")
                }
                if(_err.bio){
                    errorAlert(_err.bio || "Something went wrong in bio.")
                }
                if(_err.name){
                    errorAlert(_err.name || "Something went wrong in your display name.")
                }
            }
        });
    };

    const defaultCurrency = user.default_currency;


    const IsProfileChannged = async() => {
        if(user && user.avatar && !user?.social_image){
            await generateCardAndUpload(user.avatar);
        }
    }
    return (
        <Popup modalclass='pinkmodal editprofile full' size='md' action={close}
            text={text||<> Update Profile </>}
            classes={`${classes ? classes : "button bg-pink d-table d-sm-flex m-auto m-sm-0"}`} >
            <div className='editForm  mt-4'>
                <div className='mainprofile mb-5 position-relative w-100 '>
                    <div className='profilePhotoImg cover'>
                        <img src={coverImage ? coverImage : (user?.cover_url || coverimage)} alt='img' />
                        <UpdateAvatar type="cover" getImageUID={getCoverUID}
                        text={<> <button className='editbtn'> <img src={editicon} alt="img" /> </button> </>} />
                    </div>
                    <div className='profilePhotoImg dp'>
                        <img src={ profileDP ? profileDP : (user?.avatar_url || userdefaultphoto)} alt='img' />
                        <UpdateAvatar type="avatar" getImageUID={getImageUID} text={<> <button className='editbtn'><img src={editicon} alt="img" /></button></>} />
                    </div>
                </div>
                <form onSubmit={updateProfile} >
                    <ul>
                        <li className="mb-3">
                            <label className="mb-1">Display Name</label>
                            <input onBlur={IsProfileChannged} type="text" name="name" defaultValue={user?.name || ''}
                                onChange={(e) => setData('name', e.target.value)}
                                className="form-input px-2 py-2 border w-full rounded-md" />
                        </li>
                        <li className="mb-2">
                            <label className="mb-1">Username</label>
                            <input onBlur={IsProfileChannged} defaultValue={user?.username || ''} onChange={(e) => setData("username", e.target.value)}
                                type="text" name="username" className="form-input px-2 py-2 border w-full rounded-md" placeholder='Spennypiggy.co/warner99' onKeyUp={(e) => {setUsername(e.target.value)}}/>
                        </li>

                        <li><strong className='d-block text-start mb-4' >Profile URL : {window.location.href}</strong></li>

                        <li className="mb-3">
                            <label className="mb-1">Bio</label>
                            <textarea onBlur={IsProfileChannged} defaultValue={user?.bio || ''}
                                onChange={(e) => setData("bio", e.target.value)}
                                name="bio" className="form-input px-2 py-2 border w-full rounded-md"
                                placeholder='Bio' />
                        </li>

                        {/* <li className="mb-3">
                            <label className="mb-1">Minimum surprise gift amount</label>
                            <div className='currency-wrapper position-relative' >
                                <span className="currency-tag">{defaultCurrency || 'GBP'}</span>
                                <input type="text" name="name" defaultValue={user?.min_surprise_amount || ''}
                                onChange={(e) => setData('min_surprise_amount', e.target.value)}
                                className="form-input px-2 py-2 border w-full rounded-md" />
                            </div>
                            <p className="mt-1">
                                The Minimum amount is set
                                to {formatMultiPrice(user?.min_surprise_amount || 0,  defaultCurrency )}.
                            </p>
                        </li> */}

                    </ul>

                    <div className=" text-center mb-7">
                        <LoaderButton type='submit' disabled={processing} className='btn-pink sm m-auto'
                         spinnerClassName='fill-red-600'>
                            {processing ? "Updating" : "Update"}
                        </LoaderButton>
                    </div>
                </form>
            </div>
        </Popup>
    )
}
