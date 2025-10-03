import { useEffect, useRef } from "react";
import { usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";

/**
 * FlashMessenger - Centralized flash message handler
 * 
 * This component handles all Laravel flash messages and validation errors
 * in one place to prevent duplicate toasts from appearing.
 * 
 * Mount this once in each root layout (AuthenticatedLayout, GuestLayout)
 * and remove individual flash handling from page components.
 */
export default function FlashMessenger() {
    const { flash, errors } = usePage().props;
    const { successAlert, errorAlert, warningAlert, infoAlert } = useAlerts();
    
    // Deduplication mechanism to prevent identical messages from showing multiple times
    const lastShownRef = useRef(new Map());
    
    const showMessageIfNew = (message, alertFunction, type) => {
        if (!message) return;
        
        const messageKey = `${type}:${message}`;
        const now = Date.now();
        
        // Remove old entries (older than 3 seconds)
        const cutoff = now - 3000;
        for (const [key, timestamp] of lastShownRef.current.entries()) {
            if (timestamp < cutoff) {
                lastShownRef.current.delete(key);
            }
        }
        
        // Check if we've shown this message recently
        if (!lastShownRef.current.has(messageKey)) {
            lastShownRef.current.set(messageKey, now);
            alertFunction(message);
        }
    };

    useEffect(() => {
        // Handle validation errors
        if (errors) {
            Object.entries(errors).forEach(([key, value]) => {
                showMessageIfNew(value, errorAlert, `validation_${key}`);
            });
        }

        // Handle Laravel flash messages with deduplication
        showMessageIfNew(flash?.success, successAlert, 'flash_success');
        showMessageIfNew(flash?.error, errorAlert, 'flash_error');
        showMessageIfNew(flash?.warning, warningAlert, 'flash_warning');
        showMessageIfNew(flash?.info, infoAlert, 'flash_info');
    }, [flash, errors, successAlert, errorAlert, warningAlert, infoAlert]);

    // This component only provides side effects - no rendering
    return null;
}