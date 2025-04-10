// 📁 myaether-web/utils/apiService.js
import axiosInstance from "./axiosInstance";

// Cookie-compatible token functions (keeping for compatibility)
const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';').map(cookie => cookie.trim()).reduce((acc, cookie) => {
    const [key, value] = cookie.split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {});
  return cookies[name] || null;
};

const getToken = () => {
  if (typeof window !== 'undefined') {
    const localStorageToken = localStorage.getItem("token");
    if (localStorageToken) return localStorageToken;
    return getCookie('token') || null;
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getToken();
  if (!token) throw new Error("Authentication required");
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

const getUserDetails = async () => {
  const response = await axiosInstance.get('/users/me');
  return response.data;
};

const getReports = async (userId) => {
  if (!userId) throw new Error("User ID is required to fetch reports");
  const response = await axiosInstance.get(`/reports/${encodeURIComponent(userId)}`);
  return response.data;
};

const uploadReport = async (userId, reportDate, file, autoCreateUser = false, reportName = "") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);
  formData.append("reportDate", reportDate.toISOString().split("T")[0]);
  formData.append("reportName", reportName);
  formData.append("autoCreateUser", autoCreateUser.toString());
  const token = getToken();
  const response = await axiosInstance.post('/upload', formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

const shareReport = async (payload) => {
  const response = await axiosInstance.post('/share/share-report', payload);
  return response.data;
};

const shareAllReports = async (payload) => {
  const response = await axiosInstance.post('/share/share-all', payload);
  return response.data;
};

//const getSharedReportsByUser = async (userId) => {
//  const response = await axiosInstance.get(`/share/shared-by/${encodeURIComponent(userId)}`);
//  return response.data;
//};

const getSharedReportsByUser = async (userId) => {
  if (!userId) throw new Error("User ID is required");
  const token = getToken();
  console.log("📦 Token at fetch time (shared-by):", token); // 👈 log to check if token is being passed, or its null
    
  if (!token) throw new Error("Token is missing");

  const response = await axiosInstance.get(
    `/share/shared-by/${encodeURIComponent(userId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    }
  );

  return response.data;
};


const getReportsSharedWithUser = async (userId) => {
  if (!userId) throw new Error("User ID is required");

  const token = getToken();
  console.log("📦 Token at fetch time (shared-with):", token); // 👈 Debug log

  if (!token) throw new Error("Token is missing");

  const response = await axiosInstance.get(
    `/share/shared-with/${encodeURIComponent(userId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    }
  );

  return response.data;
};


const revokeSharedReport = async (payload) => {
  const response = await axiosInstance.post('/share/revoke', payload);
  return response.data;
};

const searchReportsWithNLP = async (userId, query) => {
  const response = await axiosInstance.post('/search/nlp', { userId, queryText: query.trim() });
  return response.data;
};

const getReportParameters = async (userId, reportId) => {
  const reports = await getReports(userId);
  const report = reports.find(r => (r._id === reportId || r.reportId === reportId));
  return report?.extractedParameters || [];
};

const countSharedReports = async (userId) => {
  const sharedReports = await getSharedReportsByUser(userId);
  return sharedReports.length || 0;
};

const extractNumericValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    if (value.$numberDouble) return parseFloat(value.$numberDouble);
    if (value.$numberInt) return parseInt(value.$numberInt);
    if (value.$numberLong) return parseInt(value.$numberLong);
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsedValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (!isNaN(parsedValue)) return parsedValue;
  }
  return null;
};

const parseReferenceRange = (rangeString) => {
  if (!rangeString || typeof rangeString !== 'string') return [null, null];
  const dashMatch = rangeString.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
  if (dashMatch) return [parseFloat(dashMatch[1]), parseFloat(dashMatch[2])];
  const aboveMatch = rangeString.match(/above\s+(\d+\.?\d*)/i);
  if (aboveMatch) return [parseFloat(aboveMatch[1]), Infinity];
  const belowMatch = rangeString.match(/below\s+(\d+\.?\d*)/i);
  if (belowMatch) return [0, parseFloat(belowMatch[1])];
  return [null, null];
};

const isAbnormalValue = (value, referenceRange) => {
  const numValue = extractNumericValue(value);
  if (numValue === null) return false;
  const [min, max] = parseReferenceRange(referenceRange);
  if (min === null || max === null) return false;
  return numValue < min || numValue > max;
};

const countAbnormalParameters = (reports) => {
  return reports?.reduce((count, report) => {
    return count + (report.extractedParameters?.filter(param => param.value && param.referenceRange && isAbnormalValue(param.value, param.referenceRange)).length || 0);
  }, 0);
};

export const formatReportsForTimeline = async (reports, userId) => {
  if (!reports || !reports.length || !userId) return [];
  const timelineReports = [];
  for (const report of reports.slice(0, 10)) {
    try {
      const reportId = report._id || report.reportId;
      const response = await axiosInstance.get(`/reports/${userId}/${reportId}`);
      if (response.data?.extractedParameters) {
        timelineReports.push({ ...report, reportId, extractedParameters: response.data.extractedParameters });
      }
    } catch (error) {
      console.error(`Error fetching details for report ${report._id}: ${error.message}`);
    }
  }
  return timelineReports;
};

const fetchWithTimeout = async (url, options = {}) => {
  const method = options.method?.toLowerCase() || 'get';
  const headers = options.headers || {};
  const body = options.body ? JSON.parse(options.body) : undefined;
  const requestMap = {
    get: () => axiosInstance.get(url, { headers }),
    post: () => axiosInstance.post(url, body, { headers }),
    put: () => axiosInstance.put(url, body, { headers }),
    delete: () => axiosInstance.delete(url, { headers, data: body }),
  };
  if (!requestMap[method]) throw new Error(`Unsupported method: ${method}`);
  const response = await requestMap[method]();
  return response.data;
};

export const getReportsWithParameters = async (userId) => {
  const response = await axiosInstance.get(`/reports/${userId}/withParameters`);
  return response.data;
};

const getConfidenceScore = async (reportId) => {
  const response = await axiosInstance.get(`/confidence-scores/${reportId}`);
  return response.data.data;
};

const submitConfidenceFeedback = async (reportId, feedback) => {
  const response = await axiosInstance.post(`/confidence-scores/feedback/${reportId}`, feedback);
  return response.data;
};

export {
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
  getReportParameters,
  countSharedReports,
  extractNumericValue,
  parseReferenceRange,
  isAbnormalValue,
  countAbnormalParameters,
  getConfidenceScore,
  submitConfidenceFeedback,
  axiosInstance
};

