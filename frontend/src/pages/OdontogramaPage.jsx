import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Odontograma from '../components/Odontograma';
import { ArrowLeft, Plus, History, X } from 'lucide-react';
import { 
  getOdontograma, 
  getHistorialPieza, 
  crearRegistroDental,
  ESTADOS_DENTALES,
  getColorEstado
} from '../api/odontogramaService';

const OdontogramaPage = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  
  const [odontogramaData, setOdontogramaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  
  // Estado para modal de pieza
  const [modalPieza, setModalPieza] = useState(null);
  const [historialPieza, setHistorialPieza] = useState(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  
  // Estado para nuevo registro
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoRegistro, setNuevoRegistro] = useState({
    estado: 'sano',
    descripcion: ''
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarOdontograma();
  }, [pacienteId]);

  const cargarOdontograma = async () => {
    setLoading(true);
    try {
      const data = await getOdontograma(pacienteId);
      setOdontogramaData(data);
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Error al cargar el odontograma'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePiezaClick = async (pieza) => {
    setModalPieza(pieza);
    setMostrarFormulario(false);
    setLoadingHistorial(true);
    
    try {
      const data = await getHistorialPieza(pacienteId, pieza);
      setHistorialPieza(data);
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Error al cargar historial de la pieza'
      });
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleCerrarModal = () => {
    setModalPieza(null);
    setHistorialPieza(null);
    setMostrarFormulario(false);
    setNuevoRegistro({ estado: 'sano', descripcion: '' });
  };

  const handleGuardarRegistro = async () => {
    if (!nuevoRegistro.descripcion.trim()) {
      setAlert({
        type: 'error',
        message: 'La descripción es obligatoria'
      });
      return;
    }

    setGuardando(true);
    try {
      await crearRegistroDental({
        paciente: parseInt(pacienteId),
        pieza_dental: modalPieza,
        estado: nuevoRegistro.estado,
        descripcion: nuevoRegistro.descripcion
      });
      
      setAlert({
        type: 'success',
        message: 'Registro guardado correctamente'
      });
      
      // Recargar datos
      await cargarOdontograma();
      const data = await getHistorialPieza(pacienteId, modalPieza);
      setHistorialPieza(data);
      
      setMostrarFormulario(false);
      setNuevoRegistro({ estado: 'sano', descripcion: '' });
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Error al guardar el registro'
      });
    } finally {
      setGuardando(false);
    }
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      
      {/* Header */}
      <header className="bg-white/95 shadow-md backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Odontograma
                </h1>
                {odontogramaData?.paciente && (
                  <p className="text-gray-600 mt-1">
                    {odontogramaData.paciente.nombre_completo}
                    {odontogramaData.paciente.dni && ` - DNI: ${odontogramaData.paciente.dni}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ type: '', message: '' })}
          />

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando odontograma...</p>
              </CardContent>
            </Card>
          ) : odontogramaData ? (
            <Odontograma 
              odontograma={odontogramaData.odontograma} 
              onPiezaClick={handlePiezaClick}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">No se pudo cargar el odontograma</p>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
      
      <Footer />

      {/* Modal de Pieza Dental */}
      {modalPieza && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleCerrarModal}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Pieza {modalPieza}
                {historialPieza?.pieza_nombre && (
                  <span className="block text-sm font-normal opacity-90">
                    {historialPieza.pieza_nombre.split(' - ')[1]}
                  </span>
                )}
              </h3>
              <button 
                onClick={handleCerrarModal}
                className="text-white hover:bg-white/20 rounded-full p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {loadingHistorial ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando...</p>
                </div>
              ) : (
                <>
                  {/* Botón para agregar registro */}
                  {!mostrarFormulario && (
                    <Button
                      variant="primary"
                      className="w-full mb-4"
                      onClick={() => setMostrarFormulario(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Registro
                    </Button>
                  )}

                  {/* Formulario de nuevo registro */}
                  {mostrarFormulario && (
                    <Card className="mb-4 border-2 border-cyan-200">
                      <CardHeader>
                        <CardTitle className="text-lg">Nuevo Registro</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado de la pieza
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {ESTADOS_DENTALES.map(estado => (
                              <button
                                key={estado.value}
                                type="button"
                                onClick={() => setNuevoRegistro(prev => ({ ...prev, estado: estado.value }))}
                                className={`
                                  flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm
                                  transition-all duration-200
                                  ${nuevoRegistro.estado === estado.value 
                                    ? 'border-gray-800 bg-gray-100' 
                                    : 'border-gray-200 hover:border-gray-400'}
                                `}
                              >
                                <div 
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: estado.color }}
                                />
                                {estado.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción / Observaciones
                          </label>
                          <textarea
                            value={nuevoRegistro.descripcion}
                            onChange={(e) => setNuevoRegistro(prev => ({ ...prev, descripcion: e.target.value }))}
                            placeholder="Describe el tratamiento, observaciones, etc."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setMostrarFormulario(false);
                              setNuevoRegistro({ estado: 'sano', descripcion: '' });
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="primary"
                            className="flex-1"
                            onClick={handleGuardarRegistro}
                            disabled={guardando}
                          >
                            {guardando ? 'Guardando...' : 'Guardar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Historial de la pieza */}
                  <div>
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                      <History className="w-5 h-5" />
                      Historial
                    </h4>
                    
                    {historialPieza?.historial?.length > 0 ? (
                      <div className="space-y-3">
                        {historialPieza.historial.map((registro, index) => (
                          <div 
                            key={registro.id}
                            className={`
                              p-4 rounded-lg border-l-4
                              ${index === 0 ? 'bg-cyan-50' : 'bg-gray-50'}
                            `}
                            style={{ borderLeftColor: getColorEstado(registro.estado) }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span 
                                className="px-2 py-1 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: getColorEstado(registro.estado) }}
                              >
                                {registro.estado_display}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatearFecha(registro.fecha_registro)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{registro.descripcion}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Por: {registro.odontologo_nombre}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No hay registros para esta pieza</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Agregá el primer registro usando el botón de arriba
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OdontogramaPage;
