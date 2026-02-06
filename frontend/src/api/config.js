const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  users: {
    register: `/api/users/register/`,
    login: `/api/users/login/`,
    profile: `/api/users/profile/`,
    list: `/api/users/list/`,
    refreshToken: `/api/users/token/refresh/`,
  },
};

export default API_BASE_URL;
