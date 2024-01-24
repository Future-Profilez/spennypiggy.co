import { useEffect, useState } from 'react';
export default function useWidthCount(){

    const [width, setWidth] = useState();
     function setWid(){ 
        setWidth(window && window.innerWidth); 
    }

    useEffect(() => {
        window && window.addEventListener("resize", setWid);
        setWid();
    }, []);

   return width;  
}