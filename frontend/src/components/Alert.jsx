const Alert = ({ type = 'info', message, onClose }) => {
  const types = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  if (!message) return null;

  return (
    <div className={`border-l-4 p-4 mb-4 ${types[type]} relative`} role="alert">
      <p className="font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 right-0 p-4 hover:opacity-70"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
