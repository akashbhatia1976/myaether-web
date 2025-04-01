// 📁 myaether-web/utils/apiService.js

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;
console.log("🌐 BASE_URL:", BASE_URL);

const TIMEOUT = 60000;

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

// ✅ Web equivalent of getUserDetails
export const getUserDetails = async () => {
  return await fetchWithTimeout(`${BASE_URL}/users/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
};

// ✅ Web equivalent of getReports
export const getReports = async (userId) => {
  return await fetchWithTimeout(`${BASE_URL}/reports/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
};

export {
  fetchWithTimeout,
  getToken,
  getAuthHeaders,
  getAuthFetchOptions,
  BASE_URL
};

// ✅ Upload Report
export const uploadReport = async (userId, reportDate, file, autoCreateUser = false, reportName = "") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("reportDate", reportDate.toISOString().split("T")[0]);
  formData.append("reportName", reportName);
  formData.append("autoCreateUser", autoCreateUser);

  const token = getToken();

  const response = await fetch(`${BASE_URL}/upload/${userId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Upload failed");
  }

  return await response.json();
};


