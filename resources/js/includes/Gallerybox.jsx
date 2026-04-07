import { useState } from "react";
export default function Gallerybox({images}) {
	return (
		<>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images && images.map((p, i)=>{ 
          return <>
          <div>
              <img className="h-auto max-w-full rounded-[30px]  " src={p} alt="" />
          </div>
          </> 
        })}
      </div>
		 </>
	);
}
