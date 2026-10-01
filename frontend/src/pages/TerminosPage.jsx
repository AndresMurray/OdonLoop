import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TerminosContenido from '../components/TerminosContenido';
import { TERMINOS_ACTUALIZACION } from '../config/terminos';

/** Términos y Condiciones, públicos (los mismos que acepta el odontólogo al activar su cuenta). */
const TerminosPage = () => (
  <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col text-white">
    <Navbar />
    <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:shadow-none p-6 md:p-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Términos y Condiciones</h1>
        <p className="mt-1 mb-8 text-sm text-slate-500 dark:text-slate-400">Última actualización: {TERMINOS_ACTUALIZACION}</p>
        <TerminosContenido />
      </div>
    </main>
    <Footer />
  </div>
);

export default TerminosPage;
