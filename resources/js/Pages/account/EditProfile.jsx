import { useRef, useState, useEffect } from "react";
import userdefaultphoto from '../../../assets/siteicon.png';
import coverimage from '../../../assets/img/wishlistbannerimg.jpg';
import editicon from '../../../assets/img/editicon.png';
import Popup from '@/Components/Popup';
import { useForm, usePage } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import UpdateAvatar from './UpdateAvatar';
import LoaderButton from '@/Components/LoaderButton';
import spennypiggy from "../../../assets/img/logo.png";
import socialbg from "../../../assets/social-bg.png";
import axios from 'axios';
import { Switch } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import ManagePasskey from '@/Components/ManagePasskey';

export default function EditProfile({ profilepage, user, text, classes, updateProfileSteps, global_currency }) {
    
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
    const [activeTab, setActiveTab] = useState('profile'); // profile, appearance, settings
    
    useEffect(() => {
        if (socialFile) {
            setData('social_image', socialFile);
        }
    },[socialFile]);

    const { data, setData, post, processing, errors } = useForm({
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user?.bio || '',
        avatar: null,
        cover: null,
        gender: user?.gender || 'He/Him',
        creator_category: user?.creator_category ? (typeof user.creator_category === 'string' ? JSON.parse(user.creator_category) : user.creator_category) : [],
        country: user?.country || '',
        social_image: null,
        min_surprise_amount: user?.min_surprise_amount || 5,
        social_handle: user?.social_handle || '',
        profilepage: profilepage || false,
    });

    const [loading, setLoading] = useState(processing);
    const generateCardAndUpload = async (avataruid, load) => {
        // if(load == true){
        //     setLoading(true);
        // }
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
                        style=" max-width:200px;margin-top:-20px;padding-bottom:8px;text-transform:uppercase;font-size:30px;text-align:left;word-break:${!hasFullName(data?.name || user?.name) ? 'break-all':'break-word'} ; line-height:30px;   font-family: 'gulfs' ; letter-spacing: 1px; text-shadow:0.5px 0.5px #000000 !important; " >
                        ${data?.name || user?.name}
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
                    <div style="margin-top:100px;padding:0 16px;height:50px;line-height:50px;border-radius:40px;text-align:center;font-size:22px;color:white;box-shadow:0 8px 20px rgba(0,0,0,0.4);" ><div style="height:50px; position relative; top:-30px; padding-bottom:16px; display:block;">https://spennypiggy.co/${data?.username || user?.username}</div></div>
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
        
        setSocialFile(new File([blob],  `${user?.username}-social_avatar`, { type: blob.type }))
        setData('social_image', new File([blob], `${user?.username}-social_avatar`, { type: blob.type }));
        // Update the preview with the newly generated banner
        const bannerUrl = URL.createObjectURL(blob);
        setCurrentSocialBanner(bannerUrl);

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

    // Toggles State
    const [piggyBankEnabled, setPiggyBankEnabled] = useState(user?.show_piggy_bank === 1);
    const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notification_send === 1);

    const getImageUID = (e) => {
        setData('avatar', e);
        setLocalAvatar(e?.uuid || '');
        setProfileDP(e.cdnUrl);
        setUploadingStart(false);
    }

    const getCoverUID = (e) => {
        setCoverImage(e.cdnUrl);
        setData('cover', e);
        setCoverUploadingStart(false)
    }

    const [username, setUsername] = useState(user?.username);
    const [profileTags, setProfileTags] = useState([]);
    useEffect(() => {
        if (user?.creator_category) {
            try {
                // Handle both array and string format from DB
                const categories = typeof user.creator_category === 'string' 
                    ? JSON.parse(user.creator_category) 
                    : user.creator_category;
                setProfileTags(Array.isArray(categories) ? categories : []);
            } catch (e) {
                console.error("Error parsing creator tags", e);
                setProfileTags([]);
            }
        }
    }, [user]);

    const handleProfileTags = (e) => {
        const value = e.target.value;
        setProfileTags(prevTags => {
            const newTags = prevTags.includes(value)
                ? prevTags.filter(tag => tag !== value)
                : [...prevTags, value];
            setData("creator_category", newTags);
            return newTags;
        });
    };

    const creatortypes = [
        { label: "Artist", value: "Artist" },
        { label: "Activist", value: "Activist" },
        { label: "DJ", value: "DJ" },
        { label: "Beauty Creator", value: "Beauty Creator" },
        { label: "Dancer", value: "Dancer" },
        { label: "Developer", value: "Developer" },
        { label: "Cosplay Creator", value: "Cosplay Creator" },
        { label: "Education Creator", value: "Education Creator" },
        { label: "Fashionista", value: "Fashionista" },
        { label: "Gamer", value: "Gamer" },
        { label: "Gym Bunny", value: "Gym Bunny" },
        { label: "Musician", value: "Musician" },
        { label: "Model", value: "Model" },
        { label: "Podcaster", value: "Podcaster" },
        { label: "Streamer", value: "Streamer" },
        { label: "Video Creator", value: "Video Creator" },
        { label: "Writer", value: "Writer" },
    ];

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
        e.preventDefault();
        // Only generate social image if user requested it or if logic requires it. 
        // Previously it was automatic, but that might slow down simple updates.
        // Keeping it as requested in previous logic, but maybe optional? 
        // The original code had: await generateSocialImage();
        // I will keep it but only if on appearance tab or if avatar changed? 
        // Actually, let's keep it simple and not force regeneration unless needed.
        // But the previous code forced it. I'll comment it out to make updates faster unless user clicks generate.
        setLoading(true);
        await generateSocialImage(); 
        
        post(route('edit-profile'), {
            preserveScroll: true,
            onSuccess: (resp) => {
                setClose(false);
                setTimeout(() => {
                    setClose();
                }, 1000);
                if(resp.props.flash?.success){
                    updateProfileSteps && updateProfileSteps();
                }
                setLoading(false);
            },
            onError: (_err) => {
                console.table("profile update error", _err);
                if(_err.username){
                    errorAlert(_err.username || "Something went wrong in username.")
                }
                if(_err.email){
                    errorAlert(_err.email || "Something went wrong in email.")
                }
                if(_err.bio){
                    errorAlert(_err.bio || "Something went wrong in bio.")
                }
                if(_err.name){
                    errorAlert(_err.name || "Something went wrong in your display name.")
                }
                setLoading(false);
            }
        });
    };
    
    const IsProfileChannged = async() => {
        // Removed automatic banner generation - users can generate banners manually
    }

    const togglePiggyBank = async () => {
        try {
            const resp = await axios.post(route('piggy-bank-setting'));
            if(resp.data.status) {
                setPiggyBankEnabled(!piggyBankEnabled);
                successAlert(resp.data.message);
            }
        } catch (e) {
            console.error(e);
            errorAlert("Failed to update Piggy Bank setting.");
        }
    }

    const toggleNotifications = async () => {
        try {
            const resp = await axios.post(route('notification-switch'));
            if(resp.data.status) {
                setNotificationsEnabled(!notificationsEnabled);
                successAlert(resp.data.message);
            }
        } catch (e) {
            console.error(e);
            errorAlert("Failed to update Notification setting.");
        }
    }

    const formatMultiPrice = (price, currency) => {
        // Simple formatter placeholder if not available in context
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(price);
    }

    const renderTabs = () => (
        <div className="flex ps-2 py-3 gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
            <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-6 text-sm  font-black uppercase tracking-widest border-[3px] border-black rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'profile' ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white text-black shadow-none hover:bg-yellow-100 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                }`} >Profile Info
            </button>

            <button
                onClick={() => setActiveTab('appearance')}
                className={`py-2 px-6 text-sm   font-black uppercase tracking-widest border-[3px] border-black rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'appearance'
                        ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white text-black shadow-none hover:bg-yellow-100 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                }`}
            >
                Appearance
            </button>
            <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-6 text-sm  font-black uppercase tracking-widest border-[3px] border-black rounded-xl transition-all whitespace-nowrap ${
                    activeTab === 'settings'
                        ? 'bg-yellow-300 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white text-black shadow-none hover:bg-yellow-100 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                }`}
            >
                Settings
            </button>
        </div>
    );

    return (
        <Popup modalclass='pinkmodal editprofile full' 
        size='xl' action={close} text={ text ||<> Update Profile </> } 
        classes={` ${ classes ? classes : "button bg-pink block sm:flex m-auto sm:m-0"} `} >
            <div className='editForm mt-4'>
                
                {UploadingStart ? 
                    <div className='p-4 '>
                        <div className='flex items-center justify-between mb-3'>
                            <h2 className='pb-0 font-gulfs uppercase text-xl'>Update Avatar</h2>
                            <button onClick={()=>setUploadingStart(false)} className='mr-4 bg-gray-200 px-4 py-1 rounded-[10px] md:rounded-[15px]'>Exit</button>
                        </div>
                        {user?.role == 1 && <p className=' text-yellow-600'>Your Profile picture must match the person in the ID verification which is the next step, if it doesn’t your account will be blocked and the user banned.</p>}
                        <UpdateAvatar type="avatar" getImageUID={getImageUID} text={<> <button className='editbtn'><img src={editicon} alt="img" /></button></>} />
                    </div> 
                : ''}

                {CoverUploadingStart ? 
                    <div className='py-4'>
                        <div className='flex items-center justify-between'>
                            <h2 className='py-2 pb-0 font-gulfs uppercase text-xl'>Update Cover</h2>
                            <button onClick={()=>setCoverUploadingStart(false)} className='mr-4 mt-4 bg-gray-200 px-4 py-1 rounded-[10px] md:rounded-[15px]'>Exit</button>
                        </div>
                            <UpdateAvatar type="cover" getImageUID={getCoverUID}
                                    text={<> <button className='editbtn'> <img src={editicon} alt="img" /> </button> </>} />
                    </div>   
                : ''}

                {UploadingStart || CoverUploadingStart ? '' : (
                    <>
                        {renderTabs()}

                        <form onSubmit={updateProfile}>
                            
                            <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
                                <ul>
                                    <li className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                        <input 
                                            onBlur={IsProfileChannged} 
                                            type="text" 
                                            name="name" 
                                            defaultValue={user?.name || ''}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full border-gray-300 border px-4 py-3 rounded-[15px] md:rounded-[15px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500" 
                                            placeholder="Your Name"
                                        />
                                    </li>
                                    <li className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input 
                                            onBlur={IsProfileChannged} 
                                            defaultValue={user?.username || ''} 
                                            onChange={(e) => setData("username", e.target.value)}
                                            type="text" 
                                            name="username" 
                                            className="w-full border-gray-300 border px-4 py-3 rounded-[15px] md:rounded-[15px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500" 
                                            placeholder='spennypiggy.co/username' 
                                            onKeyUp={(e) => {setUsername(e.target.value)}}
                                        />
                                    </li>
                                    <li className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input 
                                            onBlur={IsProfileChannged} 
                                            type="email" 
                                            name="email" 
                                            defaultValue={user?.email || ''}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full border-gray-300 border px-4 py-3 rounded-[15px] md:rounded-[15px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500" 
                                            placeholder="your@email.com"
                                        />
                                    </li>
                                    <li className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <div className="custom-select-wrapper">
                                            <select 
                                                className="w-full border-gray-300 border px-4 py-3 rounded-[15px] md:rounded-[15px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white"
                                                onChange={(e) => setData('gender', e.target.value)}
                                                defaultValue={user?.gender || ''}
                                            >
                                                <option value="" disabled>Select Gender</option>
                                                <option value="he">He</option>
                                                <option value="she">She</option>
                                                <option value="they">They</option>
                                            </select>
                                        </div>
                                    </li>
                                    <li className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                        <textarea 
                                            onBlur={IsProfileChannged} 
                                            defaultValue={user?.bio || ''}
                                            onChange={(e) => setData("bio", e.target.value)}
                                            name="bio" 
                                            className="w-full border-gray-300 border p-4 rounded-[20px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 min-h-[120px]"
                                            placeholder='Tell us about yourself...' 
                                        />
                                    </li>
                                    <li className="mb-4">
                                        <div className="p-3 bg-gray-50 rounded-[20px] border border-gray-200">
                                            <strong className='block text-sm text-gray-600 mb-1'>Profile URL</strong>
                                            <div className="text-pink-600 font-medium break-all">
                                                {typeof window !== 'undefined' ? `https://spennypiggy.co/${username}` : ''}
                                            </div>
                                        </div>
                                    </li>

                                    <li className="mb-4">
                                        <Link href={route('account.2fa')} className="flex items-center justify-between p-4 bg-gray-50 rounded-[20px] border border-gray-200 hover:bg-gray-100 transition-colors w-full text-left">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-gray-800">Multi-Step Verification</h4>
                                                    {user?.is_2fa == 1 && (
                                                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-200">Enabled</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your account</p>
                                            </div>
                                            <div className="bg-white p-2 rounded-full border border-gray-200">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            <div className={activeTab === 'appearance' ? 'block' : 'hidden'}>
                                <div className='mainprofile mb-8 relative w-full'>
                                    <div className='profilePhotoImg cover group relative'>
                                        <img src={coverImage ? coverImage : (user?.cover_url || coverimage)} alt='Cover' className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90 !rounded-[30px]"/>
                                        <button 
                                            type="button"
                                            onClick={()=>setCoverUploadingStart(true)} 
                                            className='w-fit absolute top-4 right-4    bg-white shadow-lg hover:bg-gray-200 transition-all z-10 px-4 py-2 rounded-xl shadow-lg !text-sm' >
                                            Edit Cover Photo
                                        </button>
                                    </div>
                                    <div className="flex justify-center mt-[-70px]">
                                        <div className='w-[120px] h-[120px] dp group relative !border-3 !border-green-400 !rounded-[30px] overflow-hidden'>
                                            <img src={ profileDP ? profileDP : (user?.avatar_url || userdefaultphoto)} alt='Avatar' className="w-full h-full object-cover "/>
                                            <button 
                                                type="button"
                                                onClick={()=>setUploadingStart(true)} 
                                                className='editbtn absolute bottom-[5px] right-0 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all z-10'
                                            >
                                                <img src={editicon} alt="Edit" className=""/>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {user?.role == 1 && (
                                    <div className="bg-gray-50 p-6 rounded-[30px] border border-gray-200 mt-16 text-center">
                                        <h4 className="text-lg font-gulfs uppercase text-gray-800 mb-2">Social Media Banner</h4>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Generate a promotional banner to share your profile on social media platforms like Twitter, Facebook, and Instagram.
                                        </p>
                                        
                                        {currentSocialBanner && (
                                            <div className="mb-4 relative group">
                                                <div className="border-4 border-white rounded-[20px] shadow-lg overflow-hidden mx-auto max-w-md">
                                                    <img 
                                                        src={currentSocialBanner || auth?.user?.social_url} 
                                                        alt="Social Media Banner" 
                                                        className="w-full h-auto"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">Right-click image to save</p>
                                            </div>
                                        )} 
                                    
                                        <button  
                                            type="button" 
                                            onClick={generateSocialImage}
                                            disabled={generatingBanner || (!localAvatar && !user?.avatar)}
                                            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-full font-medium shadow-md hover:shadow-lg transform transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed" 
                                        >
                                            {generatingBanner ? 'Generating...' : (currentSocialBanner ? 'Regenerate Banner' : 'Generate Banner')}
                                        </button> 
                                    </div>
                                )}
                            </div>

                            <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
                                <ul>
                                    {user?.role === 1 && (
                                        <>
                                            <li className="mb-6">
                                                <label className="block !text-lg font-medium !text-black mb-3">Profile Tags (Creator)</label>
                                                <div className="flex flex-wrap gap-3">
                                                    {creatortypes.map((s, index) => {
                                                        const isSelected = profileTags.includes(s.value);
                                                        return (
                                                            <div key={s.value} className="relative">
                                                                <input 
                                                                    id={`types-${index}`} 
                                                                    type="checkbox" 
                                                                    value={s.value} 
                                                                    className="hidden"
                                                                    onChange={handleProfileTags}
                                                                    checked={isSelected}
                                                                />
                                                                <label
                                                                    htmlFor={`types-${index}`}
                                                                    className={`block px-4 py-2 text-normal rounded-full font-medium cursor-pointer  min-w-[50px] !text-center transition-all duration-300 border 
                                                                        ${isSelected 
                                                                            ? "bg-pink-600 border-pink-500 !text-white shadow-md transform scale-105" 
                                                                            : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-50"
                                                                        }`}
                                                                >
                                                                    {s.label}
                                                                </label>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </li>

                                            {/* <li className="mb-6">
                                                <label className="block text-normal font-medium !text-black mb-2">Minimum Surprise Gift Amount</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                                        {global_currency?.symbol || '£'}
                                                    </span>
                                                    <input 
                                                        type="number" 
                                                        name="min_surprise_amount" 
                                                        defaultValue={user?.min_surprise_amount || ''}
                                                        onChange={(e) => setData('min_surprise_amount', e.target.value)}
                                                        className="w-full border-gray-300 border pl-10 pr-4 py-[10px] rounded-[10px] md:rounded-[15px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500" 
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Minimum amount supporters must spend for surprise gifts.
                                                </p>
                                            </li> */}
                                        </>
                                    )}

                                    <li className="mb-4">
                                        <ManagePasskey email={user?.email} />
                                    </li>

                                    <li className="mb-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[20px] border border-gray-200">
                                            <div>
                                                <h4 className="font-medium text-gray-800">Show Piggy Bank Earnings</h4>
                                                <p className="text-xs text-gray-500 mt-1">Display your earnings goal on your profile</p>
                                            </div>
                                            <Switch
                                                checked={piggyBankEnabled}
                                                onChange={togglePiggyBank}
                                                className={`${
                                                    piggyBankEnabled ? 'bg-pink-600' : 'bg-gray-300'
                                                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
                                            >
                                                <span
                                                    className={`${
                                                        piggyBankEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                />
                                            </Switch>
                                        </div>
                                    </li>

                                    <li className="mb-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[20px] border border-gray-200">
                                            <div>
                                                <h4 className="font-medium text-gray-800">Email Notifications</h4>
                                                <p className="text-xs text-gray-500 mt-1">Receive updates about your account via email</p>
                                            </div>
                                            <Switch
                                                checked={notificationsEnabled}
                                                onChange={toggleNotifications}
                                                className={`${
                                                    notificationsEnabled ? 'bg-pink-600' : 'bg-gray-300'
                                                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
                                            >
                                                <span
                                                    className={`${
                                                        notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                />
                                            </Switch>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-8 pb-8 pt-4 flex gap-4 items-center">
                                <button 
                                    type="button" 
                                    onClick={() => setClose(false)} 
                                    className="w-full rounded-xl bg-gray-200 border-[3px]
                                    border-black font-black uppercase tracking-widest block p-[10px] 
                                    hover:bg-gray-300 transition-colors 
                                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                                    hover:translate-x-[-2px] hover:translate-y-[-2px] 
                                    hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] !text-sm" 
                                >
                                    Cancel
                                </button>
                                <LoaderButton 
                                    type='submit' 
                                    disabled={processing} 
                                    className='w-full rounded-xl bg-yellow-300 
                                    border-[3px] border-black font-black 
                                    uppercase font-poppins tracking-widest block p-[10px] hover:bg-yellow-400 
                                    transition-colors font-bold !mt-0 !text-sm
                                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                                    hover:translate-x-[-2px] hover:translate-y-[-2px] 
                                    hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] !text-black '
                                    spinnerclass='fill-black'
                                >
                                    {loading || processing ? "Saving..." : "Save Changes"}
                                </LoaderButton>
                            </div>

                        </form>
                    </>
                )}
            </div>
        </Popup>
    )
}
