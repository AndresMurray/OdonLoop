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
    throw error;
  }
};

// Obtener un odontólogo específico por ID
export const getOdontologo = async (odontologoId) => {
  try {
    const response = await apiClient.get(`/api/odontologos/${odontologoId}/`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Obtener mi perfil (odontólogo logueado)
export const getMiPerfil = async () => {
  try {
    const response = await apiClient.get('/api/odontologos/mi-perfil/');
    return response;
  } catch (error) {
    throw error;
  }
};

// Actualizar mi perfil (odontólogo logueado)
export const actualizarMiPerfil = async (data) => {
  try {
    const response = await apiClient.patch('/api/odontologos/mi-perfil/', data);
    return response;
  } catch (error) {
    throw error;
  }
};

// Obtener info de almacenamiento del odontólogo logueado
export const getMiStorage = async () => {
  try {
    const response = await apiClient.get('/api/odontologos/mi-storage/');
    return response;
  } catch (error) {
    throw error;
  }
};

// Verificar si hay espacio suficiente antes de subir un archivo
export const verificarStorage = async (fileSize) => {
  try {
    const response = await apiClient.post('/api/odontologos/mi-storage/', { file_size: fileSize });
    return response;
  } catch (error) {
    throw error;
  }
};

// Obtener todos los planes de suscripción configurados
export const getPlanes = async () => {
  try {
    const response = await apiClient.get('/api/odontologos/planes/');
    return response;
  } catch (error) {
    throw error;
  }
};

// Obtener el récord de Snake del odontólogo logueado
export const getSnakeHighScore = async () => {
  try {
    const response = await apiClient.get('/api/odontologos/snake-score/');
    return response;
  } catch (error) {
    console.error('Error al obtener récord de Snake:', error);
    return { high_score: 0 };
  }
};

// Guardar nuevo récord de Snake en el backend
export const saveSnakeHighScore = async (highScore) => {
  try {
    const response = await apiClient.post('/api/odontologos/snake-score/', { high_score: highScore });
    return response;
  } catch (error) {
    console.error('Error al guardar récord de Snake:', error);
    return null;
  }
};

