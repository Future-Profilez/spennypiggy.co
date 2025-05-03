import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import styled, { keyframes } from 'styled-components';

const slideAnimation = keyframes`
  0% {transform: translateX(0%)}
  100% {transform: translateX(-50%)}
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

const LiveBar = (props) => {

  const [counts, setCounts] = useState();

  useEffect(()=>{
   const reps = props.reps || 10;
   let arr = [];
   for(let i=0; i<reps; i++){
    arr.push(i)
   }  
   setCounts(arr);
  },[]);


  return <>
     
    <div data-aos="fade-up" className={props.classes} >
    <LiveBarWrapper className={`livebar ${props.color ? props.color : "mintbg"} py-3 pb-3 px-2`}>
      <ScrollingContainer>
        <ScrollingContent>
          {counts && counts.map((i)=>{
            return <p className={`${props.textClass ? props.textClass :"mb-0 mx-4 font-GillSans text-uppercase"}`}>{props.text}</p>
          })}
        </ScrollingContent>
      </ScrollingContainer>
    </LiveBarWrapper>
    </div>
    </>
};

export default LiveBar;
