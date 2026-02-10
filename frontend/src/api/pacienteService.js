import ApiClient from './client';
import API_BASE_URL from './config';

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Servicio para gestión de pacientes por parte del odontólogo
 */

// Crear paciente rápido (sin cuenta de email)
export const crearPacienteRapido = async (pacienteData) => {
  try {
    const response = await apiClient.post('/api/odontologos/crear-paciente-rapido/', pacienteData);
    return response;
  } catch (error) {
    console.error('Error al crear paciente rápido:', error);
    throw error;
  }
};

// Obtener lista de pacientes del odontólogo (reutilizando de seguimientoService)
export { getMisPacientes } from './seguimientoService';

export default {
  crearPacienteRapido,
};
