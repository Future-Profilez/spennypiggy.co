import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import LoaderButton from '@/Components/LoaderButton';
import { useAlerts } from '@/Components/Alerts';
import InputError from '@/Components/InputError';
import EnterOTP from './EnterOTP';
import axios from 'axios';
import { useState } from 'react';
import DeviceID from '@/includes/DeviceID';

export default function Login({ status, canResetPassword }) {

    const urlParams = new URLSearchParams(window.location.search);
    const paramValue = urlParams.get('redirect');
    const redirectmessage = urlParams.get('message');
    const [open, setOpen] = useState(false);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setLoading(processing);
    }, [processing]);
    
    // Prime CSRF cookie when component mounts
    useEffect(() => {
        axios.get('/csrf-cookie').catch(err => {
            console.warn('Failed to prime CSRF cookie:', err);
        });
    }, []);
    
    useEffect(() => {
        return () => {
            reset("password");
        };
    }, []);


    const { flash } = usePage().props;
    // useEffect(() => {
    //     if(errors){
    //         Object.entries(errors).forEach(([key, value]) => {
    //             errorAlert(value);
    //         });
    //     }
    //     if (flash?.error) {
    //         errorAlert(flash.error);
    //     }
    //     if (flash?.success) {
    //         successAlert(flash.success);
    //     }
    //     if (flash?.warning) {
    //         warningAlert(flash.warning);
    //     }
    //     if (flash?.info) {
    //         successAlert(flash.info);
    //     }
    // },[]);

    const submit = (e) => {
        const deviceId = DeviceID();
        const loginData = {
            ...data,
            device_id: deviceId
        };
        setLoading(true);
        
        // axios will automatically handle CSRF token from cookie
        axios.post(route('login-user'), loginData, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then((response) => {
            localStorage.removeItem("cart");
            reset();
            if (paramValue) {
                router.visit(paramValue);
            } else if (response.data && response.data.redirect_url) {
                router.visit(response.data.redirect_url);
            } else {
                window.location.reload();
            }
        })
        .catch((error) => {
            setLoading(false);
            reset("password");
            
            if (error.response) {
                if (error.response.status === 422 || error.response.status === 429) {
                    const errorData = error.response.data;
                    if (errorData.message) {
                        errorAlert(errorData.message);
                    }
                    if (errorData.errors) {
                        Object.entries(errorData.errors).forEach(([field, messages]) => {
                            if (Array.isArray(messages)) {
                                messages.forEach(message => errorAlert(message));
                            }
                        });
                    }
                } else {
                    errorAlert('An unexpected error occurred. Please try again.');
                }
            } else if (error.request) {
                errorAlert('Network error. Please check your connection and try again.');
            } else {
                errorAlert('An error occurred. Please try again.');
            }
        });
    };

    const checkTFA = (e) => {
        e.preventDefault();
        setLoading(true);
        axios.post('/verify-user', data)
            .then((resp) => {
                if (resp.data.status) {
                    if (resp.data.is_2fa) {
                        setOpen("open");
                        setLoading(false);
                        setTimeout(() => {
                            setOpen(false);
                        }, 1000);
                    } else {
                        submit();
                    }
                } else {
                    errorAlert(resp.data.msg);
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error("Verify user error:", err);
                if (err.response && err.response.data && err.response.data.message) {
                    errorAlert(err.response.data.message);
                } else if (err.response && err.response.data && err.response.data.msg) {
                    errorAlert(err.response.data.msg);
                } else if (err.message) {
                    errorAlert(err.message);
                } else {
                    errorAlert('An error occurred during login. Please try again.');
                }
                setLoading(false);
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
                <div className="shadow-layout inputs max-w-[600px] pink-shadow-layout mx-auto  !border-3 border-black  bg-white shadow-pink overflow-hidden">
                    <div className='p-4 pinkbg flex  !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center '>
                        <span className=' border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block'></span>
                    </div>
                    <form className='!p-4 sm:!p-6 md:!p-10' onSubmit={checkTFA} >
                        <div className='login-step1 loginform'>
                            <p className='text-center font-CeraGRBold text-red-600 text-lg mb-4'>{redirectmessage}</p>
                            <ul>
                                <li className="formfield mb-6">
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
                                    <div className='p-2'>
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>
                                </li>
                                <li className="formfield mb-6">
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
                                    <div className='p-2'>
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    {canResetPassword && (
                                        <div className=" mt-2 m-auto d-table ">
                                            <Link
                                                href={route("password.request")}
                                                className="text-sm text-gray-600 hover:text-gray-900"
                                            >
                                                Forgot your password?
                                            </Link>
                                        </div>
                                    )}
                                </li>
                            </ul>

                            <div className="  text-center flex justify-center ">
                                {/* <button type='submit' className='main-button b size-lg !px-12'>Login Now</button> */}
                                <LoaderButton
                                    disabled={loading}
                                    className="b size-lg !px-12 py-[10px] text-lg"
                                    spinnerClassName="fill-red-600" >
                                    {loading ? "Loggin In..." : "Log in"}
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
