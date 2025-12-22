
/**
 * Tracks search clicks using Beacon API for reliability during navigation.
 * 
 * @param {string|number} creator_id - The ID of the creator
 * @param {string} creator_username - The username of the creator
 */
export const trackSearchClick = (creator_id, creator_username) => {
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const formData = new FormData();
        
        if (creator_id) formData.append('creator_id', creator_id);
        if (creator_username) formData.append('creator_username', creator_username);
        if (csrfToken) formData.append('_token', csrfToken);

        const url = '/analytics/search-click';
        
        // Use sendBeacon if available for reliable delivery during navigation
        if (navigator.sendBeacon) {
            navigator.sendBeacon(url, formData);
        } else {
            // Fallback for older browsers
            fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': csrfToken
                },
                keepalive: true
            }).catch(e => console.error('Fetch analytics failed', e));
        }
    } catch (e) {
        console.error('Analytics tracking failed', e);
    }
};
