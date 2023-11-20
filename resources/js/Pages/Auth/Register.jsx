import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';

import { Head, Link, useForm } from '@inertiajs/react';
import LoaderButton from '@/Components/LoaderButton';

export default function Register() {

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className='loginPage blackbg py-14'>
            <div className='containerbox '>

                <h2 className='headingLg pb-0 pb-md-4 text-center  px-2'>Create Account</h2>
                <p className='text-center text-white mb-5 font-CeraGRBold'>Already registered? <Link className={'text-pink'} href={route('login')}  > Log In</Link></p>

                <div className='loginform mt-4 mt-md-5 mx-auto border-black whbg shadow-mint'>
                    <div className='loginheadbox pinkbg'>
                        <span className='mintbg'></span>
                        <span className='bluebg'></span>
                    </div>
                    <form onSubmit={submit} >
                        <div className='login-step1'>
                            <ul>
                                <li>
                                    <label>Display Name</label>
                                    <input id="name"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full"
                                    autoComplete="name"
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    />
                                    <InputError>{errors?.name || ''}</InputError>
                                </li>
                                <li>
                                    <label>Username</label>
                                    <input id="username"
                                    name="username"
                                    value={data.username}
                                    className="mt-1 block w-full"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('username', e.target.value)}
                                    required 
                                    />
                                </li>
                                <li>
                                    <label>Email</label>
                                    <input id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full"
                                        autoComplete="username"
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                     />
                                     <InputError>{errors?.email || ''}</InputError>
                                </li>
                                <li>
                                    <label>Password</label>
                                    <input  id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    />
                                    <InputError>{errors?.password || ''}</InputError>
                                </li>
                                <li>
                                    <label>Confirm Password</label>
                                    <input
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                    />
                                    <InputError>{errors?.password_confirmation || ''}</InputError>
                                </li>
                            </ul>
                            <div className='wishlistbtn  rotate-btn text-center flex justify-center mt-4'>
                                {/* <button type='submit' className='btn-pink lg'>
                                    {processing ? "Proccessing" : " Create your Account"}
                                </button> */}
                                <LoaderButton disabled={processing} className='btn-pink lg lg2' spinnerClassName='fill-red-600'>{processing ? "Proccessing" : " Create Account"}</LoaderButton>
                            </div>

                            
                        </div>
                    </form>
                </div>
            </div>
            </div>
        </GuestLayout>
    );
}
