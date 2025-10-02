import React from 'react';

// Simple Retro Home Icon
export const RetroHomeIcon = ({ size = 24, isActive = false }) => {
  const mainColor = isActive ? '#05EFB8' : '#999';
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
      className={`retro-icon ${isActive ? 'active' : ''}`}
    >
      {/* Simple house outline */}
      <path 
        d="M3 12L12 3L21 12V20C21 20.5 20.5 21 20 21H4C3.5 21 3 20.5 3 20V12Z" 
        fill="none"
        stroke={mainColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Door */}
      <path 
        d="M9 21V15C9 14.5 9.5 14 10 14H14C14.5 14 15 14.5 15 15V21" 
        fill="none"
        stroke={mainColor}
        strokeWidth="2"
      />
      
      {/* Window */}
      <rect x="16" y="10" width="2" height="2" fill={mainColor} rx="0.5" />
    </svg>
  );
};

// Simple Retro Cart Icon
export const RetroCartIcon = ({ size = 24, isActive = false, count = 0 }) => {
  const mainColor = isActive ? '#F94F97' : '#999';
  
  return (
    <div className="relative">
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none"
        className={`retro-icon ${isActive ? 'active' : ''}`}
      >
        {/* Simple cart outline */}
        <path 
          d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V16.5M9 19.5C9.8 19.5 10.5 20.2 10.5 21S9.8 22.5 9 22.5 7.5 21.8 7.5 21 8.2 19.5 9 19.5ZM20 19.5C20.8 19.5 21.5 20.2 21.5 21S20.8 22.5 20 22.5 18.5 21.8 18.5 21 19.2 19.5 20 19.5Z" 
          stroke={mainColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Counter */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 retro-counter animate-pulse">
          {count}
        </span>
      )}
    </div>
  );
};

// Simple Retro Search Icon
export const RetroSearchIcon = ({ size = 24, isActive = false }) => {
  const mainColor = isActive ? '#E6EA7B' : '#999';
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
      className={`retro-icon ${isActive ? 'active' : ''}`}
    >
      {/* Simple search magnifying glass */}
      <circle 
        cx="11" 
        cy="11" 
        r="8" 
        fill="none"
        stroke={mainColor}
        strokeWidth="2"
      />
      
      {/* Search handle */}
      <path 
        d="M21 21L16.65 16.65" 
        stroke={mainColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Simple Retro User Icon
export const RetroUserIcon = ({ size = 24, isActive = false }) => {
  const mainColor = isActive ? '#8C52FF' : '#999';
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
      className={`retro-icon ${isActive ? 'active' : ''}`}
    >
      {/* Simple user profile */}
      <path 
        d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" 
        stroke={mainColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Head */}
      <circle 
        cx="12" 
        cy="7" 
        r="4" 
        stroke={mainColor}
        strokeWidth="2"
      />
    </svg>
  );
};
