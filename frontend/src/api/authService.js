import ApiClient from './client';
import API_BASE_URL, { API_ENDPOINTS } from './config';

const apiClient = new ApiClient(API_BASE_URL);

// Claves para localStorage
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export const authService = {
  async login(credentials) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.users.login, credentials);
      
      // Guardar tokens y datos del usuario
      if (response.access) {
        localStorage.setItem(TOKEN_KEY, response.access);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      
      // Manejar diferentes formatos de error
      if (error.message) {
        throw new Error(error.message);
      }
      
      if (error.errors) {
        const errorMessages = [];
        for (const [, messages] of Object.entries(error.errors)) {
          if (Array.isArray(messages)) {
            errorMessages.push(...messages);
          } else {
            errorMessages.push(messages);
          }
        }
        throw new Error(errorMessages.join(', '));
      }
      
      if (error.error) {
        throw new Error(error.error);
      }
      
      throw new Error('Error al iniciar sesión');
    }
  },

  logout() {
    // Limpiar todos los datos de autenticación
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Limpiar cualquier dato residual
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('persist.auth');
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getUserData() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post(API_ENDPOINTS.users.refreshToken, {
        refresh: refreshToken,
      });

      if (response.access) {
        localStorage.setItem(TOKEN_KEY, response.access);
      }
      // Si hay rotación de refresh tokens, guardar el nuevo
      if (response.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh);
      }

      return response;
    } catch (error) {
      this.logout();
      throw error;
    }
  },

  async verifyEmail(token, extraData = {}) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.users.verifyEmail, { token, ...extraData });
      return response;
    } catch (error) {
      if (error.error) {
        throw new Error(error.error);
      }
      throw new Error('Error al verificar el email');
    }
  },

  async resendVerificationEmail(email) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.users.resendVerification, { email });
      return response;
    } catch (error) {
      if (error.error) {
        throw new Error(error.error);
      }
      throw new Error('Error al reenviar el email de verificación');
    }
  },
};
