import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white/10 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-semibold text-white">OdontoSystem</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
