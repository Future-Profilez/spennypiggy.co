import React, { useRef, useState } from 'react'
import userdefaultphoto from '../../../assets/img/userphoto.png';
import coverimage from '../../../assets/img/wishlistbannerimg.jpg';
import editicon from '../../../assets/img/editicon.png';
import Popup from '@/Components/Popup';
import { useForm } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import UpdateAvatar from './UpdateAvatar';
import LoaderButton from '@/Components/LoaderButton';
import PriceFormat from '@/includes/PriceFormat';

export default function EditProfile({ user, global_currency }) {

    const { formatMultiPrice } = PriceFormat();
    const [close, setClose] = useState()
    const { successAlert, errorAlert } = useAlerts();
    const [profileDP, setProfileDP] = useState();
    const [coverImage, setCoverImage] = useState();

    const getImageUID = (e) => {
        setData('avatar', e);
        setProfileDP(e.cdnUrl);
    }

    const getCoverUID = (e) => {
        setCoverImage(e.cdnUrl);
        setData('cover', e);
    }
 
    const [username, setUsername] = useState(user?.username);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: user?.name || '',
        username: user?.username || '',
        bio: user?.bio || '',
        avatar: '',
        cover: '',
        min_surprise_amount: user?.min_surprise_amount || '',
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
                }
                if(resp.props.flash?.error){
                    errorAlert(resp.props.flash?.error || "Something went wrong.")
                }
            },
            onError: (_err) => {
                console.error(`errors:`);
                console.table(_err);
                if(_err.username){
                    errorAlert(_err.username || "Something went wrong.")
                }
            }
        });
    };

    const defaultCurrency = user.default_currency.toUppercase;

    return (
        <Popup modalclass='pinkmodal editprofile full' size='md' action={close} 
            text={<> Update Profile </>}
            classes='button bg-pink d-table d-sm-flex m-auto m-sm-0' >
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
                                className="form-input px-2 py-2 border w-full rounded-md" />
                        </li>
                        <li className="mb-2">
                            <label className="mb-1">Username</label>
                            <input defaultValue={user?.username || ''} onChange={(e) => setData("username", e.target.value)}
                                type="text" name="username" className="form-input px-2 py-2 border w-full rounded-md" placeholder='Spennypiggy.co/warner99' onKeyUp={(e) => {setUsername(e.target.value)}}/>
                        </li>

                        <li><strong className='d-block text-start mb-4' >Profile URL : {window.location.href}</strong></li>
                        
                        <li className="mb-3">
                            <label className="mb-1">Bio</label>
                            <textarea defaultValue={user?.bio || ''}
                                onChange={(e) => setData("bio", e.target.value)}
                                name="bio" className="form-input px-2 py-2 border w-full rounded-md"
                                placeholder='Bio' />
                        </li>
                   
                        <li className="mb-3">
                            <label className="mb-1">Minimum surprise gift amount</label>
                            <div className='currency-wrapper position-relative' >
                                <span className="currency-tag">{defaultCurrency || 'GBP'}</span>
                                <input type="text" name="name" defaultValue={user?.min_surprise_amount || ''}
                                onChange={(e) => setData('min_surprise_amount', e.target.value)}
                                className="form-input px-2 py-2 border w-full rounded-md" />
                            </div>
                            {/* global_currency */}
                            <p className="mt-1">
                                The Minimum amount is set 
                                to {formatMultiPrice(user?.min_surprise_amount || 0,  defaultCurrency )}. 
                            </p>
                        </li>

                    </ul>

                    <div className=" text-center mb-7">
                        <LoaderButton type='submit' disabled={processing} className='btn-pink lg m-auto' spinnerClassName='fill-red-600'>
                            {processing ? "Updating" : "Update Profile"}
                        </LoaderButton>
                    </div>
                </form>
            </div>
        </Popup>
    )
}
