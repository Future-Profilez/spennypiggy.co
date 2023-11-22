import React from 'react'
import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import LoaderButton from '@/Components/LoaderButton';
import { useAlerts } from '@/Components/Alerts';

export default function Login({ status, canResetPassword }) {

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login-user'), {
            preserveScroll: true,
            onSuccess: (resp) => {
                reset();
            },
            onError: (err) => {
                reset("password");
                Object.keys(err).map((key) => {
                    errorAlert(err[key]);
                });
            }
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />
            {status && <div className="mb-4 font-medium text-sm text-green-600">{status}</div>}

            <div className='loginPage blackbg px-3 py-5'>
                <h2 className='headingLg mb-3 text-center '>Welcome Back !</h2>
                <p className='text-center text-white mb-5 font-CeraGRBold'>Don't have an account? <Link href={route('register')} className=' mb-6 text-pink'>Signup</Link></p>
                <div className='loginform mx-auto border-black whbg shadow-mint'>
                    <div className='loginheadbox pinkbg'>
                        <span className='mintbg'></span>
                        <span className='bluebg'></span>
                    </div>
                    <form onSubmit={submit} >
                        <div className='login-step1'>
                            <ul>
                                <li>
                                    <label>Enter Email</label>
                                    <input id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full"
                                        autoComplete="username"
                                        autoFocus={true}
                                        onChange={(e) => setData('email', e.target.value)} />
                                </li>
                                <li>
                                    <label>Password</label>
                                    <input id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                </li>
                            </ul>
                            {/* <InputError message={errors.email} className="mt-2" />
                            <InputError message={errors.password} className="mt-2" /> */}

                            <div className='rotate-btn text-center flex justify-center mt-10'>
                                {/* <button type='submit' className='btn-pink lg'>Login</button> */}
                                <LoaderButton disabled={processing} className='btn-pink lg2 lg w-80' spinnerClassName='fill-red-600'>{processing ? "Wait" : "Log in"}</LoaderButton>
                            </div>

                            {/* {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" >
                                    Forgot your password?
                                </Link>
                            )} */}

                        </div>
                    </form>
                </div>
            </div>
          
        </GuestLayout>
    );
}
