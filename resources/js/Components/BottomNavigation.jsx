import React, { useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    HouseIcon,
    ShoppingBagIcon,
    BellIcon,
    UserIcon
} from "@animateicons/react/lucide";

export default function BottomNavigation({ activeTab = 'home' }) {
    const { url } = usePage();
    
    const navItems = [
        {
            key: 'home',
            label: 'Home',
            href: '/',
            icon: HouseIcon,
        },
        {
            key: 'shop',
            label: 'Shop',
            href: '/shop',
            icon: ShoppingBagIcon,
        },
        {
            key: 'notifications',
            label: 'Notifications',
            href: '/notifications',
            icon: BellIcon,
        },
        {
            key: 'profile',
            label: 'Profile',
            href: '/profile',
            icon: UserIcon,
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
                {navItems.map((item) => (
                    <NavItem key={item.key} item={item} active={isActive(item.href)} />
                ))}
            </div>
        </div>
    );
}

const NavItem = ({ item, active }) => {
    const iconRef = useRef(null);
    const timeoutRef = useRef(null);
    const IconComponent = item.icon;

    useEffect(() => {
        const startLoop = () => {
            if (iconRef.current) {
                iconRef.current.startAnimation?.();
            }
            // Schedule next animation with some randomness (4-7 seconds)
            const nextDelay = 4000 + Math.random() * 3000;
            timeoutRef.current = setTimeout(startLoop, nextDelay);
        };
        
        // Initial random delay to stagger animations
        const initialDelay = Math.random() * 3000;
        const initialTimeout = setTimeout(startLoop, initialDelay);
        
        return () => {
            clearTimeout(initialTimeout);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);
    
    return (
        <Link
            href={item.href}
            onMouseEnter={() => iconRef.current?.startAnimation?.()}
            className={`flex flex-col items-center justify-center px-2 sm:px-3 py-2 rounded-[30px]    transition-all duration-200 ${
                active 
                    ? 'text-[#05EFB8] bg-[#05EFB8]/10 scale-105' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
        >
            <IconComponent 
                ref={iconRef}
                size={24}
                duration={1.5}
                color="currentColor"
                className={`mb-1 transition-transform duration-200 ${
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
};
