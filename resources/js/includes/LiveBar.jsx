import { useEffect, useState } from 'react';

const LiveBar = (props) => {
  const [counts, setCounts] = useState();

  useEffect(() => {
    const reps = props.reps || 10;
    let arr = [];
    for (let i = 0; i < reps; i++) {
      arr.push(i);
    }
    setCounts(arr);
  }, []);

  return (
    <div className={props.classes}>
      <div className={`livebar livebar-wrapper ${props.color ? props.color : "mintbg"} py-3 pb-3 px-2`}>
        <div className="scrolling-container">
          <div className="scrolling-content">
            {counts && counts.map((i) => {
              return <p key={i} className={`${props.textClass ? props.textClass : "mb-0 mx-4 font-GillSans text-uppercase fading whitespace-nowrap"}`}>{props.text}</p>
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveBar;
