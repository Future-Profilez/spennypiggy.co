import React from 'react';
import axios from 'axios';

export default function TwitterLogin() {

  const loginTwitter = () => { 
      // axios.get(`/twitter-auth`).then((resp) => {
      //   console.log("resp", resp);
      // }).catch((_err) => {
      //     console.error("error", _err);
      // });
  }

  return (
    <>
      <button onClick={loginTwitter} >Login Twitter</button>
    </>
  )
}
