// 📁 myaether-web/utils/apiService.js

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;
console.log("🌐 BASE_URL:", BASE_URL);

const TIMEOUT = 60000;

// Cookie-compatible token functions
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
    // Client-side: try cookies first, then localStorage
    const cookieToken = getCookie('token');
    if (cookieToken) return cookieToken;
    
    return localStorage.getItem("token") || null;
  }
  
  // Server-side - token should be passed via context in getServerSideProps
  return null;
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  const finalOptions = {
    ...options,
    signal: controller.signal,
    credentials: 'include', // ✅ Ensures cookies/tokens are sent in cross-origin requests
    mode: 'cors', // Explicitly state we're doing CORS requests
  };

  console.log("📡 Fetch:", url);
  console.log("📬 Headers:", finalOptions.headers);

  try {
    const response = await fetch(url, finalOptions);

    // Check for authentication errors specifically
    if (response.status === 401) {
      console.error("🔒 Authentication error: Unauthorized");
      // Clear invalid credentials
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      throw new Error("Authentication failed. Please log in again.");
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new Error(`HTTP error: ${response.status}`);
      }
      throw new Error(errorData.message || `HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Fetch error (${url}):`, error.message);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// ✅ Improved Auth Headers with better error handling
const getAuthHeaders = () => {
// Try to get token from multiple sources
   const token = getCookie('token') || localStorage.getItem("token");
  
  
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

const getAuthFetchOptions = (method = "GET", body = null) => {
  const headers = getAuthHeaders();
  return {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  };
};

// ✅ Core API Calls with improved error handling
const getUserDetails = async () => {
  console.log("🔐 getUserDetails() using token:", getToken());
  
  try {
    return await fetchWithTimeout(`${BASE_URL}/users/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
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
    const headers = getAuthHeaders();
    return await fetchWithTimeout(`${BASE_URL}/reports/${encodeURIComponent(userId)}`, {
      method: "GET",
      headers,
    });
  } catch (error) {
    console.error(`❌ Failed to get reports for user ${userId}:`, error.message);
    throw error;
  }
};

// ✅ Upload Report with improved error handling
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

  const token = getToken();
  if (!token) {
    throw new Error("Authentication required to upload reports");
  }

  try {
    const response = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    });

    if (response.status === 401) {
      // Clear invalid credentials
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      throw new Error("Authentication failed. Please log in again.");
    }

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      } else {
        const text = await response.text();
        console.error("❌ Non-JSON response:", text);
        throw new Error("Upload failed. Server returned unexpected response.");
      }
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error uploading report:", error.message);
    throw error;
  }
};

// ✅ Share Report function with improved error handling
const shareReport = async (payload) => {
  if (!payload.ownerId || !payload.sharedWith || !payload.reportId) {
    throw new Error("Missing required fields for sharing a report");
  }
  
  try {
    return await fetchWithTimeout(`${BASE_URL}/share/share-report`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("❌ Error sharing report:", error.message);
    throw error;
  }
};

// ✅ Share All Reports function with improved error handling
const shareAllReports = async (payload) => {
  if (!payload.ownerId || !payload.sharedWith) {
    throw new Error("Missing required fields for sharing reports");
  }
  
  try {
    return await fetchWithTimeout(`${BASE_URL}/share/share-all`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("❌ Error sharing all reports:", error.message);
    throw error;
  }
};

//✅ Get Shared By me Reports
const getSharedReportsByUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  try {
    return await fetchWithTimeout(`${BASE_URL}/share/shared-by/${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error(`❌ Error getting reports shared by user ${userId}:`, error.message);
    throw error;
  }
};

//✅ Get Reports Shared with me
const getReportsSharedWithUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  try {
    return await fetchWithTimeout(`${BASE_URL}/share/shared-with/${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error(`❌ Error getting reports shared with user ${userId}:`, error.message);
    throw error;
  }
};

//✅ Revoke Shared Access
const revokeSharedReport = async (payload) => {
  if (!payload.ownerId || !payload.sharedWith) {
    throw new Error("Missing required fields for revoking shared access");
  }
  
  try {
    return await fetchWithTimeout(`${BASE_URL}/share/revoke`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("❌ Error revoking shared access:", error.message);
    throw error;
  }
};

// ✅ Centralized Export
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
};
