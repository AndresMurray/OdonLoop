import ApiClient from './client';
import API_BASE_URL from './config';

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Servicio para gestionar obras sociales
 */
const obraSocialService = {
  /**
   * Obtiene la lista de todas las obras sociales activas
   * @returns {Promise<Array>} Lista de obras sociales
   */
  getAll: async () => {
    const response = await apiClient.get('/api/pacientes/obras-sociales/');
    return response;
  },
};

export { obraSocialService };
