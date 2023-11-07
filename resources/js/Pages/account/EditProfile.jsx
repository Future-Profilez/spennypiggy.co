import React, { useRef, useState } from 'react'
import profileimg from '../../../assets/img/profileimg.png';
import editicon from '../../../assets/img/editicon.png';
import Popup from '@/Components/Popup';
import { useForm } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import GlobalUploader from '@/uploadcare/Uploader';
import UpdateAvatar from './UpdateAvatar';

export default function EditProfile({ user }) {

    const [close, setClose] = useState()
    const { successAlert, errorAlert } = useAlerts();
    const [profileDP, setProfileDP] = useState();
    const getImageUID = (e) => {
        console.log("gettted data", e);
        // setProfileDP
    }

    const [profile, setProfile] = useState('');
    const [username, setUsername] = useState(user?.username);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: user?.name || '',
        username: user?.username || '',
        bio: user?.bio || '',
    });



    const updateProfile = (e) => {
        e.preventDefault();
        post(route('edit-profile'), {
            preserveScroll: true,
            onSuccess: (resp) => {
                setClose(false);
                setTimeout(() => {
                    setClose();
                }, 1000);
                successAlert(resp.props.flash?.success || "Profile Updated.")
            },
            onError: (_err) => {
                console.log(`errors:`);
                console.table(errors);
            }
        });
    };

    return (
        <Popup action={close} text={<><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M11 5.00001H6C5.46957 5.00001 4.96086 5.21072 4.58579 5.5858C4.21071 5.96087 4 6.46958 4 7.00001V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H17C17.5304 20 18.0391 19.7893 18.4142 19.4142C18.7893 19.0391 19 18.5304 19 18V13M17.586 3.58601C17.7705 3.39499 17.9912 3.24262 18.2352 3.13781C18.4792 3.03299 18.7416 2.97782 19.0072 2.97551C19.2728 2.9732 19.5361 3.0238 19.7819 3.12437C20.0277 3.22493 20.251 3.37343 20.4388 3.56122C20.6266 3.74901 20.7751 3.97231 20.8756 4.2181C20.9762 4.46389 21.0268 4.72725 21.0245 4.99281C21.0222 5.25837 20.967 5.52081 20.8622 5.76482C20.7574 6.00883 20.605 6.22952 20.414 6.41401L11.828 15H9V12.172L17.586 3.58601Z" stroke="#5D25FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>  Edit your Profile </>} classes='editProfile w-full flex' >

            <div className='editprofileModal '>
                <div className='editprofileModalInner shadow-pink'>
                    <div className='editprofileHead'>
                        <h2>Edit your Profile</h2>
                        <button className=''><svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clip-path="url(#clip0_386_414)">
                                <path d="M20.5581 23.7753L21 24.2172L21.4419 23.7753L23.7753 21.4419L24.2172 21L23.7753 20.5581L18.2172 15L23.7753 9.44194L24.2172 9L23.7753 8.55806L21.4419 6.22472L21 5.78278L20.5581 6.22472L15 11.7828L9.44194 6.22472L9 5.78278L8.55806 6.22472L6.22472 8.55806L5.78278 9L6.22472 9.44194L11.7828 15L6.22472 20.5581L5.78278 21L6.22472 21.4419L8.55806 23.7753L9 24.2172L9.44194 23.7753L15 18.2172L20.5581 23.7753ZM3.33333 0.625H26.6667C27.385 0.625 28.0738 0.910341 28.5817 1.41825C29.0897 1.92616 29.375 2.61504 29.375 3.33333V26.6667C29.375 27.385 29.0897 28.0738 28.5817 28.5817C28.0738 29.0897 27.385 29.375 26.6667 29.375H3.33333C2.61504 29.375 1.92616 29.0897 1.41825 28.5817C0.910341 28.0738 0.625 27.385 0.625 26.6667V3.33333C0.625 2.61504 0.910341 1.92616 1.41825 1.41825C1.92616 0.910341 2.61504 0.625 3.33333 0.625Z" fill="#8C52FF" stroke="black" strokeWidth="1.25" />
                            </g>
                            <defs>
                                <clipPath id="clip0_386_414">
                                    <rect width="30" height="30" fill="white" />
                                </clipPath>
                            </defs>
                        </svg>
                        </button>
                    </div>
                    <div className='editProfilePhoto'>
                        <div className='profilePhoto'>
                            <h3>Profile</h3>
                            <div className='profilePhotoImg'>
                                <img src={profileimg} alt='img' />
                                <UpdateAvatar getImageUID={getImageUID} text={<> <button className='editbtn'><img src={editicon} alt="img" /></button></>} />
                            </div>
                        </div>

                        <div className='profilePhoto coverPhoto'>
                            <h3>Cover Image </h3>
                            <div className='profilePhotoImg'>
                                <img src={profileimg} alt='img' />
                                <button className='editbtn'><img src={editicon} alt="img" /></button>
                            </div>
                        </div>
                    </div>

                    <div className='editForm'>
                        <form onSubmit={updateProfile} >
                            <ul>
                                <li className="mb-3">
                                    <label className="mb-1">Display Name</label>
                                    <input type="text" name="name" defaultValue={user?.name || ''}
                                        onChange={(e) => setData('name', e.target.value)}
                                        class="form-input px-2 py-2 border w-full rounded-md" />
                                </li>

                                <li className="mb-2">
                                    <label className="mb-1">Username</label>
                                    <input defaultValue={user?.username || ''} onChange={(e) => setData("username", e.target.value)}
                                        type="text" name="username" class="form-input px-2 py-2 border w-full rounded-md" placeholder='Spennypiggy.com/warner99' onKeyUp={(e) => {setUsername(e.target.value)}}/>
                                </li>
                                <li><strong className='d-block text-start mb-4' >Profile URL : https://www.spennypiggy.co/{username}</strong></li>

                                <li className="mb-3">
                                    <label className="mb-1">Bio</label>
                                    <textarea defaultValue={user?.bio || ''}
                                        onChange={(e) => setData("bio", e.target.value)}
                                        name="bio" class="form-input px-2 py-2 border w-full rounded-md"
                                        placeholder='Bio' />
                                </li>

                            </ul>
                            <div className=" text-center mb-7">
                                <button type='submit' className="editProfile flex w-12 mx-auto">Update Profile</button>
                            </div>

                            {/* <UpdatePasswordForm className="max-w-xl" /> */}

                        </form>
                    </div>

                </div>
            </div>

        </Popup>
    )
}
