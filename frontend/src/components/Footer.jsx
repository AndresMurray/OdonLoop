const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/5 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-center text-white/60 text-sm">
          © {currentYear} OdontoSystem. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
