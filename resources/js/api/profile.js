import axios from 'axios';

/**
 * Get profile posts with pagination and filtering
 * @param {string|number} userId - User ID or username
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.perPage - Posts per page (default: 10, max: 50)
 * @param {string} options.filter - Filter type: 'all', 'supporters', 'members', 'subscribers', 'shoutouts' (default: 'all')
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getProfilePosts = async (userId, options = {}) => {
    const {
        page = 1,
        perPage = 10,
        filter = 'all'
    } = options;

    try {
        const response = await axios.get(`/api/profile/${userId}/posts`, {
            params: {
                page,
                per_page: perPage,
                filter
            },
            timeout: 15000, // 15 second timeout
        });

        if (response.data.success) {
            return {
                data: response.data.data,
                pagination: response.data.pagination,
                filter: response.data.filter,
                success: true
            };
        } else {
            throw new Error(response.data.message || 'Failed to fetch posts');
        }
    } catch (error) {
        console.error('Error fetching profile posts:', error);
        
        // Handle different error types
        if (error.response?.status === 404) {
            throw new Error('User not found');
        } else if (error.response?.status === 403) {
            throw new Error('Access denied to this profile');
        } else if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout - please try again');
        } else {
            throw new Error(error.message || 'Network error occurred');
        }
    }
};

/**
 * Load more posts (helper for pagination)
 * @param {string|number} userId - User ID or username
 * @param {number} nextPage - Next page to load
 * @param {Object} options - Query options (same as getProfilePosts)
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const loadMorePosts = async (userId, nextPage, options = {}) => {
    return getProfilePosts(userId, {
        ...options,
        page: nextPage
    });
};

/**
 * Get posts for a specific filter (resets to page 1)
 * @param {string|number} userId - User ID or username  
 * @param {string} filter - Filter type
 * @param {Object} options - Additional query options
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getFilteredPosts = async (userId, filter, options = {}) => {
    return getProfilePosts(userId, {
        ...options,
        filter,
        page: 1 // Always reset to first page when filtering
    });
};