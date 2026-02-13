import { useAlerts } from '@/Components/Alerts';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useRef } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import AddItem from './AddItem';
import CountriesShipping from './CountriesShipping';
import ImageGenerationWithAI from '@/Components/ImageGenerationWithAI';

export default function AddShop({update}) {

   const { auth, user } = usePage().props;
   const { successAlert, errorAlert, errorsHandling } = useAlerts();
   return (
      <>
         <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3 '>
            <AddItem classes="w-full font-bold text-lg shop-start-box px-6 py-6 md:px-8 md:py-12 text-center bg-white rounded-[30px] md:rounded-[40px] " update={update} title='+ Start from scratch' />
            <AddItem classes="w-full font-bold text-lg shop-start-box px-6 py-6 md:px-8 md:py-12 text-center bg-white rounded-[30px] md:rounded-[40px] " update={update} pre_price={9} pre_title="Taking Smart Notes (Ebook)"  pre_description='Master the art of note-taking with this extensive guide. Available in PDF format.'  title='Digital Products' />
            <AddItem classes="w-full font-bold text-lg shop-start-box px-6 py-6 md:px-8 md:py-12 text-center bg-white rounded-[30px] md:rounded-[40px] " update={update} pre_price={10} pre_title="Content Creation Advice"  pre_description='Hop on a Zoom call with me where I’ll spend an hour with you to help you achieve your content creation goals. I’ll also show you the tools I use, and how I grow my audience.'  title='1-on-1 Zoom call' />
         </div>
         <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <AddItem classes="w-full font-bold text-lg shop-start-box px-6 py-6 md:px-8 md:py-12 text-center bg-white rounded-[30px] md:rounded-[40px] " update={update} pre_price={15} pre_title="Instagram Close Friends Stories"  pre_description='For a one-off payment, you can get access to our Close Friends stories on Instagram. This is where we share our daily lives and sneak peeks of the latest projects on a more personal level than we do to the wider Instagram community.'  title='Instagram close friends access' />
            <AddItem classes="w-full font-bold text-lg shop-start-box px-6 py-6 md:px-8 md:py-12 text-center bg-white rounded-[30px] md:rounded-[40px] " update={update} pre_price={30} pre_title="Group Yoga on June 1st"  pre_description='Join the 60-minute group yoga class where we practice Vinyasa. Beginner-friendly.'  title='Ticket for an event' />
         </div>
      </>
  )
}
