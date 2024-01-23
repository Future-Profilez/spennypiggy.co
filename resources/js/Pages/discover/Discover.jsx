import React from 'react'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Head  } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
const JoinUs = React.lazy(() => import('@/Components/JoinUs'));
const Allwishes = React.lazy(() => import('./AllWishes'));
const IntroVideos = React.lazy(() => import('./IntrosVideos'));

export default function Discover(props) {
  const {auth} = props;
  return (
    <Authenticated auth={auth?.user || ''} >
        <Head title={"How it works"} />
        <div className='pt-20 howitmain whbg'>
            <div className='containerbox'>
                <h2 className='headingMd text-shadow-black text-center mb-1'>Seek & Search </h2>
                <p className='text-center text-large'>Search through all wishes and creators to make their dreams come true!</p>
                <div className='howWorkTab mt-12 pb-12 mx-auto'>
                    <Tabs defaultActiveKey="1" id="uncontrolled-tab-example" className="mb-3">
                        <Tab eventKey="1" title="Wishes" className='px-0'>
                              <Allwishes />
                        </Tab>
                        <Tab eventKey="2" title="Creators" className='px-0'>
                              <IntroVideos />
                        </Tab>
                    </Tabs>   
                </div>
            </div>  
            <JoinUs />
        </div>
    </Authenticated>
  )
}