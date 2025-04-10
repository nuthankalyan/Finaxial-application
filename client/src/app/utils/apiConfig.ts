// API URL configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to build API URLs with proper formatting
export const buildApiUrl = (endpoint: string): string => {
  // Clean up the API base URL - remove trailing slashes
  const baseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
    
  // Ensure endpoint starts with a slash
  const formattedEndpoint = endpoint.startsWith('/') 
    ? endpoint 
    : `/${endpoint}`;
    
  // For debugging
  const fullUrl = `${baseUrl}${formattedEndpoint}`;
  console.log('API Request URL:', fullUrl);
  
  return fullUrl;
};

// Add a new helper function:

/**
 * Enhanced fetch function with better error handling for API requests
 */
export const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    
    // Get response as text first to handle HTML responses
    const responseText = await response.text();
    
    // Check if the response is HTML instead of JSON
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error('Received HTML response instead of JSON:', responseText);
      throw new Error('Server returned an HTML page instead of JSON. The API might be unavailable or the URL is incorrect.');
    }
    
    // Parse the text as JSON
    let data;
    try {
      // Handle empty responses (return empty object)
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Server returned an invalid response. Please try again.');
    }
    
    // Handle non-OK responses
    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    // Network errors and other fetch failures
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred during API request');
  }
}; 