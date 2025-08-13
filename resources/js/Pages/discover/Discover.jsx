import { lazy } from "react";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Head  } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
const JoinUs = lazy(() => import('@/Components/JoinUs'));
const Allwishes = lazy(() => import('./AllWishes'));
const IntroVideos = lazy(() => import('./IntrosVideos'));

export default function Discover(props) {
  const {auth} = props;
  return (
    <Authenticated auth={auth?.user || ''} >
        <Head title={"Seek & Search"} />
        <div className='pt-20 howitmain whbg'>
            <div className='containerbox'>
                <div className='m-auto px-3' >
                    <h1 className='headingMd text-shadow-black text-center mb-1'>Seek & Search </h1>
                    <p className='text-center text-large'>Search through all wishes and creators to make their dreams come true!</p>
                </div>
                <div className='howWorkTab mt-12 pb-12 mx-auto'>
                    <Tabs defaultActiveKey="2" id="uncontrolled-tab-example" className="mb-3">
                        <Tab eventKey="2" title="Creators" className='px-0'>
                              <IntroVideos />
                        </Tab>
                        <Tab eventKey="1" title="Wishes" className='px-0'>
                              <Allwishes />
                        </Tab>
                    </Tabs>
                </div>
            </div>
            <JoinUs />
        </div>
    </Authenticated>
  )
}
