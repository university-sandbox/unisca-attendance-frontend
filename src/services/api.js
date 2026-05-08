import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;
const REFRESH_ENDPOINT = "/auth/token/refresh/";

const api = axios.create({
  baseURL: API_URL,
});

function clearSessionAndRedirect() {
  sessionStorage.clear();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refresh = sessionStorage.getItem("refresh_token");

    if (!refresh) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${API_URL}${REFRESH_ENDPOINT}`, {
        refresh,
      });
      sessionStorage.setItem("access_token", data.access);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${data.access}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    }
  },
);

export default api;
