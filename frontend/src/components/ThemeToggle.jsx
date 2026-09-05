import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center p-2 rounded-xl
        transition-all duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        ${
          isDark
            ? 'text-amber-300 hover:text-amber-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 shadow-sm shadow-amber-500/10'
            : 'text-indigo-600 hover:text-indigo-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 shadow-sm'
        }
        ${className}
      `}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-5 h-5 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 transition-transform duration-300 -rotate-12 hover:rotate-0" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
