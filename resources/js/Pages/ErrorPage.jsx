import Nocontent from "@/includes/Nocontent"
import Guest from "@/Layouts/GuestLayout"
import { Head, Link } from "@inertiajs/react"
import noresultimg from '../../assets/img/noresultimg.png' ;
import * as Sentry from '@sentry/react';
import { useEffect } from "react";

export default function ErrorPage(props) {
    const {status, message = '', auth} = props;
    function ReportBugButton() {
        Sentry.showReportDialog({
            title: "Report a Bug",
            subtitle: "Please describe what went wrong.",
            labelName: "Name",
            labelEmail: "Email",
            labelComments: "What happened?",
            labelSubmit: "Send Report",
            user: {
                name: auth?.user?.name || '',
                email: auth?.user?.email || ''
            }
        });
    }
    const goBack = (e) => {
        history.back();
    }

    async function openform(){
        const feedback = Sentry.getFeedback();
        const form = await feedback?.createForm();
        form.appendToDom();
        form.open();
    }


    return (
    <div className="">
    <Guest>
        <Head title={'Sorry, we are doing some maintenance'}/>
        {status == 404 ? <Nocontent   /> : <>
            <div className="h-screens my-[100px] items-center justify-center">
                <div>
                    <div className="shadow-layout  inputs max-w-[600px] pink-shadow-layout mx-auto  !border-3 border-black  bg-white shadow-pink overflow-hidden">
                        <div className='p-3 pinkbg flex  !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center '>
                            <span className=' border-black border-2 bg-red-700 me-2 w-4 h-4 rounded-full block'></span>
                            <span className=' border-black border-2 bg-yellow-400 me-2 w-4 h-4 rounded-full block'></span>
                            <span className=' border-black border-2 bg-mint me-2 w-4 h-4 rounded-full block'></span>
                        </div>
                        <div className="p-4 text-center">
                        <div className='noresultimg mb-5 m-auto d-table'>
                            <img className="max-h-[100px]" alt="img" src={noresultimg} />
                        </div>
                        <p className="p-a pb-4 mb-0 text-2xl font-bold px-12">Sorry, we are doing some maintenance. Please check back soon.</p>
                        <p className="p-a pb-4 mb-0 text-normal px-12">{message}</p>
                            {/* <Link onClick={goBack} className="back block max-w-[300px] m-auto">Back to previous page</Link> */}
                            <button id='reportbug' className="back block max-w-[300px] m-auto">Back to previous page</button>
                        </div>
                    </div>
                    <div className="flex justify-center pt-6 text-white">
                        <p>If your problem persists, please
                             <a 
                            //  onClick={openform} 
                             className="cursor-pointer ms-2 text-pink livechat intercom-dud02y e11rlguj1">Report a Bug</a>
                            </p>
                    </div>
                </div>
            </div>
        </>}
    </Guest>
    </div>
    )
}
