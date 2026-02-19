import { useRef, useState } from "react";
import userdefaultphoto from '../../../assets/siteicon.png';
import coverimage from '../../../assets/img/wishlistbannerimg.jpg';
import editicon from '../../../assets/img/editicon.png';
import Popup from '@/Components/Popup';
import { useForm, usePage } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import UpdateAvatar from './UpdateAvatar';
import LoaderButton from '@/Components/LoaderButton';
import { useEffect } from 'react';
import spennypiggy from "../../../assets/img/logo.png";
import socialbg from "../../../assets/social-bg.png";


export default function EditProfile({ user, text, classes, updateProfileSteps }) {

    // utils/checkName.js
    function hasFullName(name) {
        if (!name || typeof name !== "string") return false;
        const parts = name.trim().split(/\s+/);
        return parts.length > 1;
    }

    // SSR Guard for usePage().props
    const pageProps = usePage().props;
    const auth = pageProps.auth;
    
    // SSR Guard for window usage
    const isSSR = typeof window === 'undefined';
    
    const [close, setClose] = useState()
    const { successAlert, errorAlert } = useAlerts();
    const [profileDP, setProfileDP] = useState();
    const [coverImage, setCoverImage] = useState();
    const [socialFile, setSocialFile] = useState();

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
    const [loading, setLoading] = useState(processing);


    const generateCardAndUpload = async (avataruid) => {
        setLoading(true);
        const container = document.createElement('div');
        container.style.position = 'absolute';
        // container.style.left = '-9999px';
        // container.style.top = '0';
        // container.style.zIndex = '-1';
        document.body.appendChild(container);
        container.innerHTML = `
            <div 
                id="card-to-capture"
                style=" position:relative;margin:300px 0;display:flex;align-items:center;padding:24px;width:600px;height:337.5px;color:white;box-shadow:0 25px 50px rgba(0,0,0,0.5);overflow:hidden;"
                >
                <img 
                    src="${socialbg}" 
                    alt="Background"
                    crossorigin="anonymous"
                    style=" width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:-1;"
                />

                <div
                    style=" position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.2) 3px,transparent 3px);background-size:30px 30px;"
                ></div>

                <div style="position:absolute; top:72px; left:24px; color:#fde047; font-size:36px;">✨</div>
                <div style="position:absolute; bottom:16px; right:112px; color:#22d3ee; font-size:24px;">⭐</div>
                <div style="position:absolute; top:72px; right:80px; color:#22d3ee; font-size:30px;">💰</div>

                <div style="width:100%; position:relative; z-index:2;">

                    <div style="display:flex; align-items:center; justify-content:center; margin-bottom:16px;">

                    <div
                        style=" width:112px;height:112px;border-radius:50%;border:2px solid #00ff5e;overflow:hidden;box-shadow:0 10px 20px rgba(0,0,0,0.5);" >
                        <img
                        src="https://ucarecdn.com/${avataruid}/-/crop/1:1/-/preview/"
                        alt="Profile"
                        crossorigin="anonymous"
                        style=" width:100%;height:100%;object-fit:cover;" />
                    </div>

                    <div style="padding-left:12px;">
                        <h1
                        style=" max-width:200px;margin-top:-20px;padding-bottom:8px;text-transform:uppercase;font-size:30px;text-align:left;word-break:${!hasFullName(user?.name) ? 'break-all':'break-word'} ; line-height:30px;   font-family: 'gulfs' ; letter-spacing: 1px; text-shadow:0.5px 0.5px #000000 !important; " >
                        ${user?.name}
                        </h1>
                    </div>
                    </div>

                    <p
                        style=" position:absolute;top:180px;left:210px;font-size:20px;font-weight:bold;max-width:100px;" >
                        is now on
                    </p>
                    <img
                        src="${spennypiggy}"
                        alt="Logo"
                        crossorigin="anonymous"
                        style=" position:absolute;top:190px;left:310px;max-width:100px;object-fit:cover;"
                    />  
                    <div style="margin-top:100px;padding:0 16px;height:50px;line-height:50px;border-radius:40px;text-align:center;font-size:22px;color:white;box-shadow:0 8px 20px rgba(0,0,0,0.4);" ><div style="height:50px; position relative; top:-30px; padding-bottom:16px; display:block;">https://spennypiggy.co/${user?.username}</div></div>
                </div>
                </div>

        `;
        // background:linear-gradient(to right,#9b0039,#9b0039b6);

        const card = container.querySelector('#card-to-capture');
        const images = card.querySelectorAll('img');
        
        await Promise.all(Array.from(images).map(img => {
            return new Promise((resolve, reject) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = () => resolve();
                    img.onerror = () => {
                        console.warn('Image failed to load:', img.src);
                        resolve(); // Continue even if image fails
                    };
                }
            });
        }));
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(card, {
        useCORS: true,
        scale: 2,
        allowTaint: false,
        });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png',1.0));
        if (!blob) {
            console.log('❌ Failed to convert card to image');
            return;
        }
        setTimeout(() => {
            setSocialFile(new File([blob],  `${user?.username}-social_avatar`, { type: blob.type }))
            setData('social_image', new File([blob], `${user?.username}-social_avatar`, { type: blob.type }));
            // Update the preview with the newly generated banner
            const bannerUrl = URL.createObjectURL(blob);
            setCurrentSocialBanner(bannerUrl);
        },500);

        // 7. Cleanup
        setTimeout(() => {
            if (container && container.parentNode) {
                document.body.removeChild(container);
            }
        }, 1000);
    };
    const [UploadingStart, setUploadingStart] = useState(false);
    const [CoverUploadingStart, setCoverUploadingStart] = useState(false);
    const [localAvatar, setLocalAvatar] = useState('');
    const [generatingBanner, setGeneratingBanner] = useState(false);
    const [currentSocialBanner, setCurrentSocialBanner] = useState(auth?.user?.social_url || null);

    useEffect(() => {
        if(localAvatar){
            setData('avatar', localAvatar);
        }
    },[localAvatar]);

    
    const getImageUID = (e) => {
        setData('avatar', e);
        setLocalAvatar(e);
        setProfileDP(e.cdnUrl);
        setUploadingStart(false);
    }

    const getCoverUID = (e) => {
        setCoverImage(e.cdnUrl);
        setData('cover', e);
        setCoverUploadingStart(false)
    }

    const [username, setUsername] = useState(user?.username);


    const generateSocialImage = async () => {
        const avatarToUse = localAvatar || user?.avatar;
        if (avatarToUse) {
            setGeneratingBanner(true);
            try {
                await generateCardAndUpload(avatarToUse);
            } catch (error) {
                console.error('Error generating banner:', error);
                alert('Failed to generate banner. Please try again.');
            }
            setGeneratingBanner(false);
            return 
        } else {
            alert('Please upload an avatar first to generate a promotional banner.');
            return 
        }
    }


    const updateProfile = async (e) => {
        await generateSocialImage();
        e.preventDefault();
        // auth?.user?.role == 1 && await generateCardAndUpload(localAvatar || user?.avatar);
        post(route('edit-profile', {...data}), {
            preserveScroll: true,
            onSuccess: (resp) => {
                setClose(false);
                setTimeout(() => {
                    setClose();
                }, 1000);
                if(resp.props.flash?.success){
                    updateProfileSteps && updateProfileSteps();
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
    
    const IsProfileChannged = async() => {
        // Removed automatic banner generation - users can generate banners manually
    }


   
    return (
        <Popup modalclass='pinkmodal editprofile full' size='md' action={close}
            text={text||<> Update Profile </>}
            classes={`${classes ? classes : "button bg-pink block sm:flex m-auto sm:m-0"}`} >
            <div className='editForm  mt-4'>
                        {UploadingStart ? <div className='p-4 '>
                            <div className='flex items-center justify-between mb-3'>
                                <h2 className='pb-0 font-gulfs uppercase text-xl'>Update Avatar</h2>
                                <button onClick={()=>setUploadingStart(false)} className='mr-4  bg-gray-200 px-4 py-1 rounded-[30px] md:rounded-[40px]  '>Exit</button>
                            </div>
                           {user?.role == 1 && <p className=' text-yellow-600'>Your Profile picture must match the person in the ID verification which is the next step, if it doesn’t your account will be blocked and the user banned.</p>}
                            <UpdateAvatar type="avatar" getImageUID={getImageUID} text={<> <button className='editbtn'><img src={editicon} alt="img" /></button></>} />
                        </div> : ''}

                        {CoverUploadingStart ? <div className=''>
                            <div className='flex items-center justify-between'>
                                <h2 className='p-4 pb-0 font-gulfs uppercase text-xl'>Update Cover</h2>
                                <button onClick={()=>setCoverUploadingStart(false)} className='mr-4 mt-4 bg-gray-200 px-4 py-1 rounded-[30px] md:rounded-[40px]  '>Exit</button>
                            </div>
                            
                             <UpdateAvatar type="cover" getImageUID={getCoverUID}
                                        text={<> <button className='editbtn'> <img src={editicon} alt="img" /> </button> </>} />
                        </div> : ''}




                        


                        {UploadingStart || CoverUploadingStart ? ''
                            :
                            <>
                                <div className='mainprofile mb-5 relative w-full '>
                                    <div className='profilePhotoImg cover'>
                                        <img src={coverImage ? coverImage : (user?.cover_url || coverimage)} alt='img' />
                                        <button onClick={()=>setCoverUploadingStart(true)} className='editbtn'><img src={editicon} alt="img" /></button>
                             
                                        
                                    </div>
                                    <div className='profilePhotoImg dp'>
                                        <img src={ profileDP ? profileDP : (user?.avatar_url || userdefaultphoto)} alt='img' />
                                        <button onClick={()=>setUploadingStart(true)} className='editbtn'><img src={editicon} alt="img" /></button>
                                    </div>
                                </div>
                                <form onSubmit={updateProfile} >
                                    <ul>
                                        <li className="mb-3">
                                            <label className="mb-1">Display Name</label>
                                            <input onBlur={IsProfileChannged} type="text" name="name" defaultValue={user?.name || ''}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] md:rounded-[40px] " />
                                        </li>
                                        <li className="mb-2">
                                            <label className="mb-1">Username</label>
                                            <input onBlur={IsProfileChannged} defaultValue={user?.username || ''} onChange={(e) => setData("username", e.target.value)}
                                                type="text" name="username" className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] md:rounded-[40px] " placeholder='Spennypiggy.co/warner99' onKeyUp={(e) => {setUsername(e.target.value)}}/>
                                        </li>

                                        <li>
                                            <strong className='block text-left mb-4' >
                                                Profile URL :  &nbsp;
                                                {typeof window !== 'undefined' ? `https://spennypiggy.co/${username}` : ''}
                                            </strong>
                                        </li>         

                                        <li className="mb-3">
                                            <label className="mb-1">Bio</label>
                                            <textarea onBlur={IsProfileChannged} defaultValue={user?.bio || ''}
                                                onChange={(e) => setData("bio", e.target.value)}
                                                name="bio" className="border-gray-300 border p-4 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[20px] "
                                                placeholder='Bio' />
                                        </li>

                                        {/* <li className="mb-3">
                                            <label className="mb-1">Minimum surprise gift amount</label>
                                            <div className='currency-wrapper relative' >
                                                <span className="currency-tag">{defaultCurrency || 'GBP'}</span>
                                                <input type="text" name="name" defaultValue={user?.min_surprise_amount || ''}
                                                onChange={(e) => setData('min_surprise_amount', e.target.value)}
                                                className="w-full border-gray-300 border px-4 py-2 rounded-[30px] md:rounded-[40px]  focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500" />
                                            </div>
                                            <p className="mt-1">
                                                The Minimum amount is set
                                                to {formatMultiPrice(user?.min_surprise_amount || 0,  defaultCurrency )}.
                                            </p>
                                        </li> */}

                                    </ul>
                                {auth?.user?.role == 1 ? 
                                    <div className="  text-center mb-4">
                                        <div className="mb-2">
                                            <p className="text-sm text-gray-600 mb-2">
                                                Generate a promotional banner to share your profile on social media platforms like Twitter, Facebook, and Instagram.
                                            </p>
                                        </div>
                                        
                                        {currentSocialBanner && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Your Social Media Banner:</h4>
                                                <div className="border-2 border-gray-200 rounded-[30px] md:rounded-[40px]  p-0 bg-gray-50">
                                                    <img 
                                                        src={currentSocialBanner || auth?.user?.social_url} 
                                                        alt="Social Media Banner" className="w-full max-w-md mx-auto rounded-[30px] md:rounded-[40px]  shadow-sm"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">Right-click and save to download your banner</p>
                                            </div>
                                         )} 
                                       
                                        <button  type="button" onClick={generateSocialImage}
                                            disabled={generatingBanner || (!localAvatar && !user?.avatar)}
                                            className="btn bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-[30px] md:rounded-[40px]  mb-3 disabled:opacity-50" >
                                            {generatingBanner ? 'Generating Banner...' : (currentSocialBanner ? 'Regenerate Social Media Banner' : 'Generate Social Media Banner')}
                                        </button> 
                                    </div>
                                    : ''}

                                    <div className=" text-center mb-7">
                                        <LoaderButton type='submit' disabled={processing} className='p '
                                        spinnerclass='fill-red-600'>
                                            {loading || processing ? "Updating" : "Update"}
                                        </LoaderButton>
                                    </div>
                                </form>
                            </>
                        }
            </div>
        </Popup>
    )
}
