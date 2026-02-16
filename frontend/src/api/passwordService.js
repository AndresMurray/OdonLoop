import ApiClient from './client';
import API_BASE_URL from './config';

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Solicitar recuperación de contraseña (envía código por email)
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post('/api/usuarios/password-reset/request/', { email });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Verificar código de recuperación
 */
export const verifyResetCode = async (email, code) => {
  try {
    const response = await apiClient.post('/api/usuarios/password-reset/verify/', { 
      email, 
      code 
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Cambiar contraseña con código de recuperación
 */
export const resetPassword = async (email, code, newPassword) => {
  try {
    const response = await apiClient.post('/api/usuarios/password-reset/confirm/', {
      email,
      code,
      new_password: newPassword
    });
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Cambiar contraseña estando logueado (desde perfil)
 */
export const changePassword = async (data) => {
  try {
    const response = await apiClient.post('/api/usuarios/password/change/', {
      current_password: data.current_password,
      new_password: data.new_password
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export default {
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  changePassword
};
