import ApiClient from './client';
import API_BASE_URL from './config';

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Servicio para gestión de turnos
 */

// Obtener todos los turnos del usuario (según su rol)
export const getTurnos = async () => {
  try {
    const response = await apiClient.get('/api/turnos/');
    return response;
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    throw error;
  }
};

// Obtener turnos disponibles (opcionalmente filtrados por odontólogo)
export const getTurnosDisponibles = async (odontologoId = null) => {
  try {
    const url = odontologoId 
      ? `/api/turnos/disponibles/?odontologo=${odontologoId}`
      : '/api/turnos/disponibles/';
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    console.error('Error al obtener turnos disponibles:', error);
    throw error;
  }
};

// Obtener mis turnos
export const getMisTurnos = async () => {
  try {
    const response = await apiClient.get('/api/turnos/mis_turnos/');
    return response;
  } catch (error) {
    console.error('Error al obtener mis turnos:', error);
    throw error;
  }
};

// Crear un turno disponible (solo odontólogos)
export const crearTurno = async (turnoData) => {
  try {
    const response = await apiClient.post('/api/turnos/', turnoData);
    return response;
  } catch (error) {
    console.error('Error al crear turno:', error);
    throw error;
  }
};

// Reservar un turno (solo pacientes)
export const reservarTurno = async (turnoId, motivo = '') => {
  try {
    const response = await apiClient.post(`/api/turnos/${turnoId}/reservar/`, {
      motivo
    });
    return response;
  } catch (error) {
    console.error('Error al reservar turno:', error);
    throw error;
  }
};

// Cancelar un turno
export const cancelarTurno = async (turnoId) => {
  try {
    const response = await apiClient.post(`/api/turnos/${turnoId}/cancelar/`);
    return response;
  } catch (error) {
    console.error('Error al cancelar turno:', error);
    throw error;
  }
};

// Confirmar un turno (solo odontólogos)
export const confirmarTurno = async (turnoId) => {
  try {
    const response = await apiClient.post(`/api/turnos/${turnoId}/confirmar/`);
    return response;
  } catch (error) {
    console.error('Error al confirmar turno:', error);
    throw error;
  }
};

// Completar un turno (solo odontólogos)
export const completarTurno = async (turnoId) => {
  try {
    const response = await apiClient.post(`/api/turnos/${turnoId}/completar/`);
    return response;
  } catch (error) {
    console.error('Error al completar turno:', error);
    throw error;
  }
};

// Obtener un turno específico por ID
export const getTurno = async (turnoId) => {
  try {
    const response = await apiClient.get(`/api/turnos/${turnoId}/`);
    return response;
  } catch (error) {
    console.error('Error al obtener turno:', error);
    throw error;
  }
};
