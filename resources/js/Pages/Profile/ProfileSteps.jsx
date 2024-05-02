import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { ProgressBar } from "react-bootstrap";
import AddIntro from "../intros/AddIntro";
import LinkTwitter from "../twitter/LinkTwitter";
import EditProfile from "../account/EditProfile";
import AddPost from "../feed/AddPost";
import ChangeVat from "../account/ChangeVat";
import Popup from "@/Components/Popup";

export default function ProfileSteps({ IsloggedIn }) {
    const { auth, user, global_currency } = usePage().props;

    const [status, setStatus] = useState();
    const fetch_goal = async (signal) => {
        axios
            .get(`/profile-steps-status`, { signal })
            .then((resp) => {
                setStatus(resp.data);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        fetch_goal(signal);
    }, []);

    return (
        <>
            {status && status.total < 7 ? (
                <>
                    <style>{`
            .check-icon.checked svg path {fill: #139700 !important;}
          `}</style>
                    <div
                        div
                        className="profileSteps bg-white border border-gray-400 rounded-5 p-4 mb-4 "
                    >
                        <h2 className="mb-1 text-[20px] font-bold ">
                            Let’s get you started
                        </h2>
                        <p className="text-gray-500 mb-3">
                            {" "}
                            Successful creators complete these steps
                        </p>
                        <ProgressBar now={status && status.total} max={7} />

                        {/* Payments */}
                        <div className="profile-steps border border-gray-200 rounded-lg d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        status && status.payment_connect == 1
                                            ? "checked"
                                            : ""
                                    }`}
                                >
                                    {" "}
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 18 18"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M9 18C10.1819 18 11.3522 17.7672 12.4442 17.3149C13.5361 16.8626 14.5282 16.1997 15.364 15.364C16.1997 14.5282 16.8626 13.5361 17.3149 12.4442C17.7672 11.3522 18 10.1819 18 9C18 7.8181 17.7672 6.64778 17.3149 5.55585C16.8626 4.46392 16.1997 3.47177 15.364 2.63604C14.5282 1.80031 13.5361 1.13738 12.4442 0.685084C11.3522 0.232792 10.1819 -1.76116e-08 9 0C6.61305 3.55683e-08 4.32387 0.948211 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18ZM8.768 12.64L13.768 6.64L12.232 5.36L7.932 10.519L5.707 8.293L4.293 9.707L7.293 12.707L8.067 13.481L8.768 12.64Z"
                                            fill="#444444"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Connect to payments
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Connect to Stripe to receive payments
                                    </p>
                                </div>
                            </div>
                            <div>
                                {status && status.payment_connect == 1 ? (
                                    <p className="text-success">Connected</p>
                                ) : (
                                    <Link href="/stripe">Connect</Link>
                                )}{" "}
                            </div>
                        </div>

                        {/* Intro Video */}
                        <div className="profile-steps border border-gray-200 rounded-lg d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        status && status.intro == 1
                                            ? "checked"
                                            : ""
                                    }`}
                                >
                                    {" "}
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 18 18"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M9 18C10.1819 18 11.3522 17.7672 12.4442 17.3149C13.5361 16.8626 14.5282 16.1997 15.364 15.364C16.1997 14.5282 16.8626 13.5361 17.3149 12.4442C17.7672 11.3522 18 10.1819 18 9C18 7.8181 17.7672 6.64778 17.3149 5.55585C16.8626 4.46392 16.1997 3.47177 15.364 2.63604C14.5282 1.80031 13.5361 1.13738 12.4442 0.685084C11.3522 0.232792 10.1819 -1.76116e-08 9 0C6.61305 3.55683e-08 4.32387 0.948211 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18ZM8.768 12.64L13.768 6.64L12.232 5.36L7.932 10.519L5.707 8.293L4.293 9.707L7.293 12.707L8.067 13.481L8.768 12.64Z"
                                            fill="#444444"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Add Intro Video
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Add a 15 - 30 sec intro video for your
                                        fans.
                                    </p>
                                </div>
                            </div>
                            <div>
                                {status && status.intro == 1 ? (
                                    <p className="text-success">Added</p>
                                ) : (
                                    <AddIntro
                                        classes="pt-3"
                                        text="Add"
                                        uuid={user?.id || null}
                                        IsloggedIn={IsloggedIn}
                                    />
                                )}{" "}
                            </div>
                        </div>

                        {/* auto_tweets */}
                        <div className="profile-steps border border-gray-200 rounded-lg d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        status && status.auto_tweets == 1
                                            ? "checked"
                                            : ""
                                    }`}
                                >
                                    {" "}
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 18 18"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M9 18C10.1819 18 11.3522 17.7672 12.4442 17.3149C13.5361 16.8626 14.5282 16.1997 15.364 15.364C16.1997 14.5282 16.8626 13.5361 17.3149 12.4442C17.7672 11.3522 18 10.1819 18 9C18 7.8181 17.7672 6.64778 17.3149 5.55585C16.8626 4.46392 16.1997 3.47177 15.364 2.63604C14.5282 1.80031 13.5361 1.13738 12.4442 0.685084C11.3522 0.232792 10.1819 -1.76116e-08 9 0C6.61305 3.55683e-08 4.32387 0.948211 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18ZM8.768 12.64L13.768 6.64L12.232 5.36L7.932 10.519L5.707 8.293L4.293 9.707L7.293 12.707L8.067 13.481L8.768 12.64Z"
                                            fill="#444444"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Enable Auto Tweets
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Enable auto tweets for your fans when
                                        you get any wish granted.
                                    </p>
                                </div>
                            </div>
                            <div>
                                {status && status.auto_tweets == 1 ? (
                                    <p className="text-success">Linked</p>
                                ) : (
                                    <Link href="/account">Link</Link>
                                )}{" "}
                            </div>
                        </div>

                        {/* basic_profile */}
                        <div className="profile-steps border border-gray-200 rounded-lg d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        status && status.basic_profile == 1
                                            ? "checked"
                                            : ""
                                    }`}
                                >
                                    {" "}
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 18 18"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M9 18C10.1819 18 11.3522 17.7672 12.4442 17.3149C13.5361 16.8626 14.5282 16.1997 15.364 15.364C16.1997 14.5282 16.8626 13.5361 17.3149 12.4442C17.7672 11.3522 18 10.1819 18 9C18 7.8181 17.7672 6.64778 17.3149 5.55585C16.8626 4.46392 16.1997 3.47177 15.364 2.63604C14.5282 1.80031 13.5361 1.13738 12.4442 0.685084C11.3522 0.232792 10.1819 -1.76116e-08 9 0C6.61305 3.55683e-08 4.32387 0.948211 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18ZM8.768 12.64L13.768 6.64L12.232 5.36L7.932 10.519L5.707 8.293L4.293 9.707L7.293 12.707L8.067 13.481L8.768 12.64Z"
                                            fill="#444444"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Complete Basic Profile
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Add a profile picture and bio
                                    </p>
                                </div>
                            </div>
                            <div>
                                {status && status.basic_profile == 1 ? (
                                    <p className="text-success">Added</p>
                                ) : (
                                    <EditProfile
                                        user={user}
                                        classes="updatebtn"
                                        global_currency={global_currency}
                                    />
                                )}{" "}
                            </div>
                        </div>

                        {/* post_required */}
                        <div className="profile-steps border border-gray-200 rounded-lg d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        status && status.post_required == 1
                                            ? "checked"
                                            : ""
                                    }`}
                                >
                                    {" "}
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 18 18"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M9 18C10.1819 18 11.3522 17.7672 12.4442 17.3149C13.5361 16.8626 14.5282 16.1997 15.364 15.364C16.1997 14.5282 16.8626 13.5361 17.3149 12.4442C17.7672 11.3522 18 10.1819 18 9C18 7.8181 17.7672 6.64778 17.3149 5.55585C16.8626 4.46392 16.1997 3.47177 15.364 2.63604C14.5282 1.80031 13.5361 1.13738 12.4442 0.685084C11.3522 0.232792 10.1819 -1.76116e-08 9 0C6.61305 3.55683e-08 4.32387 0.948211 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18ZM8.768 12.64L13.768 6.64L12.232 5.36L7.932 10.519L5.707 8.293L4.293 9.707L7.293 12.707L8.067 13.481L8.768 12.64Z"
                                            fill="#444444"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Post Required
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        You must add 1 post for subscribers, 1
                                        for memberships, 1 for supportors.{" "}
                                    </p>
                                </div>
                            </div>
                            <div>
                                {status && status.post_required == 1 ? (
                                    <p className="text-success">Added</p>
                                ) : (
                                    <AddPost classes="editpoststep" />
                                )}{" "}
                            </div>
                        </div>

                        {/* vat_setting */}
                        <div className="profile-steps border border-gray-200 rounded-lg d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        status && status.vat_setting == 1
                                            ? "checked"
                                            : ""
                                    }`}
                                >
                                    {" "}
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 18 18"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M9 18C10.1819 18 11.3522 17.7672 12.4442 17.3149C13.5361 16.8626 14.5282 16.1997 15.364 15.364C16.1997 14.5282 16.8626 13.5361 17.3149 12.4442C17.7672 11.3522 18 10.1819 18 9C18 7.8181 17.7672 6.64778 17.3149 5.55585C16.8626 4.46392 16.1997 3.47177 15.364 2.63604C14.5282 1.80031 13.5361 1.13738 12.4442 0.685084C11.3522 0.232792 10.1819 -1.76116e-08 9 0C6.61305 3.55683e-08 4.32387 0.948211 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18ZM8.768 12.64L13.768 6.64L12.232 5.36L7.932 10.519L5.707 8.293L4.293 9.707L7.293 12.707L8.067 13.481L8.768 12.64Z"
                                            fill="#444444"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        VAT setting
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Add vat percentage.{" "}
                                    </p>
                                </div>
                            </div>
                            <div>
                                {status && status.vat_setting !== 1 ? (
                                    <p className="text-success">Added</p>
                                ) : (
                                    <Popup
                                        space="4"
                                        modalclassName="pinkmodal"
                                        text={"Add"}
                                    >
                                        <ChangeVat />
                                    </Popup>
                                )}{" "}
                            </div>
                        </div>

                        {/* content */}
                        <div className="profile-steps border border-gray-200 rounded-lg d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        status && status.contents == 1
                                            ? "checked"
                                            : ""
                                    }`}
                                >
                                    {" "}
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 18 18"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M9 18C10.1819 18 11.3522 17.7672 12.4442 17.3149C13.5361 16.8626 14.5282 16.1997 15.364 15.364C16.1997 14.5282 16.8626 13.5361 17.3149 12.4442C17.7672 11.3522 18 10.1819 18 9C18 7.8181 17.7672 6.64778 17.3149 5.55585C16.8626 4.46392 16.1997 3.47177 15.364 2.63604C14.5282 1.80031 13.5361 1.13738 12.4442 0.685084C11.3522 0.232792 10.1819 -1.76116e-08 9 0C6.61305 3.55683e-08 4.32387 0.948211 2.63604 2.63604C0.948212 4.32387 0 6.61305 0 9C0 11.3869 0.948212 13.6761 2.63604 15.364C4.32387 17.0518 6.61305 18 9 18ZM8.768 12.64L13.768 6.64L12.232 5.36L7.932 10.519L5.707 8.293L4.293 9.707L7.293 12.707L8.067 13.481L8.768 12.64Z"
                                            fill="#444444"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Add wish bills and memberships
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Add vat percentage.
                                    </p>
                                </div>
                            </div>
                            <div>
                                {status && status.contents !== 1 ? (
                                    <p className="text-success">Added</p>
                                ) : (
                                    ""
                                )}{" "}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                ""
            )}
        </>
    );
}
