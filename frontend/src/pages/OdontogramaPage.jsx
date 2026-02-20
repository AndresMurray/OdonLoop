import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Odontograma from '../components/Odontograma';
import { ArrowLeft } from 'lucide-react';
import { 
  getOdontograma,
  guardarRegistroDental
} from '../api/odontogramaService';

const OdontogramaPage = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  
  const [odontogramaData, setOdontogramaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
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

  // Manejar cambios en una pieza dental con autoguardado
  const handlePiezaChange = async (numeroPieza, nuevoRegistro) => {
    // Actualizar el estado local del odontograma inmediatamente
    if (odontogramaData) {
      const nuevoOdontograma = odontogramaData.odontograma.map(item => {
        if (item.pieza_dental === numeroPieza) {
          return {
            ...item,
            registro: nuevoRegistro
          };
        }
        return item;
      });
      
      setOdontogramaData({
        ...odontogramaData,
        odontograma: nuevoOdontograma
      });
    }
    
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
                  Odontograma Profesional
                </h1>
                {odontogramaData?.paciente && (
                  <p className="text-gray-600 mt-1">
                    {odontogramaData.paciente.nombre_completo}
                    {odontogramaData.paciente.dni && ` - DNI: ${odontogramaData.paciente.dni}`}
                  </p>
                )}
              </div>
            </div>
            
            {/* Indicador de guardado */}
            {guardando && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Guardando...</span>
              </div>
            )}
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
            <Odontograma 
              odontograma={odontogramaData.odontograma} 
              onChange={handlePiezaChange}
              onNuevoSeguimiento={handleNuevoSeguimiento}
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
    </div>
  );
};

export default OdontogramaPage;
