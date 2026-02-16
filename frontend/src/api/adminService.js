import ApiClient from './client';
import API_BASE_URL from './config';

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Servicio para gestión administrativa
 */

// Obtener todos los odontólogos (incluyendo pendientes y suspendidos)
export const getAllOdontologos = async () => {
  try {
    const response = await apiClient.get('/api/odontologos/admin/todos/');
    return response;
  } catch (error) {
    throw error;
  }
};

// Aprobar un odontólogo pendiente
export const aprobarOdontologo = async (id) => {
  try {
    const response = await apiClient.post(`/api/odontologos/admin/${id}/aprobar/`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Suspender un odontólogo activo
export const suspenderOdontologo = async (id, motivo = '') => {
  try {
    const response = await apiClient.post(`/api/odontologos/admin/${id}/suspender/`, {
      motivo
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Reactivar un odontólogo suspendido
export const activarOdontologo = async (id) => {
  try {
    const response = await apiClient.post(`/api/odontologos/admin/${id}/activar/`);
    return response;
  } catch (error) {
    throw error;
  }
};
