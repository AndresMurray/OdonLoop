import ApiClient from './client';
import API_BASE_URL from './config';

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Obtener el odontograma completo de un paciente
 * Devuelve el último registro de cada pieza dental
 */
export const getOdontograma = async (pacienteId) => {
  try {
    const response = await apiClient.get(`/api/pacientes/odontograma/${pacienteId}/`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener el historial de una pieza dental específica
 */
export const getHistorialPieza = async (pacienteId, pieza) => {
  try {
    const response = await apiClient.get(`/api/pacientes/odontograma/${pacienteId}/pieza/${pieza}/`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Crear un nuevo registro dental
 */
export const crearRegistroDental = async (data) => {
  try {
    const response = await apiClient.post('/api/pacientes/registros-dentales/', data);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Estados disponibles para las piezas dentales
 */
export const ESTADOS_DENTALES = [
  { value: 'sano', label: 'Sano', color: '#10B981' },
  { value: 'caries', label: 'Caries', color: '#EF4444' },
  { value: 'obturado', label: 'Obturado', color: '#3B82F6' },
  { value: 'extraccion', label: 'Extracción indicada', color: '#F59E0B' },
  { value: 'ausente', label: 'Ausente', color: '#6B7280' },
  { value: 'corona', label: 'Corona', color: '#8B5CF6' },
  { value: 'endodoncia', label: 'Endodoncia', color: '#EC4899' },
  { value: 'protesis', label: 'Prótesis', color: '#14B8A6' },
  { value: 'implante', label: 'Implante', color: '#06B6D4' },
  { value: 'otro', label: 'Otro', color: '#78716C' },
];

/**
 * Obtener color para un estado dental
 */
export const getColorEstado = (estado) => {
  const estadoObj = ESTADOS_DENTALES.find(e => e.value === estado);
  return estadoObj ? estadoObj.color : '#E5E7EB';
};

export default {
  getOdontograma,
  getHistorialPieza,
  crearRegistroDental,
  ESTADOS_DENTALES,
  getColorEstado
};
