import React, { useRef, useState } from 'react'
import userdefaultphoto from '../../../assets/img/userphoto.png';
import coverimage from '../../../assets/img/wishlistbannerimg.jpg';
import editicon from '../../../assets/img/editicon.png';
import Popup from '@/Components/Popup';
import { useForm } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import UpdateAvatar from './UpdateAvatar';
import LoaderButton from '@/Components/LoaderButton';

export default function EditProfile({ user }) {

    const [close, setClose] = useState()
    const { successAlert, errorAlert } = useAlerts();

    const [profileDP, setProfileDP] = useState();
    const [coverImage, setCoverImage] = useState();

    const getImageUID = (e) => {
        setData('avatar', e.uuid);
        setProfileDP(e.cdnUrl);
    }

    const getCoverUID = (e) => {
        setCoverImage(e.cdnUrl);
        setData('cover', e.uuid);
    }
 
    const [username, setUsername] = useState(user?.username);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: user?.name || '',
        username: user?.username || '',
        bio: user?.bio || '',
        avatar: user?.avatar || '',
        cover: user?.cover || '',
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
                if(resp.props.flash?.success){
                    successAlert(resp.props.flash?.success || "Updated successfully.");
                } else { 
                    errorAlert(resp.props.flash?.error || "Something went wrong.")
                }  
            },
            onError: (_err) => {
                console.error(`errors:`);
                console.table(errors);
            }
        });
    };

    return (
        <Popup modalclass='pinkmodal editprofile' size='md' action={close} 
            text={<><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M11 5.00001H6C5.46957 5.00001 4.96086 5.21072 4.58579 5.5858C4.21071 5.96087 4 6.46958 4 7.00001V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H17C17.5304 20 18.0391 19.7893 18.4142 19.4142C18.7893 19.0391 19 18.5304 19 18V13M17.586 3.58601C17.7705 3.39499 17.9912 3.24262 18.2352 3.13781C18.4792 3.03299 18.7416 2.97782 19.0072 2.97551C19.2728 2.9732 19.5361 3.0238 19.7819 3.12437C20.0277 3.22493 20.251 3.37343 20.4388 3.56122C20.6266 3.74901 20.7751 3.97231 20.8756 4.2181C20.9762 4.46389 21.0268 4.72725 21.0245 4.99281C21.0222 5.25837 20.967 5.52081 20.8622 5.76482C20.7574 6.00883 20.605 6.22952 20.414 6.41401L11.828 15H9V12.172L17.586 3.58601Z" stroke="#5D25FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg> Update Profile </>}
            classes=' editProfile w-full flex' >
            <div className='editprofileHead'>
                <h2>Edit your Profile</h2>
            </div>
            <div className='editForm'>
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
                        <LoaderButton type='submit' disabled={processing} 
                        className='btn-pink lg m-auto' spinnerClassName='fill-red-600'>
                            {processing ? "Updating" : "Update Profile"}
                        </LoaderButton>
                    </div>
                    {/* <UpdatePasswordForm className="max-w-xl" /> */}
                </form>
            </div>
        </Popup>
    )
}
