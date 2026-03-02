/**
 * Modal genérico para mostrar estados de operaciones
 * Puede mostrar: loading, success o error
 */
const StatusModal = ({ isOpen, status = 'loading', title, message = '', onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-8 animate-fadeIn text-center">
                {status === 'loading' && (
                    <>
                        {/* Spinner */}
                        <div className="flex justify-center mb-5">
                            <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {title || 'Procesando...'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {message || 'Por favor esperá.'}
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        {/* Check icon */}
                        <div className="flex justify-center mb-5">
                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {title || '¡Éxito!'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            {message || 'La operación se completó correctamente.'}
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Aceptar
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        {/* Error icon */}
                        <div className="flex justify-center mb-5">
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {title || 'Error'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            {message || 'Ocurrió un error al procesar la operación.'}
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Cerrar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default StatusModal;
