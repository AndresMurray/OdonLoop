import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import { ArrowLeft, Plus, Calendar, Image as ImageIcon, FileText, User, File, X, Filter, Smile, Download } from 'lucide-react';
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
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSeguimientos, setTotalSeguimientos] = useState(0);
  
  // Modal de detalles
  const [seguimientoSeleccionado, setSeguimientoSeleccionado] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  
  // Filtros de búsqueda
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    descripcion: '',
    fecha_atencion: new Date().toISOString().split('T')[0],
    imagen_url: ''
  });
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    cargarPaciente();
  }, [pacienteId]);

  useEffect(() => {
    cargarSeguimientos();
  }, [pacienteId, currentPage, fechaDesde, fechaHasta]);

  const cargarPaciente = async () => {
    setLoadingPaciente(true);
    try {
      const data = await getPacienteById(pacienteId);
      setPaciente(data);
    } catch (err) {
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
      const data = await getSeguimientosPorPaciente(pacienteId, currentPage, fechaDesde, fechaHasta);
      setSeguimientos(data.results || []);
      setTotalSeguimientos(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 5));
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Error al cargar seguimientos',
        detail: err.response?.data?.error || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setAlert({ type: 'error', message: 'Cloudinary no configurado', detail: 'Configurar VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en .env' });
      return;
    }

    setSubiendoArchivo(true);

    for (const file of files) {
      try {
        const esImagen = file.type.startsWith('image/');
        // Usar 'image' para imágenes y 'raw' para documentos/PDFs
        const resourceType = esImagen ? 'image' : 'raw';
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'seguimientos');

        // Subir directamente a la API REST de Cloudinary con el resource_type correcto en la URL
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
          { method: 'POST', body: formData }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Error al subir archivo');
        }

        const data = await response.json();

        const nuevoArchivo = {
          tipo: esImagen ? 'imagen' : 'documento',
          url: data.secure_url,
          nombre_original: file.name,
          public_id: data.public_id
        };

        setArchivosSeleccionados(prev => [...prev, nuevoArchivo]);
        setAlert({ type: 'success', message: `Archivo cargado: ${file.name}` });
      } catch (err) {
        setAlert({ type: 'error', message: `Error al subir ${file.name}`, detail: err.message });
      }
    }

    setSubiendoArchivo(false);
    // Limpiar el input para poder subir el mismo archivo de nuevo
    e.target.value = '';
  };

  const eliminarArchivo = (index) => {
    setArchivosSeleccionados(prev => prev.filter((_, i) => i !== index));
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
        imagen_url: formData.imagen_url || null,
        archivos: archivosSeleccionados
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
      setArchivosSeleccionados([]);
      setMostrarFormulario(false);
      
      // Recargar seguimientos desde la primera página
      setCurrentPage(1);
      await cargarSeguimientos();
      
    } catch (err) {
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
    // Parsear la fecha sin conversión de timezone
    const [year, month, day] = fecha.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const limpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
    setCurrentPage(1);
  };

  const verDetalles = (seguimiento) => {
    setSeguimientoSeleccionado(seguimiento);
    setMostrarDetalles(true);
  };

  const cerrarDetalles = () => {
    setSeguimientoSeleccionado(null);
    setMostrarDetalles(false);
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/odontograma/${pacienteId}`)}
              >
                <Smile className="w-5 h-5 mr-2" />
                Odontograma
              </Button>
              <Button
                variant="primary"
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
              >
                <Plus className="w-5 h-5 mr-2" />
                {mostrarFormulario ? 'Cancelar' : 'Nuevo Seguimiento'}
              </Button>
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
                      Archivos e Imágenes (Opcional)
                    </label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFilesSelected}
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={handleFileUpload}
                        disabled={subiendoArchivo}
                        className="w-full border-2 border-dashed border-emerald-300 rounded-lg p-4 hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-emerald-600 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {subiendoArchivo ? (
                          <>
                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium">Subiendo archivos...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-6 h-6" />
                            <span className="text-sm font-medium">Agregar Archivos o Imágenes</span>
                            <span className="text-xs text-gray-400">JPG, PNG, PDF, DOC, DOCX, TXT</span>
                          </>
                        )}
                      </button>
                      
                      {archivosSeleccionados.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {archivosSeleccionados.map((archivo, index) => {
                            const esImg = archivo.tipo === 'imagen' && 
                              !archivo.nombre_original?.toLowerCase().endsWith('.pdf');
                            
                            return (
                              <div 
                                key={index}
                                className="relative border rounded-lg p-2 bg-gray-50 group"
                              >
                                {esImg ? (
                                  <img 
                                    src={archivo.url} 
                                    alt={archivo.nombre_original} 
                                    className="w-full h-16 object-cover rounded mb-1"
                                  />
                                ) : (
                                  <div className="w-full h-16 bg-red-50 rounded mb-1 flex flex-col items-center justify-center">
                                    <FileText className="w-6 h-6 text-red-500" />
                                    <span className="text-xs text-red-600 font-semibold mt-1">
                                      {(() => {
                                        const extension = archivo.nombre_original?.split('.').pop()?.toUpperCase();
                                        if (extension === 'PDF') return 'PDF';
                                        if (['DOC', 'DOCX'].includes(extension)) return 'DOC';
                                        if (['TXT'].includes(extension)) return 'TXT';
                                        return 'ARCHIVO';
                                      })()}
                                    </span>
                                  </div>
                                )}
                                <p className="text-xs text-gray-600 truncate">
                                  {archivo.nombre_original}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => eliminarArchivo(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
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
                        setArchivosSeleccionados([]);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading || subiendoArchivo}
                    >
                      {loading ? 'Guardando...' : 'Guardar Seguimiento'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lista de seguimientos - se oculta cuando se muestra el formulario */}
          {!mostrarFormulario && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-emerald-600" />
                  Historial de Seguimientos
                  {(fechaDesde || fechaHasta) && (
                    <span className="text-sm font-normal text-gray-500">
                      ({totalSeguimientos} resultados)
                    </span>
                  )}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {mostrarFiltros ? 'Ocultar Filtros' : 'Filtrar por Fecha'}
                </Button>
              </div>
              
              {/* Panel de filtros */}
              {mostrarFiltros && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        label="Fecha Desde"
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => {
                          setFechaDesde(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        label="Fecha Hasta"
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => {
                          setFechaHasta(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={limpiarFiltros}
                      disabled={!fechaDesde && !fechaHasta}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpiar
                    </Button>
                  </div>
                  {(fechaDesde || fechaHasta) && (
                    <div className="mt-3 text-sm text-gray-600">
                      Mostrando seguimientos {fechaDesde && `desde el ${formatearFecha(fechaDesde)}`} {fechaHasta && `hasta el ${formatearFecha(fechaHasta)}`}
                    </div>
                  )}
                </div>
              )}
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
                <div className="space-y-3">
                  {seguimientos.map((seguimiento) => (
                    <div 
                      key={seguimiento.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                            <span className="font-semibold text-lg text-gray-900">
                              {formatearFecha(seguimiento.fecha_atencion)}
                            </span>
                            {(seguimiento.archivos?.length > 0 || seguimiento.imagen_url) && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                <ImageIcon className="w-3 h-3" />
                                {seguimiento.archivos?.length || 1} archivo(s)
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                            {seguimiento.descripcion}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Registrado: {new Date(seguimiento.fecha_creacion).toLocaleDateString('es-AR')}</span>
                            <span>Por: {seguimiento.odontologo_nombre}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => verDetalles(seguimiento)}
                          className="ml-4"
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={5}
                    totalItems={totalSeguimientos}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          )}

        </div>
      </main>

      {/* Modal de detalles del seguimiento */}
      {mostrarDetalles && seguimientoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                Detalles del Seguimiento
              </h3>
              <button
                onClick={cerrarDetalles}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Fecha */}
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-6 h-6 text-emerald-600" />
                <span className="font-semibold text-xl text-gray-900">
                  {formatearFecha(seguimientoSeleccionado.fecha_atencion)}
                </span>
              </div>

              {/* Descripción */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Descripción:</h4>
                <p className="text-gray-800 whitespace-pre-wrap">
                  {seguimientoSeleccionado.descripcion}
                </p>
              </div>

              {/* Archivos e imágenes */}
              {seguimientoSeleccionado.archivos && seguimientoSeleccionado.archivos.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-3">
                    Archivos adjuntos ({seguimientoSeleccionado.archivos.length}):
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {seguimientoSeleccionado.archivos.map((archivo) => {
                      // Detectar si es PDF por extensión o URL
                      const esPDF = archivo.nombre_original?.toLowerCase().endsWith('.pdf') || 
                                   archivo.url.toLowerCase().includes('.pdf');
                      const esDoc = archivo.tipo === 'documento' || esPDF;
                      const esImagen = archivo.tipo === 'imagen' && !esPDF;

                      const handleOpenFile = async () => {
                        if (esImagen) {
                          window.open(archivo.url, '_blank');
                          return;
                        }
                        
                        // Para PDFs y documentos: descargar a través del backend (evita CORS)
                        try {
                          const token = localStorage.getItem('access_token');
                          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                          const proxyUrl = `${API_URL}/api/pacientes/descargar-archivo/?url=${encodeURIComponent(archivo.url)}`;
                          
                          const response = await fetch(proxyUrl, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          
                          if (!response.ok) throw new Error('Error en la descarga');
                          
                          const blob = await response.blob();
                          const blobUrl = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = archivo.nombre_original || 'documento.pdf';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(blobUrl);
                        } catch (err) {
                          window.open(archivo.url, '_blank');
                        }
                      };

                      return (
                        <div 
                          key={archivo.id}
                          className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={handleOpenFile}
                        >
                          {esImagen ? (
                            <img 
                              src={archivo.url}
                              alt={archivo.nombre_original || 'Imagen'}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-red-50 flex flex-col items-center justify-center p-4">
                              <FileText className="w-12 h-12 text-red-500 mb-2" />
                              <span className="text-xs font-semibold text-red-600 uppercase mb-1">
                                {esPDF ? 'PDF' : 'DOC'}
                              </span>
                              <span className="text-xs text-gray-600 text-center break-words line-clamp-2">
                                {archivo.nombre_original || 'Documento'}
                              </span>
                              <div className="flex items-center gap-1 mt-2 text-blue-600">
                                <Download className="w-4 h-4" />
                                <span className="text-xs font-medium">Descargar</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Imagen legacy (para seguimientos antiguos) */}
              {seguimientoSeleccionado.imagen_url && (!seguimientoSeleccionado.archivos || seguimientoSeleccionado.archivos.length === 0) && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-3">Imagen:</h4>
                  <img 
                    src={seguimientoSeleccionado.imagen_url}
                    alt="Imagen del seguimiento"
                    className="max-w-full rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(seguimientoSeleccionado.imagen_url, '_blank')}
                  />
                </div>
              )}

              {/* Información adicional */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Atendido por: <span className="font-medium">{seguimientoSeleccionado.odontologo_nombre}</span></span>
                </div>
                <div className="text-sm text-gray-500">
                  Registrado: {new Date(seguimientoSeleccionado.fecha_creacion).toLocaleString('es-AR', { hour12: false })}
                </div>
              </div>

              {/* Botón cerrar */}
              <div className="mt-6 flex justify-end">
                <Button
                  variant="primary"
                  onClick={cerrarDetalles}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default SeguimientoPacientePage;
