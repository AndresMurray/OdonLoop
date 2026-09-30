// Medición opcional: Google Analytics 4 (VITE_GA_ID) y Meta Pixel (VITE_META_PIXEL_ID).
// Si no hay IDs configurados no se carga nada.

const GA_ID = import.meta.env.VITE_GA_ID;
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

const cargarScript = (src) => {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
};

export const initAnalytics = () => {
  if (GA_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // Las páginas vistas se mandan a mano en cada cambio de ruta (es una SPA)
    window.gtag('config', GA_ID, { send_page_view: false });
    cargarScript(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
  }
  if (PIXEL_ID && !window.fbq) {
    const fbq = function fbq() {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    window.fbq = fbq;
    window._fbq = fbq;
    cargarScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
  }
};

export const trackPageView = (path) => {
  if (GA_ID && window.gtag) window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href });
  if (PIXEL_ID && window.fbq) window.fbq('track', 'PageView');
};

// Eventos de conversión. Nombres de GA4 y su equivalente estándar de Meta.
const EVENTOS_META = {
  sign_up: 'CompleteRegistration',
  generate_lead: 'Lead',
  contact: 'Contact',
  start_demo: 'ViewContent',
};

export const trackEvent = (nombre, params = {}) => {
  if (GA_ID && window.gtag) window.gtag('event', nombre, params);
  if (PIXEL_ID && window.fbq) {
    const meta = EVENTOS_META[nombre];
    if (meta) window.fbq('track', meta, params);
    else window.fbq('trackCustom', nombre, params);
  }
};
