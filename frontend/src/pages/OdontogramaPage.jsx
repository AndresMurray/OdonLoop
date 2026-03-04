import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Odontograma from '../components/Odontograma';
import StatusModal from '../components/StatusModal';
import { ArrowLeft, FileDown } from 'lucide-react';
import { 
  getOdontograma,
  guardarRegistroDental,
  guardarDescripcionGeneral
} from '../api/odontogramaService';
import { exportarHistorialPacientePDF } from '../utils/exportarPDF';

const OdontogramaPage = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  
  const [odontogramaData, setOdontogramaData] = useState(null);
  // Descripción general editable
  const [descripcion, setDescripcion] = useState('');
  const [guardandoDescripcion, setGuardandoDescripcion] = useState(false);
  const [modalDescripcion, setModalDescripcion] = useState({ isOpen: false, status: 'loading', message: '' });
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [guardando, setGuardando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const odontogramaRef = useRef(null);

  useEffect(() => {
    cargarOdontograma();
  }, [pacienteId]);

  const cargarOdontograma = async () => {
    setLoading(true);
    try {
      const data = await getOdontograma(pacienteId);
      setOdontogramaData(data);
      // Si el backend devuelve una descripción general, cargarla
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

  // Guardar la descripción general
  const handleGuardarDescripcion = async () => {
    setGuardandoDescripcion(true);
    setModalDescripcion({ isOpen: true, status: 'loading', message: 'Guardando descripción...' });
    try {
      await guardarDescripcionGeneral(pacienteId, descripcion);
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
  const handlePiezaChange = async (numeroPieza, nuevoRegistro) => {
    // Actualizar el estado local del odontograma inmediatamente
    // Usar updater funcional para que funcione correctamente con múltiples cambios rápidos
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
    
    // Guardar automáticamente en el backend
    try {
      setGuardando(true);
      await guardarRegistroDental(parseInt(pacienteId), parseInt(numeroPieza), nuevoRegistro);
      // Mostrar notificación de éxito brevemente
      setAlert({
        type: 'success',
        message: 'Cambio guardado automáticamente'
      });
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
  };



  // Navegar a la página de nuevo seguimiento
  const handleNuevoSeguimiento = () => {
    navigate(`/seguimiento-paciente/${pacienteId}`);
  };

  // Exportar PDF
  const handleExportarPDF = async () => {
    setExportando(true);
    try {
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
      setExportando(false);
    }
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
            
            {/* Indicador de guardado y botón exportar */}
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
    </div>
  );
};

export default OdontogramaPage;
