import ApiClient from './client';
import API_BASE_URL from './config';

const apiClient = new ApiClient(API_BASE_URL);

/**
 * Reserva de turnos sin cuenta, desde el link público de cada odontólogo.
 */

export const getOdontologoPublico = (slug) => apiClient.get(`/api/publico/odontologos/${slug}/`);

export const getTurnosLibres = (slug) => apiClient.get(`/api/publico/odontologos/${slug}/turnos/`);

export const reservarTurno = (slug, turnoId, datos) =>
  apiClient.post(`/api/publico/odontologos/${slug}/turnos/${turnoId}/reservar/`, datos);

export const getReservaParaCancelar = (token) => apiClient.get(`/api/publico/turnos/cancelar/${token}/`);

export const cancelarReserva = (token) => apiClient.post(`/api/publico/turnos/cancelar/${token}/`);
