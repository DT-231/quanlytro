import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const parsedToken = JSON.parse(token);
        if (typeof parsedToken === 'object' && parsedToken.access_token) {
           config.headers.Authorization = `Bearer ${parsedToken.access_token}`;
        } 
        else if (typeof parsedToken === 'string') {
           config.headers.Authorization = `Bearer ${parsedToken}`;
        }
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

export default api;

