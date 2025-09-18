import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken
          });
          
          localStorage.setItem('access_token', response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/token/', credentials),
  register: (userData) => api.post('/register/', userData),
};

export const patientAPI = {
  getPatients: () => api.get('/patients/'),
  createPatient: (data) => api.post('/patients/', data),
  updatePatient: (id, data) => api.put(`/patients/${id}/`, data),
  deletePatient: (id) => api.delete(`/patients/${id}/`),
};

export const medicalRecordAPI = {
  getRecords: () => api.get('/medical-records/'),
  createRecord: (data) => api.post('/medical-records/', data),
  updateRecord: (id, data) => api.put(`/medical-records/${id}/`, data),
  deleteRecord: (id) => api.delete(`/medical-records/${id}/`),
};

export default api;