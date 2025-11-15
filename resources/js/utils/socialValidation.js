import { getPlatform } from './socialPlatforms';

// Ensure URL has protocol
export const ensureProtocol = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

// Remove leading @ from handles
export const stripAt = (value) => {
  if (!value) return '';
  return value.startsWith('@') ? value.slice(1) : value;
};

// Remove u/ prefix from Reddit handles
export const stripRedditPrefix = (value) => {
  if (!value) return '';
  return value.startsWith('u/') ? value.slice(2) : value;
};

// Convert handle or partial URL to canonical URL
export const toCanonicalUrl = (platformId, value) => {
  if (!value) return '';
  
  const platform = getPlatform(platformId);
  if (!platform || !platform.baseUrl) return value;

  // Special case for Discord - never convert to URL
  // Discord now canonicalizes to a URL using baseUrl

  // Special case for Tumblr with subdomain pattern
  if (platformId === 'tumblr') {
    const cleanHandle = stripAt(value.trim());
    return platform.baseUrl.replace('{handle}', cleanHandle);
  }

  // For handle-type platforms, build URL from handle
  if (platform.type === 'handle') {
    let cleanHandle = stripAt(value.trim());
    
    // Special handling for Reddit
    if (platformId === 'reddit') {
      cleanHandle = stripRedditPrefix(cleanHandle);
    }
    
    return platform.baseUrl + cleanHandle;
  }

  // For URL-type platforms, ensure protocol
  if (platform.type === 'url') {
    // If it's already a full URL for the platform, ensure protocol
    if (value.includes(platform.baseUrl.replace('https://', '').replace('http://', ''))) {
      return ensureProtocol(value);
    }
    
    // For partial URLs or handles that should be URLs, build full URL
    return ensureProtocol(value);
  }

  return value;
};

// Validate handle format
export const isValidHandle = (platformId, value, regex) => {
  if (!value) return true; // Empty is valid
  return regex.test(value.trim());
};

// Validate URL format
export const isValidUrl = (platformId, value, regex) => {
  if (!value) return true; // Empty is valid
  
  // Special validation for 'other' platform - generic URL validation
  if (platformId === 'other') {
    try {
      new URL(ensureProtocol(value));
      return true;
    } catch {
      return false;
    }
  }
  
  return regex.test(value.trim());
};

// Get preview URL for handle-type platforms
export const getPreviewUrl = (platformId, value) => {
  if (!value) return null;
  
  const platform = getPlatform(platformId);
  if (!platform || platform.type !== 'handle') {
    return null;
  }
  
  // Handle Tumblr values that may be pasted as full URLs
  if (platformId === 'tumblr' && /^https?:\/\//i.test(value)) {
    const handle = extractHandleFromUrl(platformId, value);
    return toCanonicalUrl(platformId, handle);
  }
  
  return toCanonicalUrl(platformId, value);
};

// Extract handle from URL for display purposes
export const extractHandleFromUrl = (platformId, url) => {
  if (!url) return '';
  
  const platform = getPlatform(platformId);
  if (!platform || platform.type !== 'handle') {
    return url;
  }

  // Special case for Tumblr subdomain
  if (platformId === 'tumblr') {
    // Path-style: https://tumblr.com/<handle>
    const pathMatch = url.match(/https?:\/\/(?:www\.)?tumblr\.com\/([^\/?#]+)/);
    if (pathMatch) return pathMatch[1];
    // Subdomain-style: https://<handle>.tumblr.com
    const subdomainMatch = url.match(/https?:\/\/([^.]+)\.tumblr\.com/);
    return subdomainMatch ? subdomainMatch[1] : url;
  }

  // Special case for Discord canonical URL (users/<handleOrId>)
  if (platformId === 'discord') {
    const match = url.match(/https?:\/\/discord\.(com|app)\/users\/([^\/?#]+)/);
    return match ? match[2] : url;
  }

  // Extract handle from URL
  const baseUrl = platform.baseUrl.replace('https://', '').replace('http://', '');
  const cleanUrl = url.replace(/https?:\/\//, '').replace(/\/$/, '');
  
  if (cleanUrl.startsWith(baseUrl)) {
    const handle = cleanUrl.replace(baseUrl, '');
    return handle || url;
  }
  
  return url;
};

// Main validation function for a platform value
export const validatePlatformValue = (platformId, value) => {
  const platform = getPlatform(platformId);
  if (!platform) {
    return { status: 'invalid', message: 'Unknown platform', canonical: '' };
  }

  const trimmedValue = value?.trim() || '';
  
  // Empty is valid but not submittable
  if (!trimmedValue) {
    return { status: 'empty', message: '', canonical: '' };
  }

  // Check length limits
  if (trimmedValue.length > platform.maxLength) {
    return { 
      status: 'invalid', 
      message: `Maximum ${platform.maxLength} characters allowed`, 
      canonical: '' 
    };
  }

  // Validate format based on platform type
  let isValid = false;
  
  // Allow Tumblr handle inputs pasted as URLs (path or subdomain)
  if (platform.type === 'handle' && platformId === 'tumblr' && /^https?:\/\//i.test(trimmedValue)) {
    const extracted = extractHandleFromUrl(platformId, trimmedValue);
    const handle = extracted?.trim() || '';
    if (!handle) {
      return { status: 'invalid', message: `Invalid ${platform.label} format`, canonical: '' };
    }
    const ok = isValidHandle(platformId, handle, platform.validation);
    if (!ok) {
      return { status: 'invalid', message: `Invalid ${platform.label} format`, canonical: '' };
    }
    const canonical = toCanonicalUrl(platformId, handle);
    return { status: 'valid', message: '', canonical };
  }

  if (platform.type === 'handle') {
    isValid = isValidHandle(platformId, trimmedValue, platform.validation);
  } else if (platform.type === 'url') {
    isValid = isValidUrl(platformId, trimmedValue, platform.validation);
  }

  if (!isValid) {
    return { 
      status: 'invalid', 
      message: `Invalid ${platform.label} format`, 
      canonical: '' 
    };
  }

  // Generate canonical form
  const canonical = toCanonicalUrl(platformId, trimmedValue);
  
  return { 
    status: 'valid', 
    message: '', 
    canonical 
  };
};

// Validate entire form data
export const validateAllPlatforms = (formData) => {
  const results = {};
  let hasValid = false;
  let hasErrors = false;

  Object.keys(formData).forEach(platformId => {
    const result = validatePlatformValue(platformId, formData[platformId]);
    results[platformId] = result;
    
    if (result.status === 'valid') {
      hasValid = true;
    } else if (result.status === 'invalid') {
      hasErrors = true;
    }
  });

  return {
    results,
    // Form is valid when there are no invalid entries.
    // Empty values are allowed (optional fields), so at least one valid field is NOT required.
    isFormValid: !hasErrors,
    hasValidFields: hasValid,
    hasErrors
  };
};

// Get character count info for display
export const getCharacterInfo = (platformId, value) => {
  const platform = getPlatform(platformId);
  if (!platform) return null;

  const length = value?.length || 0;
  const remaining = platform.maxLength - length;
  const isOverLimit = remaining < 0;

  return {
    current: length,
    max: platform.maxLength,
    remaining: Math.max(0, remaining),
    isOverLimit,
    showWarning: remaining < 10 && remaining > 0
  };
};

// Debounce utility for real-time validation
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};