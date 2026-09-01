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
        // bottom-bar-safe: dead component — imported by nothing (see root CLAUDE.md, PWA section)
        <div className="fixed bottom-0 left-0 right-0 bottom-navigation bg-[#0B0B0F]/90 backdrop-blur-md border-t border-white/10 z-50 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center px-3 py-1.5 rounded-box-sm transition-colors duration-200 ${
                active
                    ? 'text-[#05EFB8] bg-[#05EFB8]/15 font-semibold ring-1 ring-inset ring-[#05EFB8]/40'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
        >
            <IconComponent
                ref={iconRef}
                size={22}
                duration={1.5}
                color="currentColor"
                className="mb-0.5"
            />
            <span className={`text-[12px] leading-tight font-medium ${
                active ? 'text-[#05EFB8]' : 'text-white/60'
            }`}>
                {item.label}
            </span>
        </Link>
    );
};
