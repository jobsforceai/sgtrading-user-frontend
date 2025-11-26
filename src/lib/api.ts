import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth';
import { refreshToken } from '@/actions/auth'; // We will create this action

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const { tokens } = useAuthStore.getState();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { tokens, setTokens, logout } = useAuthStore.getState();

      if (!tokens?.refreshToken) {
        logout();
        return Promise.reject(error);
      }

      try {
        const res = await refreshToken(tokens.refreshToken);

        if (res.data) {
          setTokens(res.data);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          processQueue(null, res.data.accessToken);
          return api(originalRequest);
        } else {
          logout(); // <-- LOGOUT ON REFRESH FAILURE
          processQueue(new Error('Token refresh failed'), null);
          return Promise.reject(error);
        }
      } catch (e) {
        logout(); // <-- LOGOUT ON REFRESH FAILURE
        processQueue(e, null);
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
