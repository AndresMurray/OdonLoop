// Recordatorios por WhatsApp con un click (links wa.me, sin API ni costo).

/**
 * Convierte un teléfono argentino cargado a mano al formato de WhatsApp (549 + característica + número).
 * Devuelve null si no se puede interpretar con seguridad.
 */
export const normalizarTelefonoAR = (telefono) => {
  let digitos = (telefono || '').replace(/\D/g, '');
  if (!digitos) return null;
  if (digitos.startsWith('549')) return digitos;
  if (digitos.startsWith('54')) digitos = digitos.slice(2);
  digitos = digitos.replace(/^0+/, '');
  if (digitos.length === 12) {
    // Característica + 15 + número: sacar el 15 (características de 2, 3 o 4 dígitos)
    for (const largo of [2, 3, 4]) {
      if (digitos.slice(largo, largo + 2) === '15') {
        digitos = digitos.slice(0, largo) + digitos.slice(largo + 2);
        break;
      }
    }
  }
  return digitos.length === 10 ? `549${digitos}` : null;
};

/** Link de WhatsApp; sin teléfono válido abre WhatsApp para elegir el contacto a mano. */
export const linkWhatsApp = (telefono, texto) => {
  const numero = normalizarTelefonoAR(telefono);
  const mensaje = encodeURIComponent(texto);
  return numero ? `https://wa.me/${numero}?text=${mensaje}` : `https://wa.me/?text=${mensaje}`;
};

/** Mensaje de recordatorio listo para enviar. */
export const mensajeRecordatorioTurno = ({ nombrePaciente, fechaHora, profesional }) => {
  const fecha = new Date(fechaHora);
  const dia = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const lineas = [
    `¡Hola ${nombrePaciente}!`,
    `Te recordamos tu turno odontológico el ${dia} a las ${hora} hs${profesional ? ` con ${profesional}` : ''}.`,
  ];
  lineas.push('Por favor confirmá tu asistencia respondiendo este mensaje. ¡Gracias!');
  return lineas.join('\n');
};

/** Nombre del paciente de un turno (registrado o reserva manual). */
export const nombrePacienteTurno = (turno) =>
  turno.paciente?.nombre_completo ||
  [turno.nombre_paciente_manual, turno.apellido_paciente_manual].filter(Boolean).join(' ');

/** Link de recordatorio de un turno. En la demo no se usa el teléfono (son números ficticios). */
export const linkRecordatorioTurno = (turno, userData) => {
  const telefono = userData?.suscripcion?.es_demo ? null : (turno.paciente?.telefono || turno.telefono_paciente_manual);
  const texto = mensajeRecordatorioTurno({
    nombrePaciente: nombrePacienteTurno(turno).split(' ')[0],
    fechaHora: turno.fecha_hora,
    profesional: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim(),
  });
  return linkWhatsApp(telefono, texto);
};
