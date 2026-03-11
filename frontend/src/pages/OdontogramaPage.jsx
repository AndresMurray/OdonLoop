import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Odontograma from '../components/Odontograma';
import StatusModal from '../components/StatusModal';
import { ArrowLeft, FileDown, FilePlus, List, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { 
  getOdontograma,
  crearOdontograma,
  listarOdontogramas,
  eliminarOdontograma,
  guardarRegistroDental,
  guardarDescripcionGeneral
} from '../api/odontogramaService';
import { exportarHistorialPacientePDF } from '../utils/exportarPDF';

const OdontogramaPage = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  
  const [odontogramaData, setOdontogramaData] = useState(null);
  const [odontogramaId, setOdontogramaId] = useState(null);
  const odontogramaIdRef = useRef(null);
  const [totalOdontogramas, setTotalOdontogramas] = useState(0);
  // Descripción general editable
  const [descripcion, setDescripcion] = useState('');
  const [guardandoDescripcion, setGuardandoDescripcion] = useState(false);
  const [modalDescripcion, setModalDescripcion] = useState({ isOpen: false, status: 'loading', message: '' });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [guardando, setGuardando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [modoCaptura, setModoCaptura] = useState(false);
  const odontogramaRef = useRef(null);

  // Modal lista de odontogramas
  const [mostrarListaOdontogramas, setMostrarListaOdontogramas] = useState(false);
  const [listaOdontogramas, setListaOdontogramas] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [creandoNuevo, setCreandoNuevo] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarOdontograma();
  }, [pacienteId]);

  const cargarOdontograma = async (odontogramaIdParam = null) => {
    setLoading(true);
    try {
      const data = await getOdontograma(pacienteId, odontogramaIdParam);
      setOdontogramaData(data);
      setOdontogramaId(data.odontograma_id);
      odontogramaIdRef.current = data.odontograma_id;
      setTotalOdontogramas(data.total_odontogramas || 0);
      setDescripcion(data.descripcion_general || '');
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Error al cargar el odontograma'
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo odontograma
  const handleNuevoOdontograma = async () => {
    setCreandoNuevo(true);
    try {
      const data = await crearOdontograma(pacienteId);
      setOdontogramaData(data);
      setOdontogramaId(data.odontograma_id);
      odontogramaIdRef.current = data.odontograma_id;
      setTotalOdontogramas(data.total_odontogramas || 0);
      setDescripcion(data.descripcion_general || '');
      setAlert({
        type: 'success',
        message: 'Nuevo odontograma creado'
      });
      setTimeout(() => setAlert({ type: '', message: '' }), 3000);
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Error al crear nuevo odontograma'
      });
    } finally {
      setCreandoNuevo(false);
    }
  };

  // Cargar lista de odontogramas
  const handleVerOdontogramas = async () => {
    setLoadingLista(true);
    setMostrarListaOdontogramas(true);
    try {
      const data = await listarOdontogramas(pacienteId);
      setListaOdontogramas(data.odontogramas || []);
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Error al cargar la lista de odontogramas'
      });
      setMostrarListaOdontogramas(false);
    } finally {
      setLoadingLista(false);
    }
  };

  // Seleccionar un odontograma de la lista
  const handleSeleccionarOdontograma = (id) => {
    setMostrarListaOdontogramas(false);
    cargarOdontograma(id);
  };

  // Eliminar un odontograma
  const handleEliminarOdontograma = async (id) => {
    setEliminando(true);
    try {
      await eliminarOdontograma(pacienteId, id);
      // Actualizar la lista
      setListaOdontogramas(prev => prev.filter(item => item.id !== id));
      setConfirmandoEliminar(null);
      const nuevoTotal = totalOdontogramas - 1;
      setTotalOdontogramas(nuevoTotal);
      // Si se eliminó el que estaba cargado, cargar el último
      if (id === odontogramaId) {
        setMostrarListaOdontogramas(false);
        cargarOdontograma();
      }
      // Si no quedan más, cerrar el modal
      if (nuevoTotal <= 1) {
        setMostrarListaOdontogramas(false);
      }
      setAlert({ type: 'success', message: 'Odontograma eliminado' });
      setTimeout(() => setAlert({ type: '', message: '' }), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Error al eliminar el odontograma' });
    } finally {
      setEliminando(false);
    }
  };

  // Guardar la descripción general
  const handleGuardarDescripcion = async () => {
    setGuardandoDescripcion(true);
    setModalDescripcion({ isOpen: true, status: 'loading', message: 'Guardando descripción...' });
    try {
      await guardarDescripcionGeneral(pacienteId, descripcion, odontogramaId);
      setModalDescripcion({ 
        isOpen: true, 
        status: 'success',
        title: '¡Descripción guardada!',
        message: 'La descripción se guardó correctamente' 
      });
    } catch (error) {
      console.error('Error al guardar descripción:', error);
      setModalDescripcion({ 
        isOpen: true, 
        status: 'error',
        title: 'Error al guardar',
        message: 'No se pudo guardar la descripción. Por favor, intenta nuevamente.' 
      });
    } finally {
      setGuardandoDescripcion(false);
    }
  };

  // Manejar cambios en una pieza dental con autoguardado
  const handlePiezaChange = useCallback(async (numeroPieza, nuevoRegistro) => {
    setOdontogramaData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        odontograma: prevData.odontograma.map(item => {
          if (item.pieza_dental === numeroPieza) {
            return {
              ...item,
              registro: nuevoRegistro
            };
          }
          return item;
        })
      };
    });
    
    try {
      setGuardando(true);
      await guardarRegistroDental(parseInt(pacienteId), parseInt(numeroPieza), nuevoRegistro, odontogramaIdRef.current);
      setTimeout(() => setAlert({ type: '', message: '' }), 2000);
    } catch (error) {
      console.error(`Error al guardar pieza ${numeroPieza}:`, error);
      setAlert({
        type: 'error',
        message: `Error al guardar los cambios en la pieza ${numeroPieza}`
      });
    } finally {
      setGuardando(false);
    }
  }, [pacienteId]);

  // Navegar a la página de nuevo seguimiento
  const handleNuevoSeguimiento = useCallback(() => {
    navigate(`/seguimiento-paciente/${pacienteId}`);
  }, [navigate, pacienteId]);

  // Exportar PDF
  const handleExportarPDF = async () => {
    setExportando(true);
    try {
      setModoCaptura(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await exportarHistorialPacientePDF(
        pacienteId,
        odontogramaData?.paciente?.nombre_completo || 'Paciente',
        odontogramaRef,
        descripcion
      );
      setAlert({ type: 'success', message: 'PDF exportado exitosamente' });
      setTimeout(() => setAlert({ type: '', message: '' }), 3000);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      setAlert({ type: 'error', message: 'Error al exportar el PDF' });
    } finally {
      setModoCaptura(false);
      setExportando(false);
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
                {odontogramaData?.fecha_creacion && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Creado: {formatFecha(odontogramaData.fecha_creacion)}
                  </p>
                )}
              </div>
            </div>
            
            {/* Indicador de guardado y botones */}
            <div className="flex items-center gap-3">
              {guardando && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium">Guardando...</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportarPDF}
                disabled={exportando || !odontogramaData}
              >
                {exportando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-white/5 backdrop-blur-sm">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-6">
          
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ type: '', message: '' })}
          />

          {/* Botones de Nuevo Odontograma y Ver Odontogramas */}
          {!loading && odontogramaData && (
            <div className="flex flex-wrap gap-3 mb-4 justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleNuevoOdontograma}
                disabled={creandoNuevo}
              >
                {creandoNuevo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <FilePlus className="w-4 h-4 mr-2" />
                    Nuevo Odontograma
                  </>
                )}
              </Button>
              {totalOdontogramas > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerOdontogramas}
                  className="bg-white"
                >
                  <List className="w-4 h-4 mr-2" />
                  Ver Odontogramas ({totalOdontogramas})
                </Button>
              )}
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando odontograma...</p>
              </CardContent>
            </Card>
          ) : odontogramaData ? (
            <>
              <div ref={odontogramaRef}>
                <Odontograma 
                  odontograma={odontogramaData.odontograma} 
                  onChange={handlePiezaChange}
                  onNuevoSeguimiento={handleNuevoSeguimiento}
                  modoCaptura={modoCaptura}
                />
              </div>
              {/* Cuadro de texto de descripción general */}
              <div className="max-w-2xl mx-auto mt-8 bg-white rounded-lg shadow-md p-6">
                <label htmlFor="descripcion-odontograma" className="block text-sm font-semibold text-gray-900 mb-2">Descripción / Recordatorios</label>
                <textarea
                  id="descripcion-odontograma"
                  className="w-full min-h-[100px] rounded-lg border-2 border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all resize-y"
                  placeholder="Escriba aquí recordatorios, tratamientos, notas generales del paciente..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  disabled={guardandoDescripcion}
                />
                <div className="flex justify-end mt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGuardarDescripcion}
                    disabled={guardandoDescripcion}
                  >
                    {guardandoDescripcion ? 'Guardando...' : 'Guardar descripción'}
                  </Button>
                </div>
              </div>
            </>
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
      
      {/* Modal de confirmación de guardado */}
      <StatusModal
        isOpen={modalDescripcion.isOpen}
        status={modalDescripcion.status}
        title={modalDescripcion.title}
        message={modalDescripcion.message}
        onClose={() => setModalDescripcion({ ...modalDescripcion, isOpen: false })}
      />

      {/* Modal Lista de Odontogramas */}
      {mostrarListaOdontogramas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Odontogramas del paciente</h2>
                <button
                  onClick={() => setMostrarListaOdontogramas(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {loadingLista ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : listaOdontogramas.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay odontogramas registrados</p>
              ) : (
                <div className="space-y-2">
                  {listaOdontogramas.map((item, index) => (
                    <div key={item.id} className="relative">
                      {confirmandoEliminar === item.id ? (
                        <div className="p-4 rounded-lg border-2 border-red-300 bg-red-50">
                          <p className="text-sm font-semibold text-red-800 mb-3">
                            ¿Eliminar Odontograma #{listaOdontogramas.length - index}?
                          </p>
                          <p className="text-xs text-red-600 mb-3">
                            Se eliminarán todos los registros dentales de este odontograma. Esta acción no se puede deshacer.
                          </p>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setConfirmandoEliminar(null)}
                              disabled={eliminando}
                              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleEliminarOdontograma(item.id)}
                              disabled={eliminando}
                              className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-1"
                            >
                              {eliminando ? (
                                <>
                                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                                  Eliminando...
                                </>
                              ) : (
                                'Sí, eliminar'
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex items-stretch rounded-lg border-2 transition-all ${
                            item.id === odontogramaId
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          <button
                            onClick={() => handleSeleccionarOdontograma(item.id)}
                            className="flex-1 text-left p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Odontograma #{listaOdontogramas.length - index}
                                  {item.id === odontogramaId && (
                                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                      Actual
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatFecha(item.fecha_creacion)}
                                </p>
                                {item.odontologo_nombre && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Por: {item.odontologo_nombre}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-gray-500">
                                  {item.total_registros || 0} registros
                                </span>
                                <ChevronRight className="w-5 h-5 text-gray-400 mt-1 ml-auto" />
                              </div>
                            </div>
                            {item.descripcion_general && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">
                                {item.descripcion_general}
                              </p>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmandoEliminar(item.id);
                            }}
                            className="flex items-center px-3 border-l border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-r-lg"
                            title="Eliminar odontograma"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OdontogramaPage;
