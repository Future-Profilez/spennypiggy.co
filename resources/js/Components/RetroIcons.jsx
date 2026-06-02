import React from 'react';
import { 
  HiOutlineHome, HiHome, 
  HiOutlineShoppingCart, HiShoppingCart, 
  HiOutlineSearch, HiSearch, 
  HiOutlineUser, HiUser 
} from 'react-icons/hi';

// Neo-brutalism Home Icon
export const RetroHomeIcon = ({ size = 26, isActive = false }) => {
  const Icon = isActive ? HiHome : HiOutlineHome;
  return (
    <div className={`retro-icon-wrapper ${isActive ? 'active' : ''}`}>
      <Icon size={size} className="w-full h-full" />
    </div>
  );
};

// Neo-brutalism Cart Icon
export const RetroCartIcon = ({ size = 26, isActive = false, count = 0 }) => {
  const Icon = isActive ? HiShoppingCart : HiOutlineShoppingCart;
  return (
    <div className="relative">
      <div className={`retro-icon-wrapper ${isActive ? 'active' : ''}`}>
        <Icon size={size} className="w-full h-full" />
      </div>
      
      {/* Counter */}
      {count > 0 && (
        <span className="absolute -top-2 -right-2 retro-counter shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black bg-[#FF007F] text-white font-bold w-5 h-5 flex items-center justify-center rounded-full text-[10px]">
          {count}
        </span>
      )}
    </div>
  );
};

// Neo-brutalism Search Icon
export const RetroSearchIcon = ({ size = 26, isActive = false }) => {
  const Icon = isActive ? HiSearch : HiOutlineSearch;
  return (
    <div className={`retro-icon-wrapper ${isActive ? 'active' : ''}`}>
      <Icon size={size} className="w-full h-full" />
    </div>
  );
};

// Neo-brutalism User Icon
export const RetroUserIcon = ({ size = 26, isActive = false }) => {
  const Icon = isActive ? HiUser : HiOutlineUser;
  return (
    <div className={`retro-icon-wrapper ${isActive ? 'active' : ''}`}>
      <Icon size={size} className="w-full h-full" />
    </div>
  );
};
