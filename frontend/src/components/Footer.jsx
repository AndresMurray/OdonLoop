import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-100/70 dark:bg-white/5 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-center text-slate-500 dark:text-white/60 text-sm">
          © {currentYear} OdonLoop. Todos los derechos reservados.
          {' · '}
          <Link to="/terminos" className="hover:text-slate-900 dark:hover:text-white hover:underline">Términos y Condiciones</Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
