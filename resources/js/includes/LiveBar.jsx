import React from 'react';
import styled, { keyframes } from 'styled-components';

const slideAnimation = keyframes`
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-50%);
  }
`;

const LiveBarWrapper = styled.div`
  position: relative;
  overflow: hidden;
`;

const ScrollingContainer = styled.div`
  white-space: nowrap;
  animation: ${slideAnimation} 18s linear infinite; 
  display: flex;
`;

const ScrollingContent = styled.div`
  display: flex;
  margin-right: 2rem; 
`;

const LiveBar = () => {
  return (
    <div className='pb-2 pb-md-0 blackbg' >
    <LiveBarWrapper className="livebar mintbg py-3 pb-2 px-2">
      <style>{`
         .livebar p{font-size:18px;text-transform:uppercase;}
         @media(max-width:575px){
            .livebar p{font-size:15px;}
         }
      `}</style>
      <ScrollingContainer>
        <ScrollingContent>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
          <p className="mb-0 mx-3 font-GillSans text-uppercase">🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨</p>
        </ScrollingContent>
      </ScrollingContainer>
    </LiveBarWrapper>
    </div>
  );
};

export default LiveBar;
