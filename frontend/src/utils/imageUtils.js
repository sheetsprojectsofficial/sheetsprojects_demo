/**
 * Image Utilities for Google Drive Integration
 * 
 * Professional utility functions for handling Google Drive image URLs
 * Optimized for SEO, performance, and cross-browser compatibility
 * 
 * @author SheetsProjects.com
 * @version 2.0.0
 */

/**
 * Extracts Google Drive file ID from various URL formats
 * Supports sharing URLs, direct links, and embed formats
 * 
 * @param {string} url - Google Drive URL
 * @returns {string|null} File ID or null if not found
 */
const extractGoogleDriveFileId = (url) => {
  if (!url || typeof url !== 'string') return null;

  // Comprehensive patterns for different Google Drive URL formats
  const patterns = [
    // More flexible pattern for file IDs - catches most variations first
    /\/file\/d\/([a-zA-Z0-9_-]{20,})(?:\/|$|\?)/,
    // Standard sharing URL: https://drive.google.com/file/d/FILE_ID/view
    /\/file\/d\/([a-zA-Z0-9_-]{25,})/,
    // Standard sharing URL with parameters: https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
    /\/file\/d\/([a-zA-Z0-9_-]{25,})\/view/,
    // Query parameter format: ?id=FILE_ID
    /[?&]id=([a-zA-Z0-9_-]{25,})/,
    // Direct access format: /d/FILE_ID
    /\/d\/([a-zA-Z0-9_-]{25,})/,
    // Thumbnail format: /thumbnail?id=FILE_ID
    /thumbnail\?id=([a-zA-Z0-9_-]{25,})/,
    // Open URL format: /open?id=FILE_ID
    /open\?id=([a-zA-Z0-9_-]{25,})/,
    // UC export format: uc?id=FILE_ID
    /uc\?.*id=([a-zA-Z0-9_-]{25,})/,
    // Canva export format (sometimes contains Google Drive IDs)
    /canva\.com.*[?&].*([a-zA-Z0-9_-]{25,})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[1].length >= 20) {
      return match[1];
    }
  }

  return null;
};

/**
 * Converts various image URL formats to usable direct URLs
 * Handles Google Drive URLs, Google redirects, and other formats
 *
 * @param {string} url - Original image URL
 * @returns {string} Direct usable URL or original URL
 */
export const convertImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;

  // Handle base64 data URLs (from Google Sheets image uploads)
  if (url.startsWith('data:image/')) {
    return url; // Return base64 data URL as-is
  }

  // Handle Google Drive URLs - use the most reliable format
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    // Use thumbnail format which works best for publicly shared images
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  // Handle Google redirect URLs (e.g., www.google.com/url?...)
  if (url.includes('google.com/url?') && url.includes('url=')) {
    try {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const redirectUrl = urlParams.get('url');
      if (redirectUrl) {
        const decodedUrl = decodeURIComponent(redirectUrl);
        console.log('Decoded redirect URL:', decodedUrl);

        // Check if the decoded URL is a Canva or other design tool URL
        if (decodedUrl.includes('canva.com') || decodedUrl.includes('create') || decodedUrl.includes('logos')) {
          console.warn('Logo URL points to a Canva design page, not a direct image. Please use a direct image URL instead.');
          return null; // Return null to show fallback icon
        }

        // Recursively process the decoded URL in case it's also a Google Drive URL or direct image
        return convertImageUrl(decodedUrl);
      }
    } catch (error) {
      console.warn('Error parsing Google redirect URL:', error);
    }
  }

  // Check for common image file extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const hasImageExtension = imageExtensions.some(ext =>
    url.toLowerCase().includes(ext)
  );

  // If it doesn't look like a direct image URL, warn and return null
  if (!hasImageExtension && !url.includes('googleusercontent.com') && !url.includes('drive.google.com')) {
    console.warn('Logo URL does not appear to be a direct image URL:', url);
    console.warn('Please use a direct image URL (ending in .jpg, .png, etc.) or a Google Drive sharing URL');
    return null; // Return null to show fallback icon
  }

  // Handle other direct image URLs as-is
  return url;
};

/**
 * Converts Google Drive sharing URL to direct download format
 * Maintains original URL if not a Google Drive link
 * 
 * @param {string} url - Original Google Drive URL
 * @returns {string} Direct download URL or original URL
 * @deprecated Use convertImageUrl instead for better compatibility
 */
export const convertGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  return url;
};

/**
 * Generates optimized Google Drive URL for embedding and previews
 * Uses Google's CDN for better performance and CORS compatibility
 * 
 * @param {string} url - Original Google Drive URL
 * @returns {string} Optimized embed-friendly URL
 */
export const getGoogleDrivePreviewUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    // Use lh3.googleusercontent.com for better embedding support
    // Parameters: w1000-h600 (max width/height), p (smart crop), k (no letterboxing), no-nu (no user info)
    return `https://lh3.googleusercontent.com/d/${fileId}=w1000-h600-p-k-no-nu`;
  }
  
  return url;
};

/**
 * Validates if a URL is a Google Drive link
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid Google Drive URL
 */
export const isGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  return url.includes('drive.google.com') && extractGoogleDriveFileId(url) !== null;
};

/**
 * Optimizes image URL for specific use cases
 * 
 * @param {string} url - Original image URL
 * @param {Object} options - Optimization options
 * @param {number} options.width - Desired width
 * @param {number} options.height - Desired height
 * @param {boolean} options.smartCrop - Enable smart cropping
 * @returns {string} Optimized image URL
 */
export const optimizeImageUrl = (url, options = {}) => {
  if (!isGoogleDriveUrl(url)) return url;
  
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  
  const { width = 1000, height = 600, smartCrop = true } = options;
  const cropParam = smartCrop ? 'p' : '';
  const sizeParam = `w${width}-h${height}`;
  
  return `https://lh3.googleusercontent.com/d/${fileId}=${sizeParam}-${cropParam}-k-no-nu`;
};