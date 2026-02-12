import ApiClient from './client';
import API_BASE_URL from './config';

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Servicio para gestión de odontólogos
 */

// Obtener lista de todos los odontólogos
export const getOdontologos = async () => {
  try {
    const response = await apiClient.get('/api/odontologos/');
    return response;
  } catch (error) {
    console.error('Error al obtener odontólogos:', error);
    throw error;
  }
};

// Obtener un odontólogo específico por ID
export const getOdontologo = async (odontologoId) => {
  try {
    const response = await apiClient.get(`/api/odontologos/${odontologoId}/`);
    return response;
  } catch (error) {
    console.error('Error al obtener odontólogo:', error);
    throw error;
  }
};

// Obtener mi perfil (odontólogo logueado)
export const getMiPerfil = async () => {
  try {
    const response = await apiClient.get('/api/odontologos/mi-perfil/');
    return response;
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throw error;
  }
};

// Actualizar mi perfil (odontólogo logueado)
export const actualizarMiPerfil = async (data) => {
  try {
    const response = await apiClient.patch('/api/odontologos/mi-perfil/', data);
    return response;
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    throw error;
  }
};
