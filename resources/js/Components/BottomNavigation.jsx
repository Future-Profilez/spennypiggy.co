import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    HiHome, 
    HiOutlineHome,
    HiBell, 
    HiOutlineBell,
    HiUserGroup,
    HiOutlineUserGroup,
    HiUser,
    HiOutlineUser,
    HiShoppingBag,
    HiOutlineShoppingBag
} from 'react-icons/hi2';

export default function BottomNavigation({ activeTab = 'home' }) {
    const { url } = usePage();
    
    const navItems = [
        {
            key: 'home',
            label: 'Home',
            href: '/',
            icon: HiOutlineHome,
            activeIcon: HiHome,
        },
        {
            key: 'shop',
            label: 'Shop',
            href: '/shop',
            icon: HiOutlineShoppingBag,
            activeIcon: HiShoppingBag,
        },
        {
            key: 'notifications',
            label: 'Notifications',
            href: '/notifications',
            icon: HiOutlineBell,
            activeIcon: HiBell,
        },
        {
            key: 'profile',
            label: 'Profile',
            href: '/profile',
            icon: HiOutlineUser,
            activeIcon: HiUser,
        }
    ];

    const isActive = (href) => {
        if (href === '/') {
            return url === '/' || url.startsWith('/dashboard');
        }
        return url.startsWith(href);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bottom-navigation border-t border-gray-200 z-50 px-4 py-2">
            <div className="flex justify-around items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const IconComponent = active ? item.activeIcon : item.icon;
                    
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`flex flex-col items-center justify-center px-2 sm:px-3 py-2 rounded-[30px]   transition-all duration-200 ${
                                active 
                                    ? 'text-[#05EFB8] bg-[#05EFB8]/10 scale-105' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                            }`}
                        >
                            <IconComponent 
                                className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 transition-transform duration-200 ${
                                    active ? 'text-[#05EFB8]' : 'text-gray-500'
                                }`} 
                            />
                            <span className={`text-xs font-medium mobile-text-sm ${
                                active ? 'text-[#05EFB8]' : 'text-gray-500'
                            }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
