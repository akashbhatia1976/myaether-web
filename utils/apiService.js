// 📁 myaether-web/utils/apiService.js
import axios from 'axios';

// Base configuration
const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;
console.log("🌐 BASE_URL:", BASE_URL);

const TIMEOUT = 60000;

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  withCredentials: true, // ✅ Ensures cookies are sent in cross-origin requests
});

// Cookie-compatible token functions (keeping for compatibility)
const getCookie = (name) => {
  if (typeof document === 'undefined') {
    return null; // We're on the server side
  }
  
  const cookies = document.cookie.split(';')
    .map(cookie => cookie.trim())
    .reduce((acc, cookie) => {
      const [key, value] = cookie.split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {});
    
  return cookies[name] || null;
};

// Token helper that works in both client and server contexts
const getToken = () => {
  if (typeof window !== 'undefined') {
    // Client-side: try localStorage first (more reliable cross-domain)
    const localStorageToken = localStorage.getItem("token");
    if (localStorageToken) return localStorageToken;
    
    // Then try cookies
    return getCookie('token') || null;
  }
  
  // Server-side - token should be passed via context in getServerSideProps
  return null;
};

// Add request interceptor to include auth token on all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log("📡 Request:", config.method?.toUpperCase(), config.url);
    console.log("📬 Headers:", config.headers);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for centralized error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error("🔒 Authentication error: Unauthorized");
      
      // Clear invalid credentials
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "healthId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      
      return Promise.reject(new Error("Authentication failed. Please log in again."));
    }
    
    // Get the error message from the response if possible
    const errorMessage = error.response?.data?.message ||
                         `HTTP error: ${error.response?.status || 'unknown'}`;
    
    console.error(`❌ API error:`, errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// ✅ Keep the getAuthHeaders function for compatibility
const getAuthHeaders = () => {
  const token = getToken();
  
  if (!token) {
    console.error("❌ Authentication token is missing");
    throw new Error("Authentication required");
  }
  
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

// ✅ Keep for compatibility
const getAuthFetchOptions = (method = "GET", body = null) => {
  const headers = getAuthHeaders();
  return {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  };
};

// ✅ Core API Calls with Axios
const getUserDetails = async () => {
  console.log("🔐 getUserDetails() using token:", getToken());
  
  try {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  } catch (error) {
    console.error("❌ Failed to get user details:", error.message);
    throw error;
  }
};

const getReports = async (userId) => {
  console.log("📄 getReports() for:", userId);
  
  if (!userId) {
    throw new Error("User ID is required to fetch reports");
  }
  
  try {
    const response = await axiosInstance.get(`/reports/${encodeURIComponent(userId)}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to get reports for user ${userId}:`, error.message);
    throw error;
  }
};

// ✅ Upload Report with Axios
const uploadReport = async (
  userId,
  reportDate,
  file,
  autoCreateUser = false,
  reportName = ""
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);
  formData.append("reportDate", reportDate.toISOString().split("T")[0]);
  formData.append("reportName", reportName);
  formData.append("autoCreateUser", autoCreateUser.toString());

  // Get token explicitly for this request
  const token = getToken();
  if (!token) {
    throw new Error("Authentication required to upload reports");
  }

  try {
    const response = await axiosInstance.post('/upload', formData, {
      headers: {
        // Don't set Content-Type here - axios will set it correctly with boundary for FormData
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("❌ Error uploading report:", error.message);
    throw error;
  }
};

// ✅ Share Report function with Axios
const shareReport = async (payload) => {
  if (!payload.ownerId || !payload.sharedWith || !payload.reportId) {
    throw new Error("Missing required fields for sharing a report");
  }
  
  try {
    const response = await axiosInstance.post('/share/share-report', payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error sharing report:", error.message);
    throw error;
  }
};

// ✅ Share All Reports function with Axios
const shareAllReports = async (payload) => {
  if (!payload.ownerId || !payload.sharedWith) {
    throw new Error("Missing required fields for sharing reports");
  }
  
  try {
    const response = await axiosInstance.post('/share/share-all', payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error sharing all reports:", error.message);
    throw error;
  }
};

// ✅ Get Shared By me Reports with Axios
const getSharedReportsByUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  try {
    const response = await axiosInstance.get(`/share/shared-by/${encodeURIComponent(userId)}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error getting reports shared by user ${userId}:`, error.message);
    throw error;
  }
};

// ✅ Get Reports Shared with me using Axios
const getReportsSharedWithUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  try {
    const response = await axiosInstance.get(`/share/shared-with/${encodeURIComponent(userId)}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error getting reports shared with user ${userId}:`, error.message);
    throw error;
  }
};

// ✅ Revoke Shared Access with Axios
const revokeSharedReport = async (payload) => {
  if (!payload.ownerId || !payload.sharedWith) {
    throw new Error("Missing required fields for revoking shared access");
  }
  
  try {
    const response = await axiosInstance.post('/share/revoke', payload);
    return response.data;
  } catch (error) {
    console.error("❌ Error revoking shared access:", error.message);
    throw error;
  }
};

/**
 * Search reports using NLP (Natural Language Processing)
 * This allows users to search with natural language queries
 * @param {string} userId - The user ID
 * @param {string} query - The natural language query text
 * @returns {Promise<Array>} - Search results matching the query
 */
cconst searchReportsWithNLP = async (userId, query) => {
    if (!userId) {
      throw new Error("User ID is required for search");
    }
    
    if (!query || !query.trim()) {
      throw new Error("Search query cannot be empty");
    }
    
    try {
      // Change 'query' to 'queryText' to match backend expectation
      const response = await axiosInstance.post('/search/nlp', {
        userId,
        queryText: query.trim()  // Changed from 'query' to 'queryText'
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ NLP search failed:`, error.message);
      throw error;
    }
  };

// Keep the original fetchWithTimeout for any legacy code that might use it directly
const fetchWithTimeout = async (url, options = {}) => {
  console.warn("⚠️ fetchWithTimeout is deprecated. Please use Axios methods directly.");
  
  try {
    const method = options.method?.toLowerCase() || 'get';
    const headers = options.headers || {};
    const body = options.body ? JSON.parse(options.body) : undefined;
    
    let response;
    
    // Handle different HTTP methods
    if (method === 'get') {
      response = await axiosInstance.get(url, { headers });
    } else if (method === 'post') {
      response = await axiosInstance.post(url, body, { headers });
    } else if (method === 'put') {
      response = await axiosInstance.put(url, body, { headers });
    } else if (method === 'delete') {
      response = await axiosInstance.delete(url, {
        headers,
        data: body
      });
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ Fetch error (${url}):`, error.message);
    throw error;
  }
};

// ✅ Centralized Export (keeping same exports for compatibility)
export {
  BASE_URL,
  fetchWithTimeout,
  getToken,
  getAuthHeaders,
  getAuthFetchOptions,
  getUserDetails,
  getReports,
  uploadReport,
  shareReport,
  shareAllReports,
  getSharedReportsByUser,
  getReportsSharedWithUser,
  revokeSharedReport,
  searchReportsWithNLP, // Added to centralized exports
  // Export axios instance in case it's needed elsewhere
  axiosInstance
};
