import ApiClient from './client';
import API_BASE_URL from './config';

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Obtener un odontograma de un paciente.
 * Si se pasa odontogramaId, obtiene ese específico; si no, el último.
 */
export const getOdontograma = async (pacienteId, odontogramaId = null) => {
  const url = odontogramaId
    ? `/api/pacientes/odontograma/${pacienteId}/${odontogramaId}/`
    : `/api/pacientes/odontograma/${pacienteId}/`;
  const response = await apiClient.get(url);
  return response;
};

/**
 * Crear un nuevo odontograma vacío para el paciente
 */
export const crearOdontograma = async (pacienteId) => {
  const response = await apiClient.post(`/api/pacientes/odontograma/${pacienteId}/`);
  return response;
};

/**
 * Listar todos los odontogramas de un paciente
 */
export const listarOdontogramas = async (pacienteId) => {
  const response = await apiClient.get(`/api/pacientes/odontograma/${pacienteId}/lista/`);
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
export const guardarRegistroDental = async (pacienteId, piezaDental, registro, odontogramaId = null) => {
  try {
    const data = {
      paciente: pacienteId,
      odontograma: odontogramaId,
      pieza_dental: piezaDental,
      cara_vestibular: registro.cara_vestibular || null,
      cara_lingual: registro.cara_lingual || null,
      cara_mesial: registro.cara_mesial || null,
      cara_distal: registro.cara_distal || null,
      cara_oclusal: registro.cara_oclusal || null,
      estado_pieza: registro.estado_pieza || [],
      puente: registro.puente || null,
      observaciones: registro.observaciones || ''
    };
    
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
 * Guardar la descripción general de un odontograma
 */
export const guardarDescripcionGeneral = async (pacienteId, descripcion, odontogramaId = null) => {
  try {
    const url = odontogramaId
      ? `/api/pacientes/odontograma/${pacienteId}/${odontogramaId}/`
      : `/api/pacientes/odontograma/${pacienteId}/`;
    const response = await apiClient.patch(url, {
      descripcion_general: descripcion
    });
    return response;
  } catch (error) {
    console.error('Error al guardar descripción general:', error);
    throw error;
  }
};

/**
 * Eliminar un odontograma
 */
export const eliminarOdontograma = async (pacienteId, odontogramaId) => {
  const response = await apiClient.delete(`/api/pacientes/odontograma/${pacienteId}/${odontogramaId}/`);
  return response;
};

export default {
  getOdontograma,
  crearOdontograma,
  listarOdontogramas,
  eliminarOdontograma,
  getRegistroPieza,
  guardarRegistroDental,
  getRegistrosDentales,
  guardarDescripcionGeneral
};

