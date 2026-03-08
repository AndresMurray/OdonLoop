import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import Odontograma from '../components/Odontograma';
import { ArrowLeft, Plus, Calendar, Image as ImageIcon, FileText, User, File, X, Filter, Smile, Download, FileDown, Pencil, Trash2 } from 'lucide-react';
import ModalEditarPaciente from '../components/ModalEditarPaciente';
import { getSeguimientosPorPaciente, crearSeguimiento, actualizarSeguimiento, eliminarSeguimiento } from '../api/seguimientoService';
import { getPacienteById } from '../api/userService';
import { getOdontograma } from '../api/odontogramaService';
import { exportarHistorialPacientePDF } from '../utils/exportarPDF';

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
  const [imagenPreview, setImagenPreview] = useState(null);

  // Filtros de búsqueda
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Editar seguimiento
  const [editandoSeguimiento, setEditandoSeguimiento] = useState(null);
  
  // Modal editar paciente
  const [mostrarEditarPaciente, setMostrarEditarPaciente] = useState(false);
  const [editFormData, setEditFormData] = useState({ descripcion: '', fecha_atencion: '' });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [editArchivosExistentes, setEditArchivosExistentes] = useState([]);
  const [editArchivosNuevos, setEditArchivosNuevos] = useState([]);
  const [subiendoArchivoEdit, setSubiendoArchivoEdit] = useState(false);
  const editFileInputRef = useRef(null);

  // Eliminar seguimiento
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // PDF Export
  const [exportando, setExportando] = useState(false);
  const [odontogramaData, setOdontogramaData] = useState(null);
  const odontogramaRef = useRef(null);
  const [showOdontogramaModal, setShowOdontogramaModal] = useState(false);
  const [odontogramaParaCaptura, setOdontogramaParaCaptura] = useState(null);
  const captureWrapperRef = useRef(null);

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

  // --- Editar seguimiento ---
  const abrirEdicion = (seguimiento) => {
    setEditandoSeguimiento(seguimiento);
    setEditFormData({
      descripcion: seguimiento.descripcion,
      fecha_atencion: seguimiento.fecha_atencion
    });
    setEditArchivosExistentes(seguimiento.archivos || []);
    setEditArchivosNuevos([]);
  };

  const cerrarEdicion = () => {
    setEditandoSeguimiento(null);
    setEditFormData({ descripcion: '', fecha_atencion: '' });
    setEditArchivosExistentes([]);
    setEditArchivosNuevos([]);
  };

  const handleEditFileUpload = () => {
    editFileInputRef.current?.click();
  };

  const handleEditFilesSelected = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setAlert({ type: 'error', message: 'Cloudinary no configurado', detail: 'Configurar VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en .env' });
      return;
    }

    setSubiendoArchivoEdit(true);

    for (const file of files) {
      try {
        const esImagen = file.type.startsWith('image/');
        const resourceType = esImagen ? 'image' : 'raw';

        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', uploadPreset);
        fd.append('folder', 'seguimientos');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
          { method: 'POST', body: fd }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Error al subir archivo');
        }

        const data = await response.json();

        setEditArchivosNuevos(prev => [...prev, {
          tipo: esImagen ? 'imagen' : 'documento',
          url: data.secure_url,
          nombre_original: file.name,
          public_id: data.public_id
        }]);
        setAlert({ type: 'success', message: `Archivo cargado: ${file.name}` });
      } catch (err) {
        setAlert({ type: 'error', message: `Error al subir ${file.name}`, detail: err.message });
      }
    }

    setSubiendoArchivoEdit(false);
    e.target.value = '';
  };

  const eliminarArchivoExistente = (index) => {
    setEditArchivosExistentes(prev => prev.filter((_, i) => i !== index));
  };

  const eliminarArchivoNuevo = (index) => {
    setEditArchivosNuevos(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!editFormData.descripcion.trim()) {
      setAlert({ type: 'error', message: 'La descripción es obligatoria' });
      return;
    }
    setGuardandoEdicion(true);
    try {
      // Combinar archivos existentes (con id) y nuevos (sin id)
      const archivosParaEnviar = [
        ...editArchivosExistentes.map(a => ({ id: a.id, tipo: a.tipo, url: a.url, nombre_original: a.nombre_original, public_id: a.public_id })),
        ...editArchivosNuevos.map(a => ({ tipo: a.tipo, url: a.url, nombre_original: a.nombre_original, public_id: a.public_id }))
      ];
      await actualizarSeguimiento(editandoSeguimiento.id, {
        paciente: parseInt(pacienteId),
        descripcion: editFormData.descripcion,
        fecha_atencion: editFormData.fecha_atencion,
        archivos: archivosParaEnviar
      });
      setAlert({ type: 'success', message: 'Seguimiento actualizado exitosamente' });
      cerrarEdicion();
      await cargarSeguimientos();
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Error al actualizar seguimiento',
        detail: err.response?.data?.error || err.message
      });
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // --- Eliminar seguimiento ---
  const handleEliminarSeguimiento = async () => {
    if (!confirmandoEliminar) return;
    setEliminando(true);
    try {
      await eliminarSeguimiento(confirmandoEliminar.id);
      setAlert({ type: 'success', message: 'Seguimiento eliminado exitosamente' });
      setConfirmandoEliminar(null);
      // Si era el último de la página, retroceder
      if (seguimientos.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await cargarSeguimientos();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Error al eliminar seguimiento',
        detail: err.response?.data?.error || err.message
      });
    } finally {
      setEliminando(false);
    }
  };

  // Exportar PDF
  const handleExportarPDF = async () => {
    setExportando(true);
    try {
      // Cargar odontograma: usar variable local para no depender del estado React actualizado
      let odontogramaLocal = odontogramaData;
      if (!odontogramaLocal) {
        const data = await getOdontograma(pacienteId);
        setOdontogramaData(data);
        odontogramaLocal = data; // ← variable local siempre tiene el dato fresco
      }

      // Guardar en el estado de captura (para el modal) y mostrar el modal
      setOdontogramaParaCaptura(odontogramaLocal);
      setShowOdontogramaModal(true);

      // Esperar que el modal y el odontograma se rendericen completamente
      // (incluye requestAnimationFrame + setTimeout 100ms + setTimeout 500ms del componente)
      await new Promise(resolve => setTimeout(resolve, 1500));

      await exportarHistorialPacientePDF(
        pacienteId,
        paciente?.nombre_completo || 'Paciente',
        captureWrapperRef,
        '',
        paciente
      );
      setShowOdontogramaModal(false);
      setOdontogramaParaCaptura(null);
      setAlert({
        type: 'success',
        message: 'PDF exportado exitosamente'
      });
    } catch (err) {
      setShowOdontogramaModal(false);
      setOdontogramaParaCaptura(null);
      console.error('Error al exportar PDF:', err);
      setAlert({
        type: 'error',
        message: 'Error al exportar PDF',
        detail: err.message
      });
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/mis-pacientes')}
                className="shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {loadingPaciente ? 'Cargando...' : `Seguimiento de ${paciente?.nombre_completo}`}
                </h1>
                <p className="text-gray-600 mt-0.5 text-sm sm:text-base">
                  Historial y nuevo registro de seguimiento
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleExportarPDF}
                disabled={exportando}
                className="text-sm"
              >
                {exportando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-1" />
                    Exportar PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/odontograma/${pacienteId}`)}
                className="text-sm"
              >
                <Smile className="w-4 h-4 mr-1" />
                Odontograma
              </Button>
              <Button
                variant="primary"
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
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
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-100 p-4 rounded-full">
                    <User className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-gray-900">{paciente.nombre_completo}</h2>
                    
                    {/* Datos de contacto */}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                      {paciente.dni && <span>DNI: {paciente.dni}</span>}
                      {paciente.email && <span>📧 {paciente.email}</span>}
                      {paciente.telefono && <span>📱 {paciente.telefono}</span>}
                      {paciente.fecha_nacimiento && (
                        <span>Nac: {new Date(paciente.fecha_nacimiento).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}</span>
                      )}
                    </div>

                    {/* Dirección */}
                    {paciente.direccion && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Dirección:</span> {paciente.direccion}
                      </div>
                    )}

                    {/* Obra Social */}
                    {(paciente.obra_social_detalle || paciente.obra_social_otra) && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Obra Social:</span>{' '}
                        {paciente.obra_social_otra
                          ? paciente.obra_social_otra
                          : paciente.obra_social_detalle?.sigla
                            ? `${paciente.obra_social_detalle.sigla} - ${paciente.obra_social_detalle.nombre}`
                            : paciente.obra_social_detalle?.nombre
                        }
                      </div>
                    )}

                    {/* Nro Afiliado y Plan */}
                    {(paciente.numero_afiliado || paciente.plan) && (
                      <div className="mt-1 text-sm text-gray-600 flex gap-4">
                        {paciente.numero_afiliado && (
                          <span><span className="font-medium">Nro Afiliado:</span> {paciente.numero_afiliado}</span>
                        )}
                        {paciente.plan && (
                          <span><span className="font-medium">Plan:</span> {paciente.plan}</span>
                        )}
                      </div>
                    )}

                    {/* Información médica */}
                    {(paciente.antecedentes_medicos || paciente.alergias) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                        {paciente.antecedentes_medicos && (
                          <div className="mb-2">
                            <span className="font-medium text-gray-700">Antecedentes:</span>{' '}
                            <span className="text-gray-600">{paciente.antecedentes_medicos}</span>
                          </div>
                        )}
                        {paciente.alergias && (
                          <div>
                            <span className="font-medium text-red-700">Alergias:</span>{' '}
                            <span className="text-red-600">{paciente.alergias}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarEditarPaciente(true)}
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 shrink-0"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
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
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {archivosSeleccionados.map((archivo, index) => {
                            const esImg = archivo.tipo === 'imagen' &&
                              !archivo.nombre_original?.toLowerCase().endsWith('.pdf');

                            return (
                              <div
                                key={index}
                                className="relative border-2 border-gray-200 rounded-xl p-3 bg-white hover:shadow-lg transition-all duration-200 group"
                              >
                                {esImg ? (
                                  <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                      src={archivo.url}
                                      alt={archivo.nombre_original}
                                      className="w-full h-full object-contain hover:scale-110 transition-transform duration-200"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full h-32 bg-gradient-to-br from-red-50 to-red-100 rounded-lg mb-2 flex flex-col items-center justify-center border border-red-200">
                                    <FileText className="w-10 h-10 text-red-500 mb-2" />
                                    <span className="text-sm text-red-600 font-bold px-3 py-1 bg-white rounded-full shadow-sm">
                                      {(() => {
                                        const extension = archivo.nombre_original?.split('.').pop()?.toUpperCase();
                                        if (extension === 'PDF') return 'PDF';
                                        if (['DOC', 'DOCX'].includes(extension)) return 'DOC';
                                        if (['TXT'].includes(extension)) return 'TXT';
                                        return 'FILE';
                                      })()}
                                    </span>
                                  </div>
                                )}
                                <p className="text-xs font-medium text-gray-700 truncate px-1" title={archivo.nombre_original}>
                                  {archivo.nombre_original}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => eliminarArchivo(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                                  title="Eliminar archivo"
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
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verDetalles(seguimiento)}
                            >
                              Ver Detalles
                            </Button>
                            <button
                              onClick={() => abrirEdicion(seguimiento)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar seguimiento"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmandoEliminar(seguimiento)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar seguimiento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Archivos adjuntos ({seguimientoSeleccionado.archivos.length})
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
                          setImagenPreview(archivo);
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
                          className="group border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-emerald-400 transition-all duration-200 cursor-pointer"
                          onClick={handleOpenFile}
                        >
                          {esImagen ? (
                            <div className="relative w-full h-48 bg-gray-100">
                              <img
                                src={archivo.url}
                                alt={archivo.nombre_original || 'Imagen'}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full p-2 shadow-lg">
                                  <Download className="w-5 h-5 text-emerald-600" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center p-4 group-hover:from-red-100 group-hover:to-red-200 transition-all duration-200">
                              <FileText className="w-14 h-14 text-red-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
                              <span className="text-sm font-bold text-red-600 uppercase mb-2 px-3 py-1 bg-white rounded-full shadow-sm">
                                {esPDF ? 'PDF' : 'DOC'}
                              </span>
                              <div className="flex items-center gap-2 mt-2 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Download className="w-4 h-4" />
                                <span className="text-xs font-semibold">Abrir/Descargar</span>
                              </div>
                            </div>
                          )}
                          <div className="p-2 bg-white border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 truncate" title={archivo.nombre_original}>
                              {archivo.nombre_original || 'Documento'}
                            </p>
                          </div>
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

      {/* Lightbox de previsualización de imagen */}
      {imagenPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4 cursor-zoom-out"
          onClick={() => setImagenPreview(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-2 right-0 flex items-center gap-2 z-10">
              <a
                href={imagenPreview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                title="Abrir en nueva pestaña"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-5 h-5 text-gray-700" />
              </a>
              <button
                onClick={() => setImagenPreview(null)}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            <img
              src={imagenPreview.url}
              alt={imagenPreview.nombre_original || 'Imagen'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <p className="mt-3 text-white text-sm font-medium bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {imagenPreview.nombre_original || 'Imagen'}
            </p>
          </div>
        </div>
      )}

      {/* Modal de edición de seguimiento */}
      {editandoSeguimiento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                Editar Seguimiento
              </h3>
              <button
                onClick={cerrarEdicion}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleGuardarEdicion} className="p-6 space-y-6">
              <Input
                label="Fecha de Atención"
                type="date"
                name="fecha_atencion"
                value={editFormData.fecha_atencion}
                onChange={handleEditInputChange}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Seguimiento *
                </label>
                <textarea
                  name="descripcion"
                  value={editFormData.descripcion}
                  onChange={handleEditInputChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe el tratamiento, observaciones, diagnóstico..."
                  required
                />
              </div>

              {/* Archivos existentes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivos
                </label>
                {editArchivosExistentes.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {editArchivosExistentes.map((archivo, index) => (
                      <div key={`existente-${archivo.id}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {archivo.tipo === 'imagen' ? (
                            <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                          ) : (
                            <File className="w-4 h-4 text-gray-500 shrink-0" />
                          )}
                          <a
                            href={archivo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline truncate"
                          >
                            {archivo.nombre_original}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarArchivoExistente(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors shrink-0 ml-2"
                          title="Quitar archivo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Archivos nuevos */}
                {editArchivosNuevos.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {editArchivosNuevos.map((archivo, index) => (
                      <div key={`nuevo-${index}`} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {archivo.tipo === 'imagen' ? (
                            <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                          ) : (
                            <File className="w-4 h-4 text-gray-500 shrink-0" />
                          )}
                          <span className="text-sm text-gray-700 truncate">{archivo.nombre_original}</span>
                          <span className="text-xs text-green-600 font-medium shrink-0">(nuevo)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarArchivoNuevo(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors shrink-0 ml-2"
                          title="Quitar archivo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {editArchivosExistentes.length === 0 && editArchivosNuevos.length === 0 && (
                  <p className="text-sm text-gray-400 italic mb-3">Sin archivos adjuntos</p>
                )}

                <input
                  ref={editFileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleEditFilesSelected}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEditFileUpload}
                  disabled={subiendoArchivoEdit}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {subiendoArchivoEdit ? 'Subiendo...' : 'Agregar Archivos'}
                </Button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={cerrarEdicion}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={guardandoEdicion || subiendoArchivoEdit}>
                  {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmandoEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Eliminar Seguimiento</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Fecha:</span> {formatearFecha(confirmandoEliminar.fecha_atencion)}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {confirmandoEliminar.descripcion}
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este seguimiento?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmandoEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </Button>
              <button
                onClick={handleEliminarSeguimiento}
                disabled={eliminando}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal odontograma para screenshot PDF */}
      {showOdontogramaModal && odontogramaParaCaptura && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.97)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          overflowY: 'auto',
        }}>
          {/*
            ref apunta al div wrapper exterior (no al componente Odontograma).
            Así html2canvas captura todo el contenido sin problemas de isolation:isolate.
          */}
          <div
            ref={captureWrapperRef}
            style={{ width: '1200px', background: 'white', padding: '16px' }}
          >
            <Odontograma
              odontograma={odontogramaParaCaptura.odontograma}
              onChange={() => { }}
              onNuevoSeguimiento={() => { }}
              modoCaptura={true}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Editar Paciente */}
      <ModalEditarPaciente
        isOpen={mostrarEditarPaciente}
        onClose={() => setMostrarEditarPaciente(false)}
        paciente={paciente}
        onGuardado={(pacienteActualizado) => {
          setPaciente(pacienteActualizado);
          setAlert({ type: 'success', message: 'Paciente actualizado exitosamente' });
        }}
      />

      <Footer />
    </div>
  );
};

export default SeguimientoPacientePage;
