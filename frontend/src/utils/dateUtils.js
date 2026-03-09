/**
 * Utilidades para manejo de fechas en zona horaria local
 * Evita problemas con UTC vs hora local
 */

/**
 * Obtiene la fecha local en formato YYYY-MM-DD
 * @param {Date} date - Fecha a convertir (por defecto: hoy)
 * @returns {string} Fecha en formato YYYY-MM-DD en zona horaria local
 */
export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD (zona horaria local)
 * @returns {string} Fecha de hoy en formato YYYY-MM-DD
 */
export const getToday = () => {
  return getLocalDateString(new Date());
};

/**
 * Compara si dos fechas son el mismo día (ignora la hora)
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {boolean} true si son el mismo día
 */
export const isSameDay = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};
