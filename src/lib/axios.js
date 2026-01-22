import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";

const api = axios.create({
  baseURL: BASE_URL,
}); 

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Export/Import API functions
export const exportTasks = async (format) => {
  try {
    const response = await api.get(`/tasks/export/${format}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const importTasks = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/tasks/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export default api;
