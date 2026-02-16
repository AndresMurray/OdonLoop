import ApiClient from './client';
import API_BASE_URL from './config';

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Servicio para gestión de seguimientos de pacientes
 */

// Obtener lista de pacientes del odontólogo
export const getMisPacientes = async (search = '') => {
  try {
    const url = search 
      ? `/api/pacientes/mis-pacientes/?search=${encodeURIComponent(search)}`
      : '/api/pacientes/mis-pacientes/';
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    throw error;
  }
};

// Obtener lista de TODOS los pacientes del sistema
export const getTodosPacientes = async (search = '') => {
  try {
    const url = search 
      ? `/api/pacientes/?search=${encodeURIComponent(search)}`
      : '/api/pacientes/';
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    throw error;
  }
};

// Obtener seguimientos de un paciente específico con paginación y filtros
export const getSeguimientosPorPaciente = async (pacienteId, page = 1, fechaDesde = '', fechaHasta = '') => {
  try {
    let url = `/api/pacientes/seguimientos/paciente/${pacienteId}/?page=${page}`;
    if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
    if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    throw error;
  }
};

// Crear nuevo seguimiento
export const crearSeguimiento = async (seguimientoData) => {
  try {
    const response = await apiClient.post('/api/pacientes/seguimientos/', seguimientoData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Obtener todos los seguimientos (del odontólogo actual)
export const getMisSeguimientos = async () => {
  try {
    const response = await apiClient.get('/api/pacientes/seguimientos/');
    return response;
  } catch (error) {
    throw error;
  }
};

// Actualizar seguimiento
export const actualizarSeguimiento = async (id, seguimientoData) => {
  try {
    const response = await apiClient.put(`/api/pacientes/seguimientos/${id}/`, seguimientoData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Eliminar seguimiento
export const eliminarSeguimiento = async (id) => {
  try {
    const response = await apiClient.delete(`/api/pacientes/seguimientos/${id}/`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Crear paciente rápido (por odontólogo)
export const crearPacienteRapido = async (pacienteData) => {
  try {
    const response = await apiClient.post('/api/odontologos/crear-paciente-rapido/', pacienteData);
    return response;
  } catch (error) {
    throw error;
  }
};

export default {
  getMisPacientes,
  getTodosPacientes,
  getSeguimientosPorPaciente,
  crearSeguimiento,
  getMisSeguimientos,
  actualizarSeguimiento,
  eliminarSeguimiento,
  crearPacienteRapido
};
