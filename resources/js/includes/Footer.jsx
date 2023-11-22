import React from 'react'
import footlogo from '../../assets/img/footlogo.png';
import { Link } from '@inertiajs/react';
import Nocontent from './Nocontent';
import {Helmet} from "react-helmet";
import { useEffect } from 'react';
import ContentPrefrences from './ContentPrefrences';

export default function Footer(props) {

  const {auth} = props;

  const display = () => {
    window && window.displayPreferenceModal();
    return false;
  }

  useEffect(()=>{
       if(auth){
         window.intercomSettings = {
            "api_base" : "https://api-iam.intercom.io",
            "app_id": "xomg14o9",
            "name": auth && auth?.name, // Full name
            "email": auth && auth?.email, // Email address
            "created_at": auth && auth?.createdAt // Signup date as a Unix timestamp
          };
        (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/xomg14o9';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
       } 
    },[auth && auth?.name]);

    useEffect(()=>{
        window.dataLayer = window.dataLayer || [];
        function gtag(){
          dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', 'AW-11395921981');
    },[]);

  return <>
    <Helmet>
      {/* <head> */}
        <script async type="text/javascript" src="https://app.termly.io/embed.min.js"
        data-auto-block="on" data-website-uuid="ced8ded9-995d-471a-bf54-880b8c679a81" ></script>
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-11395921981"></script>
    </Helmet>
    <div>
        <div className='footer'>
          <div className='containerbox'>
            <div className='footlogo'>
              <Link href="/" >
                <img src={footlogo} alt="img" />
              </Link>
            </div>

            <div className='footlinksbox'>
              <div className='footlinks'>
                <ul>
                  <li><a target='_blank' href="https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6" >Privacy Policy</a></li>
                  <li><a target='_blank' href="https://app.termly.io/document/cookie-policy/45944c26-6e99-4065-833a-8fa224fb8e20" >Cookie Policy</a></li>
                  <li><a target='_blank' href="https://app.termly.io/document/acceptable-use/458f5fac-0c41-406f-a02f-b50adff1ec9c" >Acceptable Use Policy</a></li>
                  <li><a target='_blank' href="https://app.termly.io/notify/696baafc-17cd-4a28-b758-a8f597cf2ad6" >DSAR Form</a></li>
                  <li><Link href={route("how-it-works")} >How it works</Link></li>
                  <li><Link href={route("terms-and-conditions")} >Terms</Link></li>
                  <li> <ContentPrefrences classes='m-auto d-table' /> </li>
                </ul>
              </div>
          </div>
        </div>
        <div className='copyright'>Copyright &copy; 2023 Spenny Piggy</div>
      </div>
    </div>
  </>
}
