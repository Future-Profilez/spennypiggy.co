import React from 'react'
import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import LoaderButton from '@/Components/LoaderButton';
import { useAlerts } from '@/Components/Alerts';
import EnterOTP from './EnterOTP';
import axios from 'axios';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const [open, setOpen] = useState(false);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const [loading, setLoading] = useState(processing)
    useEffect(() => {
        return () => {
            reset("password");
        };
    }, []);

    const submit = (e) => {
        post(route('login-user'), {
            preserveScroll: true,
            onSuccess: (resp) => {
                if (resp.props.flash.error) {
                    errorAlert(resp.props.flash.error);
                }
                localStorage.removeItem("cart");
                reset();
            },
            onError: (err) => {
                reset("password");
                Object.keys(err).map((key) => {
                    errorAlert(err[key]);
                });
            },
        });
    };

    const checkTFA = (e) => {
        e.preventDefault();
        submit();
        return false;
        setLoading(true)
        axios.post('/verify-user', data).then((resp) => {
           if (resp.data.status) {
               if (resp.data.is_2fa) {
                   setOpen("open");
                   setTimeout(() => {
                    setOpen(false);
                   },1000);
                } else { 
                    submit();
                }
           } else { 
               errorAlert(resp.data.msg);
           }
            setLoading(false);
        }).catch((err) => {
            console.error("err", err);
        });
    };     

    return (
        <GuestLayout>
            <Head title="Log in" />
            {status && (
                <div className="mb-4 font-medium text-sm text-green-600">{status}</div>
            )}
            <div className="loginPage blackbg px-3 py-5">
                <h2 className="headingLg mb-3 text-center ">Welcome Back !</h2>
                <p className="text-center text-white text-large mb-5 font-CeraGRBold">
                    Don't have an account?{" "}
                    <Link href={route("register")} className=" mb-6 text-pink">
                        Signup
                    </Link>
                </p>
                <div className="loginform mx-auto border-black whbg shadow-mint">
                    <div className="loginheadbox pinkbg">
                        <span className="mintbg"></span>
                        <span className="bluebg"></span>
                    </div>
                    <form onSubmit={checkTFA} >
                        <div className='login-step1'>
                            <ul>
                                <li className="formfield">
                                    <label>Enter Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full"
                                        autoComplete="username"
                                        autoFocus={true}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                    />
                                </li>
                                <l className="formfield">
                                    <label>Password</label>
                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full"
                                        autoComplete="current-password"
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                    />

                                    {canResetPassword && (
                                        <div className=" mt-4 m-auto d-table ">
                                            <Link
                                                href={route("password.request")}
                                                className="text-sm text-sm text-gray-600 hover:text-gray-900"
                                            >
                                                Forgot your password?
                                            </Link>
                                        </div>
                                    )}
                                </l>
                            </ul>

                            {/* <InputError message={errors.email} className="mt-2" />
                            <InputError message={errors.password} className="mt-2" /> */}

                            <div className="rotate-btn text-center flex justify-center mt-10">
                                {/* <button type='submit' className='btn-pink lg'>Login</button> */}
                                <LoaderButton
                                    disabled={loading}
                                    className="btn-pink lg2 lg w-80 mb-4 mb-md-0 max-width login"
                                    spinnerClassName="fill-red-600" >
                                    {loading ? "Wait" : "Log in"}
                                </LoaderButton>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <EnterOTP action={open} user={data} />
        </GuestLayout>
    );
}
