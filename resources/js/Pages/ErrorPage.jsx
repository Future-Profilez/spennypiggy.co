import Nocontent from "@/includes/Nocontent"
import Guest from "@/Layouts/GuestLayout"
import { Head, Link } from "@inertiajs/react"
import noresultimg from '../../assets/img/noresultimg.png' ;
import * as Sentry from '@sentry/react';
import { useEffect } from "react";

export default function ErrorPage(props) {

    const { status, message = '', consoleMessage = '', auth } = props;

    useEffect(() => {
        if (consoleMessage) {
            console.error('[Application Error]:', consoleMessage);
        }
    }, [consoleMessage]);
    
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
    <div className="bg-[#A2E4B8]">
        <Guest auth={auth}>
            <Head title={'Sorry, we are doing some maintenance'}/>
 {status == 404 ? <Nocontent /> : <>
                <div className="h-dvh py-[20px] flex items-center justify-center">
                    <div className="px-6 mb-28">
 <div className=" inputs max-w-[600px] mx-auto !border-2 border-black bg-white overflow-hidden">
 <div className='py-4 px-6 flex !border-b-[2px] !border-t-0 !border-l-0 !border-r-0 border-black items-center '>
                                <span className=' border-black border-2 bg-red-700 me-2 w-4 h-4 rounded-full block'></span>
                                <span className=' border-black border-2 bg-yellow-400 me-2 w-4 h-4 rounded-full block'></span>
                                <span className=' border-black border-2 bg-mint me-2 w-4 h-4 rounded-full block'></span>
                            </div>
                            <div className="p-4 text-center">
                            <div className='noresultimg mb-5 m-auto d-table'>
                                <img className="max-h-[100px]" alt="img" src={noresultimg} />
                            </div>
 <p className="p-a pb-4 mb-0 text-2xl font-bold px-4 md:px-12">This page not working right now. Please try again later.</p>
 <p className="p-a pb-4 mb-0 px-4 md:px-12">{message}</p>
                                {/* <Link onClick={goBack} className="back block max-w-[300px] m-auto">Back to previous page</Link> */}
 <button id='reportbug' onClick={goBack} className="back block max-w-[300px] min-h-[44px] text-black m-auto">Back to previous page</button>
                            </div>
                        </div>
                        <div className="md:flex justify-center pt-6 text-white">
                            <div className="text-black text-center"><span className="w-full md:w-auto ">If your problem persists, please</span>
                                <a
 className="cursor-pointer ms-2 text-pink livechat intercom-dud02y e11rlguj1 inline-flex min-h-[44px] items-center">Report a Bug</a>
                                </div>
                        </div>
                    </div>
                </div>
            </>}
        </Guest>
    </div>
    )
}
