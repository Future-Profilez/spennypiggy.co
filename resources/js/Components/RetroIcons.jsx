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
      
      {/* Basket count. Black on white, not pink on pink — this badge sits on the
          pink bar. No shadow, per the bar's own rule.
          ⚠️ Sized against the 22px glyph, not the 26px one it was drawn for: at
          20px it crowded the bar's top rule with 8px to spare and read as
          clipped. Width grows for a 2-digit count rather than squashing it. */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1.5 retro-counter border-2 border-black bg-white text-black font-bold h-4 min-w-[16px] px-[3px] flex items-center justify-center rounded-full text-[10px]">
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
