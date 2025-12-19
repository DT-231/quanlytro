import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Biến để lưu promise refresh token (tránh gọi nhiều lần đồng thời)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor - Thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const parsedToken = JSON.parse(token);
        config.headers.Authorization = `Bearer ${parsedToken.access_token}`;
      } catch (e) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Xử lý token hết hạn
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang refresh, thêm request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        // Không có token, redirect về login
        isRefreshing = false;
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/";
        return Promise.reject(error);
      }

      try {
        const parsedToken = JSON.parse(storedToken);
        const refreshToken = parsedToken?.refresh_token;

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        // Gọi API refresh token
        const response = await api.post(
          "/auth/refresh",
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.data?.data?.access_token) {
          const newAccessToken = response.data.data.access_token;

          // Cập nhật token mới vào localStorage
          const updatedToken = {
            ...parsedToken,
            access_token: newAccessToken,
          };
          localStorage.setItem("token", JSON.stringify(updatedToken));

          // Cập nhật header cho request ban đầu
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Process queue với token mới
          processQueue(null, newAccessToken);
          isRefreshing = false;

          // Retry request ban đầu
          return api(originalRequest);
        } else {
          throw new Error("Invalid refresh response");
        }
      } catch (refreshError) {
        // Refresh token thất bại -> logout
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
