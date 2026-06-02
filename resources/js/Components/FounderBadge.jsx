import React from 'react';
import { FaCrown } from 'react-icons/fa';
import { usePage } from '@inertiajs/react';

export default function FounderBadge({ 
    size = 'md', 
    showText = true, 
    icon = false, classes,
    className = '',
    variant = 'default' 
}) {
    const { programStats } = usePage().props;
    const qualificationDays = programStats?.qualificationDays || 30;
    const minEarnings = programStats?.minEarnings || 2500;
    const sizeClasses = {
        sm: {
            icon: 'w-3 h-3',
            text: 'text-xs',
            container: 'px-2 py-1 gap-1'
        },
        md: {
            icon: 'w-4 h-4',
            text: 'text-sm',
            container: 'px-3 py-1.5 gap-1.5'
        },
        lg: {
            icon: 'w-5 h-5',
            text: 'text-base',
            container: 'px-4 py-2 gap-2'
        }
    };

    const variantClasses = {
        default: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-lg',
        minimal: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        dark: 'bg-gradient-to-r from-yellow-600 via-yellow-700 to-yellow-800 text-white',
        outline: 'border-2 border-yellow-500 text-yellow-600 bg-transparent hover:bg-yellow-50'
    };

    const currentSize = sizeClasses[size];
    const currentVariant = variantClasses[variant];

    return <>
    {icon ? 
        <FaCrown className={`${classes} ms-1 text-yellow-500`}  />
        :
        <span 
            className={`
                inline-flex items-center rounded-full font-semibold transition-all duration-200
                ${currentSize.container}
                ${currentVariant}
                ${className}
            `}
            title={`SpennyPiggy Founder - Earned £${minEarnings}+ in first ${qualificationDays} days`}
        >
            <FaCrown className={`${currentSize.icon} ${variant === 'outline' ? 'text-[#0056ff]' : ''}`} />
            {showText && (
                <span className={`font-bold ${currentSize.text}`}>
                    FOUNDER
                </span>
            )}
        </span>
    }
    </>
}