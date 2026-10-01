import { DIAS_PRUEBA } from './marketing';

// Si cambia el texto, actualizar también TERMINOS_VERSION en backend/odontologos/models.py
export const TERMINOS_ACTUALIZACION = '1 de octubre de 2026';

/** Lo esencial de los términos, para leer de un vistazo antes de aceptar. */
export const RESUMEN_TERMINOS = [
  { titulo: `${DIAS_PRUEBA} días gratis, sin tarjeta`, texto: 'Si después no te suscribís, la cuenta se pausa y tus datos quedan guardados.' },
  { titulo: 'Los datos de tus pacientes son tuyos', texto: 'Solo vos los ves, con tu usuario y contraseña.' },
  { titulo: 'No reemplaza la Historia Clínica legal', texto: 'OdonLoop organiza tu consultorio; la Historia Clínica sigue siendo tuya, como indica la ley.' },
  { titulo: 'Te podés ir cuando quieras', texto: 'Te ayudamos a exportar tu información y, si lo pedís, la borramos.' },
];
