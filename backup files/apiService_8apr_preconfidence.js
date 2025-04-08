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
const searchReportsWithNLP = async (userId, query) => {
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

/**
 * Get parameters for a specific report
 * This is a client-side implementation since there's no direct endpoint
 * @param {string} userId - The user ID
 * @param {string} reportId - The report ID
 * @returns {Promise<Array>} - Array of parameters
 */
const getReportParameters = async (userId, reportId) => {
  if (!userId || !reportId) {
    throw new Error("User ID and Report ID are required");
  }
  
  try {
    // First, get all reports for user
    const reports = await getReports(userId);
    
    // Find the specific report
    const report = reports.find(r => (r._id === reportId || r.reportId === reportId));
    
    if (!report) {
      console.error(`Report ${reportId} not found for user ${userId}`);
      return [];
    }
    
    // Extract parameters
    return report.extractedParameters || [];
  } catch (error) {
    console.error(`❌ Error getting parameters for report ${reportId}:`, error.message);
    return [];
  }
};

/**
 * Count shared reports for a user
 * @param {string} userId - The user ID
 * @returns {Promise<number>} - Count of shared reports
 */
const countSharedReports = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  try {
    // Get reports shared by this user
    const sharedReports = await getSharedReportsByUser(userId);
    return sharedReports.length || 0;
  } catch (error) {
    console.error(`❌ Error counting shared reports for user ${userId}:`, error.message);
    return 0;
  }
};

/**
 * Extract numeric value from MongoDB formatted values
 * @param {any} value - Value to extract number from
 * @returns {number|null} - Extracted number or null
 */
const extractNumericValue = (value) => {
  if (value === null || value === undefined) return null;
  
  // Handle MongoDB number formats
  if (typeof value === 'object') {
    if (value.$numberDouble) return parseFloat(value.$numberDouble);
    if (value.$numberInt) return parseInt(value.$numberInt);
    if (value.$numberLong) return parseInt(value.$numberLong);
  }
  
  // Handle direct numeric values
  if (typeof value === 'number') return value;
  
  // Try to parse string values
  if (typeof value === 'string') {
    const parsedValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (!isNaN(parsedValue)) return parsedValue;
  }
  
  return null;
};

/**
 * Parse reference range string into min and max values
 * @param {string} rangeString - Reference range string
 * @returns {Array} - [min, max] values
 */
const parseReferenceRange = (rangeString) => {
  if (!rangeString || typeof rangeString !== 'string') return [null, null];
  
  // Handle common reference range formats
  const dashMatch = rangeString.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
  if (dashMatch) {
    return [parseFloat(dashMatch[1]), parseFloat(dashMatch[2])];
  }
  
  // Handle "Normal: Above X" format
  const aboveMatch = rangeString.match(/above\s+(\d+\.?\d*)/i);
  if (aboveMatch) {
    return [parseFloat(aboveMatch[1]), Infinity];
  }
  
  // Handle "Normal: Below X" format
  const belowMatch = rangeString.match(/below\s+(\d+\.?\d*)/i);
  if (belowMatch) {
    return [0, parseFloat(belowMatch[1])];
  }
  
  return [null, null];
};

/**
 * Check if a value is abnormal based on its reference range
 * @param {any} value - Value to check
 * @param {string} referenceRange - Reference range string
 * @returns {boolean} - True if abnormal, false otherwise
 */
const isAbnormalValue = (value, referenceRange) => {
  const numValue = extractNumericValue(value);
  if (numValue === null) return false;
  
  const [min, max] = parseReferenceRange(referenceRange);
  if (min === null || max === null) return false;
  
  return numValue < min || numValue > max;
};

/**
 * Count abnormal parameters in an array of reports
 * @param {Array} reports - Array of report objects
 * @returns {number} - Count of abnormal parameters
 */
const countAbnormalParameters = (reports) => {
  if (!reports || !Array.isArray(reports)) return 0;
  
  let abnormalCount = 0;
  
  reports.forEach(report => {
    if (!report.extractedParameters || !Array.isArray(report.extractedParameters)) return;
    
    report.extractedParameters.forEach(param => {
      if (!param.value || !param.referenceRange) return;
      
      if (isAbnormalValue(param.value, param.referenceRange)) {
        abnormalCount++;
      }
    });
  });
  
  return abnormalCount;
};

/**
 * Format reports data for the timeline
 * @param {Array} reports - Array of report objects
 * @returns {Array} - Formatted reports for timeline
 */
// Update this function to use async/await to fetch detailed reports
export const formatReportsForTimeline = async (reports, userId) => {
  if (!reports || !reports.length || !userId) {
    console.log("Missing required data for timeline");
    return [];
  }
  
  console.log(`Formatting ${reports.length} reports for timeline`);
  
  // Create timeline reports by fetching detailed report data
  const timelineReports = [];
  
  // Process only up to 10 reports to avoid too many requests
  for (const report of reports.slice(0, 10)) {
    try {
      const reportId = report._id || report.reportId;
      // Fetch the detailed report to get parameters
      const response = await axiosInstance.get(`/reports/${userId}/${reportId}`);
      
      if (response.data && response.data.extractedParameters) {
        timelineReports.push({
          ...report,
          reportId: reportId,
          extractedParameters: response.data.extractedParameters
        });
      }
    } catch (error) {
      console.error(`Error fetching details for report in timeline: ${error.message}`);
    }
  }
  
  console.log(`Created ${timelineReports.length} reports for timeline with parameters`);
  return timelineReports;
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

//ReportWithParameters
export const getReportsWithParameters = async (userId) => {
  try {
    console.log(`📡 Request: GET /reports/${userId}/withParameters`);
    const response = await fetch(`${BASE_URL}/reports/${userId}/withParameters`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📦 Reports with parameters: ${data.length}`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching reports with parameters:', error);
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
  searchReportsWithNLP,
  // New utilities for real data
  getReportParameters,
  countSharedReports,
  extractNumericValue,
  parseReferenceRange,
  isAbnormalValue,
  countAbnormalParameters,
    
  // Export axios instance in case it's needed elsewhere
  axiosInstance
};
