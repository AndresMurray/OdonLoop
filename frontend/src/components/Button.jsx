const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
}) => {
  const baseStyles = 'rounded-lg font-medium transition duration-200';
  
  const cursorStyle = (disabled && !isLoading) ? 'cursor-not-allowed opacity-50' : isLoading ? 'cursor-wait' : 'cursor-pointer';
  
  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2',
    lg: 'px-8 py-3 text-lg',
  };
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 transition-all duration-150 focus:ring-2 focus:ring-blue-500 shadow-md shadow-blue-500/10',
    secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white active:scale-95 transition-all duration-150 focus:ring-2 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-500 active:scale-95 transition-all duration-150 focus:ring-2 focus:ring-red-500',
    outline: 'border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white active:scale-95 transition-all duration-150 focus:ring-2 focus:ring-slate-500',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${cursorStyle} ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Procesando...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
