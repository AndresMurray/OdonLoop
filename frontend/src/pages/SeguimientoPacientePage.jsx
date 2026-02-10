import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft, Plus, Calendar, Image as ImageIcon, FileText, User } from 'lucide-react';
import { getSeguimientosPorPaciente, crearSeguimiento } from '../api/seguimientoService';
import { getPacienteById } from '../api/userService';

const SeguimientoPacientePage = () => {
  const navigate = useNavigate();
  const { pacienteId } = useParams();
  
  const [paciente, setPaciente] = useState(null);
  const [seguimientos, setSeguimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPaciente, setLoadingPaciente] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '', detail: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    descripcion: '',
    fecha_atencion: new Date().toISOString().split('T')[0],
    imagen_url: ''
  });
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [pacienteId]);

  const cargarDatos = async () => {
    await Promise.all([cargarPaciente(), cargarSeguimientos()]);
  };

  const cargarPaciente = async () => {
    setLoadingPaciente(true);
    try {
      const data = await getPacienteById(pacienteId);
      setPaciente(data);
    } catch (err) {
      console.error('Error al cargar paciente:', err);
      setAlert({
        type: 'error',
        message: 'Error al cargar información del paciente',
        detail: err.response?.data?.error || err.message
      });
    } finally {
      setLoadingPaciente(false);
    }
  };

  const cargarSeguimientos = async () => {
    setLoading(true);
    try {
      const data = await getSeguimientosPorPaciente(pacienteId);
      setSeguimientos(data);
    } catch (err) {
      console.error('Error al cargar seguimientos:', err);
      setAlert({
        type: 'error',
        message: 'Error al cargar seguimientos',
        detail: err.response?.data?.error || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = () => {
    // Abrir el widget de Cloudinary
    if (window.cloudinary) {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
          uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
          sources: ['local', 'camera'],
          multiple: false,
          maxFileSize: 5000000, // 5MB
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          resourceType: 'image',
          folder: 'seguimientos',
          cropping: false,
          showSkipCropButton: false,
          language: 'es',
          text: {
            es: {
              or: 'o',
              back: 'Atrás',
              close: 'Cerrar',
              no_results: 'Sin resultados',
              search_placeholder: 'Buscar archivos',
              about_uw: 'Sobre el widget de carga',
              menu: {
                files: 'Mis archivos',
                web: 'Dirección web',
                camera: 'Cámara'
              },
              local: {
                browse: 'Buscar',
                dd_title_single: 'Arrastra y suelta una imagen aquí',
                drop_title_single: 'Suelta la imagen para cargar'
              }
            }
          }
        },
        (error, result) => {
          if (error) {
            console.error('Error al subir imagen:', error);
            setAlert({
              type: 'error',
              message: 'Error al subir imagen',
              detail: error.message
            });
            setSubiendoImagen(false);
          }
          
          if (result && result.event === 'success') {
            setFormData(prev => ({
              ...prev,
              imagen_url: result.info.secure_url
            }));
            setImagenSeleccionada({
              url: result.info.secure_url,
              thumbnail: result.info.thumbnail_url
            });
            setSubiendoImagen(false);
            setAlert({
              type: 'success',
              message: 'Imagen cargada exitosamente'
            });
          }
          
          if (result && result.event === 'queues-end') {
            setSubiendoImagen(false);
          }
        }
      );
      
      setSubiendoImagen(true);
      widget.open();
    } else {
      setAlert({
        type: 'error',
        message: 'Error',
        detail: 'El widget de Cloudinary no está disponible'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.descripcion.trim()) {
      setAlert({
        type: 'error',
        message: 'La descripción es obligatoria'
      });
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
        paciente: parseInt(pacienteId),
        descripcion: formData.descripcion,
        fecha_atencion: formData.fecha_atencion,
        imagen_url: formData.imagen_url || null
      };

      await crearSeguimiento(dataToSend);
      
      setAlert({
        type: 'success',
        message: 'Seguimiento creado exitosamente'
      });
      
      // Reset form
      setFormData({
        descripcion: '',
        fecha_atencion: new Date().toISOString().split('T')[0],
        imagen_url: ''
      });
      setImagenSeleccionada(null);
      setMostrarFormulario(false);
      
      // Recargar seguimientos
      await cargarSeguimientos();
      
    } catch (err) {
      console.error('Error al crear seguimiento:', err);
      setAlert({
        type: 'error',
        message: 'Error al crear seguimiento',
        detail: err.response?.data?.error || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
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
                onClick={() => navigate('/mis-pacientes')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {loadingPaciente ? 'Cargando...' : `Seguimiento de ${paciente?.nombre_completo}`}
                </h1>
                <p className="text-gray-600 mt-1">
                  Historial y nuevo registro de seguimiento
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
            >
              <Plus className="w-5 h-5 mr-2" />
              {mostrarFormulario ? 'Cancelar' : 'Nuevo Seguimiento'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <Alert
            type={alert.type}
            message={alert.message}
            detail={alert.detail}
            onClose={() => setAlert({ type: '', message: '', detail: '' })}
          />

          {/* Información del paciente */}
          {paciente && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-4 rounded-full">
                    <User className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-gray-900">{paciente.nombre_completo}</h2>
                    <div className="flex items-center gap-6 mt-2 text-gray-600">
                      {paciente.dni && <span>DNI: {paciente.dni}</span>}
                      {paciente.email && <span>📧 {paciente.email}</span>}
                      {paciente.telefono && <span>📱 {paciente.telefono}</span>}
                    </div>
                    {paciente.obra_social_detalle && (
                      <div className="mt-2 text-gray-600">
                        <span className="font-medium">Obra Social:</span> {paciente.obra_social_detalle.nombre}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulario de nuevo seguimiento */}
          {mostrarFormulario && (
            <Card className="mb-6 border-2 border-emerald-500">
              <CardHeader>
                <CardTitle className="text-emerald-700">Nuevo Seguimiento</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label="Fecha de Atención"
                    type="date"
                    name="fecha_atencion"
                    value={formData.fecha_atencion}
                    onChange={handleInputChange}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción del Seguimiento *
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Describe el tratamiento, observaciones, diagnóstico, etc..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagen (Opcional)
                    </label>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleImageUpload}
                        disabled={subiendoImagen}
                      >
                        <ImageIcon className="w-5 h-5 mr-2" />
                        {subiendoImagen ? 'Subiendo...' : 'Seleccionar Imagen'}
                      </Button>
                      {imagenSeleccionada && (
                        <div className="flex items-center gap-2">
                          <img 
                            src={imagenSeleccionada.url} 
                            alt="Preview" 
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <span className="text-sm text-green-600">✓ Imagen cargada</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setMostrarFormulario(false);
                        setFormData({
                          descripcion: '',
                          fecha_atencion: new Date().toISOString().split('T')[0],
                          imagen_url: ''
                        });
                        setImagenSeleccionada(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading || subiendoImagen}
                    >
                      {loading ? 'Guardando...' : 'Guardar Seguimiento'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lista de seguimientos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                Historial de Seguimientos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading && seguimientos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando seguimientos...</p>
                </div>
              ) : seguimientos.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">No hay seguimientos registrados</p>
                  <p className="text-gray-500 mt-2">
                    Comienza creando el primer seguimiento para este paciente
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {seguimientos.map((seguimiento) => (
                    <div 
                      key={seguimiento.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                          <span className="font-semibold text-lg text-gray-900">
                            {formatearFecha(seguimiento.fecha_atencion)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          Registrado: {new Date(seguimiento.fecha_creacion).toLocaleString('es-AR')}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg mb-3">
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {seguimiento.descripcion}
                        </p>
                      </div>
                      
                      {seguimiento.imagen_url && (
                        <div className="mt-3">
                          <img 
                            src={seguimiento.imagen_url}
                            alt="Imagen del seguimiento"
                            className="max-w-md w-full rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(seguimiento.imagen_url, '_blank')}
                          />
                        </div>
                      )}
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                          Atendido por: <span className="font-medium">{seguimiento.odontologo_nombre}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SeguimientoPacientePage;
