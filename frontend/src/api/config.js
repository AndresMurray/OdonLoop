const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  users: {
    register: `${API_BASE_URL}/users/register/`,
    login: `${API_BASE_URL}/users/login/`,
    profile: `${API_BASE_URL}/users/profile/`,
    list: `${API_BASE_URL}/users/list/`,
    refreshToken: `${API_BASE_URL}/users/token/refresh/`,
  },
};

export default API_BASE_URL;
