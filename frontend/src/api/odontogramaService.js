import ApiClient from './client';
import API_BASE_URL from './config';

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Obtener el odontograma completo de un paciente (52 piezas)
 * Devuelve todas las piezas con sus registros
 */
export const getOdontograma = async (pacienteId) => {
  const response = await apiClient.get(`/api/pacientes/odontograma/${pacienteId}/`);
  return response;
};

/**
 * Obtener el registro de una pieza dental específica
 */
export const getRegistroPieza = async (pacienteId, pieza) => {
  try {
    const response = await apiClient.get(`/api/pacientes/odontograma/${pacienteId}/pieza/${pieza}/`);
    return response;
  } catch (error) {
    console.error('Error al obtener registro de pieza:', error);
    throw error;
  }
};

/**
 * Crear o actualizar un registro dental
 */
export const guardarRegistroDental = async (pacienteId, piezaDental, registro) => {
  try {
    const data = {
      paciente: pacienteId,
      pieza_dental: piezaDental,
      cara_vestibular: registro.cara_vestibular || null,
      cara_lingual: registro.cara_lingual || null,
      cara_mesial: registro.cara_mesial || null,
      cara_distal: registro.cara_distal || null,
      cara_oclusal: registro.cara_oclusal || null,
      estado_pieza: registro.estado_pieza || [],  // Array de estados
      puente: registro.puente || null,  // Info de puente
      observaciones: registro.observaciones || ''
    };
    
    // Si existe un registro, actualizamos; si no, creamos
    if (registro.id) {
      const response = await apiClient.patch(`/api/pacientes/registros-dentales/${registro.id}/`, data);
      return response;
    } else {
      const response = await apiClient.post('/api/pacientes/registros-dentales/', data);
      return response;
    }
  } catch (error) {
    console.error('Error al guardar registro dental:', error);
    throw error;
  }
};

/**
 * Obtener todos los registros dentales de un paciente
 */
export const getRegistrosDentales = async (pacienteId) => {
  try {
    const response = await apiClient.get(`/api/pacientes/registros-dentales/?paciente_id=${pacienteId}`);
    return response;
  } catch (error) {
    console.error('Error al obtener registros dentales:', error);
    throw error;
  }
};

/**
 * Guardar la descripción general del odontograma del paciente
 */
export const guardarDescripcionGeneral = async (pacienteId, descripcion) => {
  try {
    const response = await apiClient.patch(`/api/pacientes/odontograma/${pacienteId}/`, {
      descripcion_general: descripcion
    });
    return response;
  } catch (error) {
    console.error('Error al guardar descripción general:', error);
    throw error;
  }
};

export default {
  getOdontograma,
  getRegistroPieza,
  guardarRegistroDental,
  getRegistrosDentales,
  guardarDescripcionGeneral
};

