import { CONTACT_EMAIL, DIAS_PRUEBA, linkWhatsAppVentas } from '../config/marketing';

const Seccion = ({ titulo, children }) => (
  <section className="space-y-2">
    <h2 className="text-base font-bold text-slate-900 dark:text-white">{titulo}</h2>
    {children}
  </section>
);

const Lista = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1.5">
    {items.map((item) => <li key={item}>{item}</li>)}
  </ul>
);

/** Texto completo de los Términos y Condiciones (se usa al activar la cuenta y en /terminos). */
const TerminosContenido = () => (
  <div className="space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
    <Seccion titulo="1. Qué es OdonLoop">
      <p>
        OdonLoop es un sistema online de gestión para consultorios odontológicos: agenda y turnos online, recordatorios,
        seguimiento de pacientes, odontograma y exportación a PDF. Estos términos regulan su uso por parte de los
        profesionales de la odontología que se registran (“vos”).
      </p>
    </Seccion>

    <Seccion titulo="2. Tu cuenta">
      <Lista items={[
        'La cuenta es personal y para uso profesional. Los datos con los que te registrás tienen que ser reales.',
        'Cuidás tu contraseña y no compartís la cuenta. Si sospechás que alguien entró sin permiso, avisanos.',
        'Podemos suspender una cuenta que se use de forma indebida o contraria a estos términos.',
      ]} />
    </Seccion>

    <Seccion titulo="3. Prueba gratis, precios y baja">
      <Lista items={[
        `Al activar tu cuenta tenés ${DIAS_PRUEBA} días de prueba gratis con todas las funciones, sin tarjeta ni pago.`,
        'Al terminar la prueba, si no te suscribiste, la cuenta se suspende. Tus datos se conservan y la podés reactivar suscribiéndote.',
        'Los precios vigentes se publican en odonloop.com. Si cambian, te avisamos antes. El Precio Fundador se mantiene durante el plazo indicado en la oferta.',
        'Podés dejar de usar OdonLoop cuando quieras. Si pedís la baja, te ayudamos a exportar tu información y eliminamos tus datos y los de tus pacientes.',
      ]} />
    </Seccion>

    <Seccion titulo="4. Aclaración legal: Historia Clínica">
      <p className="font-semibold text-slate-900 dark:text-white">
        El seguimiento del paciente, el odontograma y las demás funciones de OdonLoop no constituyen una Historia Clínica con validez legal.
      </p>
      <p>
        Son un registro para la organización del profesional. La Historia Clínica legal debe llevarse conforme a la normativa
        vigente (Ley 26.529), bajo exclusiva responsabilidad del profesional de la salud.
      </p>
    </Seccion>

    <Seccion titulo="5. Datos de tus pacientes">
      <Lista items={[
        'Vos sos responsable de los datos de pacientes que cargás y de contar con su consentimiento cuando corresponda, según la Ley 25.326 de Protección de Datos Personales (los datos de salud son datos sensibles).',
        'OdonLoop trata esos datos solo por tu cuenta y para prestarte el servicio: no los vendemos, no los compartimos con terceros ni los usamos para otros fines.',
        'Cada profesional accede solo a sus propios pacientes. Si un paciente se atiende con otro profesional que usa OdonLoop, cada uno tiene su ficha por separado.',
        'Para operar el servicio usamos proveedores de alojamiento, base de datos, envío de mails y almacenamiento de archivos, que acceden a los datos solo en la medida necesaria.',
      ]} />
    </Seccion>

    <Seccion titulo="6. Turnos online y avisos a pacientes">
      <Lista items={[
        'Si compartís tu link de turnos online, los datos que dejan los pacientes al reservar (nombre, teléfono, mail y motivo) quedan disponibles solo para vos.',
        'OdonLoop les envía en tu nombre los mails de confirmación, recordatorio y cancelación. Los mensajes de WhatsApp los mandás vos desde tu teléfono.',
        'Si un paciente no quiere recibir recordatorios, respetá su decisión.',
      ]} />
    </Seccion>

    <Seccion titulo="7. Respaldo de la información">
      <p>
        Hacemos copias de seguridad periódicas de la base de datos. Igual te recomendamos exportar la información importante
        con las funciones de exportación disponibles.
      </p>
    </Seccion>

    <Seccion titulo="8. Disponibilidad y responsabilidad">
      <Lista items={[
        'Trabajamos para que OdonLoop funcione de forma continua y segura, pero puede haber interrupciones por mantenimiento, fallas técnicas o de proveedores.',
        'OdonLoop es una herramienta administrativa: no interviene ni responde por actos médicos, diagnósticos o tratamientos.',
        'En la medida en que lo permita la ley, OdonLoop no responde por daños indirectos, lucro cesante o pérdida de información derivados del uso o de la imposibilidad de usar la plataforma, ni por el uso indebido que hagan el profesional o terceros.',
      ]} />
    </Seccion>

    <Seccion titulo="9. Tus compromisos">
      <Lista items={[
        'Usar la plataforma solo para tu práctica profesional y de acuerdo con la ley.',
        'Llevar la Historia Clínica legal y cumplir con las normas de tu Colegio Profesional.',
        'No intentar acceder a datos de otros profesionales ni afectar el funcionamiento del servicio.',
      ]} />
    </Seccion>

    <Seccion titulo="10. Cambios en estos términos">
      <p>
        Podemos actualizar estos términos. Si hay cambios importantes, te avisamos por mail o dentro de la plataforma antes
        de que entren en vigencia.
      </p>
    </Seccion>

    <Seccion titulo="11. Contacto y ley aplicable">
      <p>
        Por cualquier consulta escribinos a{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-blue-700 dark:text-blue-300 hover:underline">{CONTACT_EMAIL}</a>{' '}
        o por{' '}
        <a href={linkWhatsAppVentas('Hola, tengo una consulta sobre los términos de OdonLoop')} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 dark:text-blue-300 hover:underline">WhatsApp</a>.
        Estos términos se rigen por las leyes de la República Argentina.
      </p>
    </Seccion>
  </div>
);

export default TerminosContenido;
