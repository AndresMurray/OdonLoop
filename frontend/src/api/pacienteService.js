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
    throw error;
  }
};

// Editar datos de un paciente (como odontólogo)
export const editarPaciente = async (pacienteId, data) => {
  try {
    const response = await apiClient.patch(`/api/pacientes/mis-pacientes/${pacienteId}/editar/`, data);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Servicio para el perfil del paciente
 */

// Obtener el perfil del paciente autenticado
export const getMiPerfil = async () => {
  try {
    const response = await apiClient.get('/api/pacientes/mi-perfil/');
    return response;
  } catch (error) {
    throw error;
  }
};

// Actualizar el perfil del paciente autenticado
export const actualizarMiPerfil = async (perfilData) => {
  try {
    const response = await apiClient.patch('/api/pacientes/mi-perfil/', perfilData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Obtener lista de obras sociales
export const getObrasSociales = async () => {
  try {
    const response = await apiClient.get('/api/pacientes/obras-sociales/');
    return response;
  } catch (error) {
    throw error;
  }
};

// Obtener lista de pacientes del odontólogo (reutilizando de seguimientoService)
export { getMisPacientes } from './seguimientoService';

export default {
  crearPacienteRapido,
  editarPaciente,
  getMiPerfil,
  actualizarMiPerfil,
  getObrasSociales,
};
