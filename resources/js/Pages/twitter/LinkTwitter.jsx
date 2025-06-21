import React from 'react';
import axios from 'axios';
import { useForm } from '@inertiajs/react';
import LoaderButton from '@/Components/LoaderButton';
import twitter from '../../../assets/img/twitterpost.png';
import Form from 'react-bootstrap/Form';
import { useAlerts } from '@/Components/Alerts';
import { useState } from 'react';
import Avatar from '@/includes/Avatar';
import userphoto from "../../../assets/siteicon.png";

export default function LinkTwitter(props) {


  const { username, auto_tweet, auth } = props;
  const { data, setData, get, processing, errors, reset } = useForm();
  const { successAlert, errorAlert, infoAlert, warningAlert } = useAlerts();
  const [is_linked, setIs_linked] = useState(auto_tweet);

  const loginTwitter = (e) => {
      e.preventDefault();
      get(route('x.init')),{
        preserveScroll: true,
        onSuccess: (resp) => {
        },
        onError: (_err) => {
            console.error(_err);
            errorAlert("Failed to change display currency.")
        }
      };
  };

  const unlinkTwitter = (e) => {
    e.preventDefault();
    get(route('unlink-twitter')),{
      preserveScroll: true,
      onSuccess: (resp) => {
        // successAlert("Twitter integration unliked successfully.");
      },
      onError: (_err) => {
        console.error(_err);
        // errorAlert("Failed to change display currency.")
      }
    };
  };

  const enableTweet = (e) => {
    e.preventDefault();
    get(route('auto-tweet-setting')),{
      preserveScroll: true,
      onSuccess: (resp) => {
        // successAlert("Auto tweet for gifts enabled.");
        setIs_linked(!is_linked);
      },
      onError: (_err) => {
          console.error(_err);
          // errorAlert("Failed to change display currency.")
      }
    };
  };

  const Name = auth && auth.user && auth.user.name.replace(' ', '%20');

  const TwitterCard = () => {
    return <div className='t-card bg-light box p-3 rounded-lg shadow-md'>
            <Avatar 
            role={auth && auth.user && auth.user.role}
              profile_status_lock={auth && auth.user && auth.user.profile_status_lock == 2 ? true : false}
              name={auth && auth.user && auth.user.name}
              subhead={`@${auth && auth.user && auth.user.username}`}
              username={auth && auth.user && auth.user.username}
              src={auth && auth.user && auth.user.avatar_url || userphoto}
            />
            <div className='twitter-content mt-2 ps-5 ms-4 ' >
              <p>
              Someone just made a wishlist dream come true, funding a gift worth $50.00! Feel like joining in the fun?
              </p>
              <p className='mt-2' > 
              Check out my wishlist and send me a little surprise 🎁 via <a className='text-primary ms-2 d-inline-block' 
                href={`${window.location.host}/${auth && auth.user && auth.user.username}`} > 
                {`${window.location.host}/${auth && auth.user && auth.user.username}`} 
                </a> using @SpennyPiggy! 🐷
              </p>
              <img className='mt-3' 
              src={`https://ucarecdn.com/8dfae4ba-cd77-406f-8b70-7cf360b4c18c/-/preview/900x900/-/text_align/center/center/-/font/14/000000/-/text/100px30p/100p,100p/spennypiggy.co~s${auth && auth.user && auth.user.username}/-/text_align/center/center/-/font/19/e6ea82/-/text/100px78p/100p,100p/${Name}/`} 
              alt='twitter' />
            </div>
    </div>
  }

  return (
    <>
    <h2 className="text-uppercase font-GillSans pb-4 font-large text-center px-5"> Twitter Integration </h2>
    <div className='twitter-steps' >
      <div className='step-t active'>
        <div className='step-no ' >1</div>
        <p>Link Twitter</p>
      </div>
      <div className='step-saprate'>
      </div>
      <div className={`step-t ${username ? 'active' : ''}`}>
        <div className='step-no' >2</div>
        <p>Settings</p>
      </div>
    </div>


    {username ? 
    <div className='step2' >
      <p className='text-center' >Linked Account : @{username}</p>
      <div className='flex justify-content-center  my-3' >
        <Form>
          <Form.Check checked={is_linked}
            type="switch" onChange={enableTweet}
            id="custom-switch"
            label="Enable auto tweets for gifts." />
        </Form>
      </div>

      <button onClick={unlinkTwitter} className='btn-pink bg-danger sm px-5 m-auto d-table mt-4 mb-3' >Unlink Twitter</button>

    </div> : 
    <div className='step1' >
      <p className='text-large text-center px-5 mb-4' >Set up Twitter to auto tweet when you receive a gift.</p>
      {/* <div className='twitter-img' >
        <img src={twitter} alt='twitter' className='w-100 rounded-lg mt-3' />
      </div> */}

      <TwitterCard />


      <LoaderButton onClick={loginTwitter}
          disabled={processing}
          type='submit'
            className="flex w-100 btn-pink mt-4 lg mx-auto"
            spinnerClassName="fill-red-600" >
            {processing ? "Processing.." : "Link Twitter"}
        </LoaderButton>
    </div>
    }
    </>
  )
}
