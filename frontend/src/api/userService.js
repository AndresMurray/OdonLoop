import ApiClient from './client';
import API_BASE_URL, { API_ENDPOINTS } from './config';

const apiClient = new ApiClient(API_BASE_URL);

export const userService = {
  async register(userData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.users.register, userData);
      return response;
    } catch (error) {
      // Formatear errores del backend
      if (error.errors) {
        const errorMessages = [];
        for (const [field, messages] of Object.entries(error.errors)) {
          if (Array.isArray(messages)) {
            errorMessages.push(...messages);
          } else {
            errorMessages.push(messages);
          }
        }
        throw new Error(errorMessages.join(', '));
      }
      throw error;
    }
  },

  async getProfile() {
    return apiClient.get(API_ENDPOINTS.users.profile);
  },

  async updateProfile(userData) {
    return apiClient.put(API_ENDPOINTS.users.profile, userData);
  },

  async listUsers() {
    return apiClient.get(API_ENDPOINTS.users.list);
  },
};
