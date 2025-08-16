import { useRef, useState } from "react";
import userdefaultphoto from '../../../assets/siteicon.png';
import coverimage from '../../../assets/img/wishlistbannerimg.jpg';
import editicon from '../../../assets/img/editicon.png';
import Popup from '@/Components/Popup';
import { useForm } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import UpdateAvatar from './UpdateAvatar';
import LoaderButton from '@/Components/LoaderButton';
import html2canvas from 'html2canvas';
import { useEffect } from 'react';
import spennypiggy from "../../../assets/img/logo.png";
import socialbg from "../../../assets/social-bg.png";


export default function EditProfile({ user, text, classes, updateProfileSteps }) {

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

    const generateCardAndUpload = async (avataruid) => {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.zIndex = '-1';
        document.body.appendChild(container);
        container.innerHTML = `
            <div id="card-to-capture"  class="dot-pattern relative my-[300px] flex items-center  p-6 w-[600px] h-[337.5px]  text-white shadow-2xl  ">
                    <img src="${socialbg}" alt="Profile" class="w-full h-full object-cover absolute top-0 left-0 z-[-1]" />

                    <div class="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.2)_3px,transparent_3px)] bg-[size:30px_30px]"></div>
                    <div class="absolute top-18 left-6 text-yellow-300 text-4xl">✨</div>
                    <div class="absolute bottom-4 right-28 text-cyan-300 text-2xl">⭐</div>
                    <div class="absolute top-18 right-20 text-cyan-300 text-3xl">💰</div>

                    <div class="inner-image w-full">
                        <div class="flex items-center justify-center  mb-4">
                            <div class="w-28 h-28 rounded-full border-4 border-[#00ff5e] overflow-hidden shadow-lg">
                                <img src="https://ucarecdn.com/${avataruid}/-/crop/1:1/-/preview/" alt="Profile" class="w-full h-full object-cover" />
                            </div>
                            <div class="ps-3">
                                <h1 class="image-name max-w-[200px] mt-[-20px] pb-2 uppercase font-fre text-3xl text-start  ">
                                    ${user?.name}
                                </h1>
                            </div>
                        </div>

                        <p class="  text-white text-xl font-bold me-3 absolute top-[180px] left-[210px] max-w-[100px] object-cover">is now on </p>
                        <img src="${spennypiggy}" alt="Profile" class="me-3 absolute top-[190px] left-[310px] max-w-[100px] object-cover" />

                        <div class="  bg-gradient-to-r mt-[100px] from-[#9b0039] to-[#9b0039b6] link-shadow text-white
                            px-4 leading-[15px] h-[40px] rounded-[15px] text-center text-[20px] shadow-md">https://spennypiggy.co/${user?.username}
                        </div>
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
        scale: 2,
        allowTaint: false,
        });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png',1.0));
        console.log("blob",blob)
        if (!blob) {
            console.log('❌ Failed to convert card to image');
            return;
        }
        setTimeout(() => {
            setSocialFile(new File([blob],  `${user?.username}-social_avatar`, { type: blob.type }))
            setData('social_image', new File([blob], `${user?.username}-social_avatar`, { type: blob.type }));
        },500);


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
    const [UploadingStart, setUploadingStart] = useState(false);
    const [CoverUploadingStart, setCoverUploadingStart] = useState(false);
    const [localAvatar, setLocalAvatar] = useState('');

    useEffect(() => {
        if(localAvatar){
            setData('avatar', localAvatar);
            generateCardAndUpload(localAvatar?.uuid);
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
    const updateProfile = async (e) => {
        e.preventDefault();
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
        if(user && user.avatar && !user?.social_image){
            await generateCardAndUpload(user.avatar);
        }
    }

    return (
        <Popup modalclassName='pinkmodal editprofile full' size='md' action={close}
            text={text||<> Update Profile </>}
            classes={`${classes ? classes : "button bg-pink d-table d-sm-flex m-auto m-sm-0"}`} >
            <div className='editForm  mt-4'>
                        {UploadingStart ? <div className='p-4 '>
                            <div className='flex items-center justify-between mb-3'>
                                <h2 className='pb-0 font-gulfs uppercase text-xl'>Update Avatar</h2>
                                <button onClick={()=>setUploadingStart(false)} className='me-4  bg-gray-200 px-4 py-1 rounded-lg'>Exit</button>
                            </div>
                           {user?.role == 1 && <p className=' text-yellow-600'>Your Profile picture must match the person in the ID verification which is the next step, if it doesn’t your account will be blocked and the user banned.</p>}
                            <UpdateAvatar type="avatar" getImageUID={getImageUID} text={<> <button className='editbtn'><img src={editicon} alt="img" /></button></>} />
                        </div> : ''}

                        {CoverUploadingStart ? <div className=''>
                            <div className='flex items-center justify-between'>
                                <h2 className='p-4 pb-0 font-gulfs uppercase text-xl'>Update Cover</h2>
                                <button onClick={()=>setCoverUploadingStart(false)} className='me-4 mt-4 bg-gray-200 px-4 py-1 rounded-lg'>Exit</button>
                            </div>
                            
                             <UpdateAvatar type="cover" getImageUID={getCoverUID}
                                        text={<> <button className='editbtn'> <img src={editicon} alt="img" /> </button> </>} />
                        </div> : ''}

                        {UploadingStart || CoverUploadingStart ? ''
                            :
                            <>
                                <div className='mainprofile mb-5 position-relative w-100 '>
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
                            </>
                        }
            </div>
        </Popup>
    )
}
