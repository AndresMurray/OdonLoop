const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  users: {
    register: `${API_BASE_URL}/users/register/`,
    profile: `${API_BASE_URL}/users/profile/`,
    list: `${API_BASE_URL}/users/list/`,
  },
};

export default API_BASE_URL;
