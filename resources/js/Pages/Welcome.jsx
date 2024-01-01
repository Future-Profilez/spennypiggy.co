import { Link, Head } from "@inertiajs/react";
import React from 'react';
import Hero from './home/Hero';
import Guest from '@/Layouts/GuestLayout';
import ComingNext from "./home/ComingNext";
const LiveBar = React.lazy(() => import('@/includes/LiveBar'));
const FunPart = React.lazy(() => import('./home/FunPart'));
const WhyLove = React.lazy(() => import('./home/WhyLove'));
const HappyCreators = React.lazy(() => import('./home/HappyCreators'));
const JoinUs = React.lazy(() => import('@/Components/JoinUs'));

export default function Home({ auth, laravelVersion, user }) {

    return <>
        <LiveBar />
        <Guest auth={auth.user} user={auth.user}>
            <Head title="Welcome" />
            <div>
                <div className="homepromotion"></div>
                <Hero auth={auth} />
                <ComingNext />
                <FunPart />
                <WhyLove />
                <HappyCreators />
                <JoinUs />
            </div>
        </Guest>
    </>
}
