import ApiClient from './client';
import { API_ENDPOINTS } from './config';

const apiClient = new ApiClient('');

export const userService = {
  async register(userData) {
    return apiClient.post(API_ENDPOINTS.users.register, userData);
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
