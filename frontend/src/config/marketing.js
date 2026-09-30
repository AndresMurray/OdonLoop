// Datos comerciales de la landing y los avisos. Editá acá (o con variables VITE_*) sin tocar componentes.

// WhatsApp de ventas/soporte: solo dígitos en formato internacional
export const WHATSAPP_VENTAS = import.meta.env.VITE_WHATSAPP_VENTAS || '5492262512370';

// Mail de contacto. Recomendado: una casilla @odonloop.com (VITE_CONTACT_EMAIL)
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'sistemagestionodontologico@gmail.com';

export const INSTAGRAM_URL = 'https://www.instagram.com/odonloop/';
export const YOUTUBE_DEMO_URL = 'https://youtu.be/5HqWZP25XYY';

export const DIAS_PRUEBA = 30;

// Oferta de lanzamiento: vale para quien se registre hasta el último día de `hasta` (hora de Argentina).
// Pasada la fecha se oculta sola. Poné `activa: false` para ocultarla antes.
export const OFERTA_FUNDADOR = {
  activa: true,
  precio: '$30.000/mes',
  meses: 12,
  hasta: '2026-10-31',
};

const FIN_OFERTA = new Date(`${OFERTA_FUNDADOR.hasta}T23:59:59-03:00`);

// Fecha de hoy en Argentina, como AAAA-MM-DD
const hoyAR = (ahora) => ahora.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

/** Días de calendario hasta el último día de la oferta (0 = hoy es el último día). */
export const diasRestantesOferta = (ahora = new Date()) =>
  Math.round((Date.parse(`${OFERTA_FUNDADOR.hasta}T00:00:00Z`) - Date.parse(`${hoyAR(ahora)}T00:00:00Z`)) / 86_400_000);

export const ofertaFundadorVigente = (ahora = new Date()) =>
  OFERTA_FUNDADOR.activa && ahora <= FIN_OFERTA;

export const textoDiasOferta = (ahora = new Date()) => {
  const dias = diasRestantesOferta(ahora);
  if (dias <= 0) return '¡Último día!';
  return dias === 1 ? 'Falta 1 día' : `Faltan ${dias} días`;
};

/** Si un odontólogo registrado en `fechaAlta` tiene derecho al Precio Fundador. */
export const tienePrecioFundador = (fechaAlta) => new Date(fechaAlta) <= FIN_OFERTA;

/** "31 de octubre" */
export const fechaFinOfertaTexto = FIN_OFERTA.toLocaleDateString('es-AR', {
  day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires',
});

// Testimonios reales (con permiso del odontólogo). Si está vacío, la sección no se muestra.
// Ejemplo: { nombre: 'Od. Juan Pérez', ciudad: 'Necochea', texto: '...', foto: '/landing/juan.jpg' }
export const TESTIMONIOS = [];

// Quién está detrás del producto
export const FUNDADOR = {
  nombre: 'Andrés Murray Roppel',
  texto: 'Desarrollo OdonLoop en Argentina, pensado para consultorios como el tuyo. Te acompaño personalmente: te capacito para usarlo y respondo tus consultas por WhatsApp.',
  foto: null, // ej. '/landing/andres.jpg'
};

export const linkWhatsAppVentas = (texto) =>
  `https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent(texto)}`;
