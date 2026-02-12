const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  users: {
    register: `/api/usuarios/register/`,
    login: `/api/usuarios/login/`,
    profile: `/api/usuarios/profile/`,
    list: `/api/usuarios/list/`,
    refreshToken: `/api/usuarios/token/refresh/`,
  },
};

export default API_BASE_URL;
