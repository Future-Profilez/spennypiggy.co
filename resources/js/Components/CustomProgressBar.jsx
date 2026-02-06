import React from 'react';

const CustomProgressBar = ({ now, max, className = '' }) => {
    const percentage = Math.round((now / max) * 100);
    return (
      <div className={`w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden ${className}`}>
        <div className="bg-pink-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
      </div>
    );
};

export default CustomProgressBar;
