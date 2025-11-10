// CSRF Token Auto-Refresh Interceptor
// This automatically retries failed requests due to CSRF token mismatches

import axios from 'axios';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for handling CSRF token expiry
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 419 (CSRF token mismatch) and not already retrying
    if (error.response?.status === 419 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return axios(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh CSRF token by calling the csrf-cookie endpoint
        await axios.get('/csrf-cookie');
        processQueue(null);
        
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // If CSRF refresh fails, log the user out or show error
        console.error('CSRF token refresh failed:', refreshError);
        
        // Could redirect to login or show an error message
        // window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axios;