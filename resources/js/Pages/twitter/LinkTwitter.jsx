import React from 'react';
import axios from 'axios';
import { useForm } from '@inertiajs/react';
import LoaderButton from '@/Components/LoaderButton';
import twitter from '../../../assets/img/twitterpost.png';
import Form from 'react-bootstrap/Form';
import { useAlerts } from '@/Components/Alerts';
import { useState } from 'react';

export default function LinkTwitter(props) {

  const { username, auto_tweet } = props;
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
        <p>Link Settings</p>
      </div>
    </div>


    {username ? 
    <div className='step2' >
      <p className='text-center' >Linked Account : @{username}</p>
      <div className='d-flex justify-content-center  my-3' >
        <Form>
          <Form.Check checked={is_linked}
            type="switch" onChange={enableTweet}
            id="custom-switch"
            label="Enable auto tweets for gifts." />
        </Form>
      </div>

      <button onClick={unlinkTwitter} className='btn-pink sm px-5 m-auto d-table mt-4 mb-3' >Unlink Twitter</button>

    </div> : 
    <div className='step1' >
      <p className='text-large text-center px-5 mb-4' >Set up Twitter to auto tweet when you receive a gift.</p>
      <div className='twitter-img' >
        <img src={twitter} alt='twitter' className='w-100 rounded-lg mt-3' />
      </div>
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
