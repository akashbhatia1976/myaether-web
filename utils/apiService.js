// 📁 myaether-web/utils/apiService.js

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;
console.log("🌐 BASE_URL:", BASE_URL);

const TIMEOUT = 60000;

// ✅ Utility: Fetch with timeout (good for external APIs or fallback usage)
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });

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

// ✅ Auth Helpers
const getToken = () => localStorage.getItem("token");

const getAuthHeaders = () => {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

const getAuthFetchOptions = (method = "GET", body = null) => {
  const headers = {
    ...getAuthHeaders(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  return {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  };
};

// ✅ Core API Calls
const getUserDetails = async () => {
  return await fetchWithTimeout(`${BASE_URL}/users/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
};

const getReports = async (userId) => {
  return await fetchWithTimeout(`${BASE_URL}/reports/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
};

// ✅ Upload Report (FormData with file)
const uploadReport = async (
  userId,
  reportDate,
  file,
  autoCreateUser = false,
  reportName = ""
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId); // ✅ needed by backend
  formData.append("reportDate", reportDate.toISOString().split("T")[0]);
  formData.append("reportName", reportName);
  formData.append("autoCreateUser", autoCreateUser.toString()); // ✅ ensure string

  const token = getToken();

  const response = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // ⚠️ Don't manually set Content-Type for FormData
    },
    body: formData,
  });

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
  uploadReport
};

// ✅ Share Report function
export const shareReport = async (payload) => {
  return await fetchWithTimeout(`${BASE_URL}/share/share-report`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

// ✅ Share All Reports function
export const shareAllReports = async (payload) => {
  return await fetchWithTimeout(`${BASE_URL}/share/share-all`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};



//✅ Get Shared By me Reports
export const getSharedReportsByUser = async (userId) => {
  return await fetchWithTimeout(`${BASE_URL}/share/shared-by/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
};

//✅ Get  Reports Shared with me
export const getReportsSharedWithUser = async (userId) => {
  return await fetchWithTimeout(`${BASE_URL}/share/shared-with/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
};

//✅ Revoke Shared Access
export const revokeSharedReport = async (payload) => {
  return await fetchWithTimeout(`${BASE_URL}/share/revoke`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};



