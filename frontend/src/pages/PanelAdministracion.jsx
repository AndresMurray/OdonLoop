import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOdontologos, aprobarOdontologo, suspenderOdontologo, activarOdontologo, updatePlan, cambiarPlanOdontologo } from '../api/adminService';
import { getPlanes } from '../api/odontologoService';
import { authService } from '../api/authService';
import Button from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UserCheck, UserX, Clock, CheckCircle, XCircle, AlertCircle, Edit, Lock } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const PanelAdministracion = () => {
  const navigate = useNavigate();
  const userData = authService.getUserData();

  const [odontologos, setOdontologos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'pendiente', 'activo', 'suspendido'
  const [motivoSuspension, setMotivoSuspension] = useState('');
  const [odontologoParaSuspender, setOdontologoParaSuspender] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, tipo: null, id: null });

  // Nuevos estados para suscripciones
  const [tabActivo, setTabActivo] = useState('odontologos'); // 'odontologos', 'planes'
  const [planes, setPlanes] = useState([]);
  const [loadingPlanes, setLoadingPlanes] = useState(false);
  const [planParaEditar, setPlanParaEditar] = useState(null); // Objeto PlanConfig
  const [editarPlanForm, setEditarPlanForm] = useState({
    nombre: '',
    precio: '',
    limite_almacenamiento_gb: 1,
    tiene_turnos: false,
    tiene_recordatorios_email: false,
    tiene_odontograma: false,
    tiene_exportacion_pdf: false,
    descripcion: ''
  });
  
  // Cambiar plan de odontólogo
  const [mostrarModalCambiarPlan, setMostrarModalCambiarPlan] = useState(false);
  const [odontologoSeleccionadoParaPlan, setOdontologoSeleccionadoParaPlan] = useState(null);
  const [planSelect, setPlanSelect] = useState('basico');
  const [guardandoPlanOdontologo, setGuardandoPlanOdontologo] = useState(false);
  const [guardandoPlanConfig, setGuardandoPlanConfig] = useState(false);

  useEffect(() => {
    if (!userData || userData.tipo_usuario !== 'admin') {
      navigate('/');
      return;
    }
    cargarOdontologos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar el componente

  const cargarOdontologos = async () => {
    try {
      setLoading(true);
      const data = await getAllOdontologos();
      setOdontologos(data);
    } catch (err) {
      setError('Error al cargar los odontólogos');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (id) => {
    setConfirmModal({ open: true, tipo: 'aprobar', id });
  };

  const handleActivar = async (id) => {
    setConfirmModal({ open: true, tipo: 'reactivar', id });
  };

  const confirmarAccion = async () => {
    const { tipo, id } = confirmModal;
    setConfirmModal({ open: false, tipo: null, id: null });
    try {
      setProcesando(true);
      if (tipo === 'aprobar') {
        const response = await aprobarOdontologo(id);
        setSuccess(response.message || 'Odontólogo aprobado exitosamente');
      } else if (tipo === 'reactivar') {
        const response = await activarOdontologo(id);
        setSuccess(response.message || 'Odontólogo reactivado exitosamente');
      }
      await cargarOdontologos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la acción');
    } finally {
      setProcesando(false);
    }
  };

  const handleSuspender = async () => {
    if (!odontologoParaSuspender) return;

    try {
      setProcesando(true);
      const response = await suspenderOdontologo(odontologoParaSuspender, motivoSuspension || 'Falta de pago');
      setSuccess(response.message || 'Odontólogo suspendido exitosamente');
      setOdontologoParaSuspender(null);
      setMotivoSuspension('');
      await cargarOdontologos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al suspender odontólogo');
    } finally {
      setProcesando(false);
    }
  };

  const cargarPlanes = async () => {
    try {
      setLoadingPlanes(true);
      const data = await getPlanes();
      setPlanes(data);
    } catch (err) {
      setError('Error al cargar los planes de suscripción');
    } finally {
      setLoadingPlanes(false);
    }
  };

  useEffect(() => {
    if (tabActivo === 'planes') {
      cargarPlanes();
    }
  }, [tabActivo]);

  const handleCambiarPlan = async () => {
    if (!odontologoSeleccionadoParaPlan) return;
    try {
      setGuardandoPlanOdontologo(true);
      const response = await cambiarPlanOdontologo(odontologoSeleccionadoParaPlan.id, planSelect);
      setSuccess(response.message || 'Plan actualizado correctamente');
      setMostrarModalCambiarPlan(false);
      setOdontologoSeleccionadoParaPlan(null);
      await cargarOdontologos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar plan del odontólogo');
    } finally {
      setGuardandoPlanOdontologo(false);
    }
  };

  const handleEditarPlanConfig = async (e) => {
    e.preventDefault();
    if (!planParaEditar) return;
    try {
      setGuardandoPlanConfig(true);
      const response = await updatePlan(planParaEditar.plan_key, editarPlanForm);
      setSuccess(`Plan ${response.nombre || planParaEditar.plan_key} actualizado correctamente`);
      setPlanParaEditar(null);
      await cargarPlanes();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar configuración del plan');
    } finally {
      setGuardandoPlanConfig(false);
    }
  };


  const odontologosFiltrados = odontologos.filter(odontologo => {
    if (filtro === 'todos') return true;
    return odontologo.estado === filtro;
  });

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendiente' },
      activo: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Activo' },
      suspendido: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Suspendido' }
    };
    const badge = badges[estado] || badges.activo;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const contadores = {
    pendiente: odontologos.filter(o => o.estado === 'pendiente').length,
    activo: odontologos.filter(o => o.estado === 'activo').length,
    suspendido: odontologos.filter(o => o.estado === 'suspendido').length,
  };

  if (loading && odontologos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex items-center justify-center">
        <p className="text-white text-xl">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />

      {/* Header */}
      <header className="bg-white/95 shadow-md backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="text-gray-600 mt-1">Gestión de odontólogos</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/home-admin')} className="w-full sm:w-auto">
              Volver
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Mensajes */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Vistas del Panel */}
          <div className="flex border-b border-white/20 mb-6">
            <button
              onClick={() => setTabActivo('odontologos')}
              className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
                tabActivo === 'odontologos' 
                  ? 'border-cyan-400 text-cyan-300' 
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              Gestión de Odontólogos
            </button>
            <button
              onClick={() => setTabActivo('planes')}
              className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
                tabActivo === 'planes' 
                  ? 'border-cyan-400 text-cyan-300' 
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              Configuración de Planes
            </button>
          </div>

          {tabActivo === 'odontologos' && (
            <>
              {/* Contadores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pendientes</p>
                        <p className="text-3xl font-bold text-yellow-600">{contadores.pendiente}</p>
                      </div>
                      <Clock className="w-12 h-12 text-yellow-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Activos</p>
                        <p className="text-3xl font-bold text-green-600">{contadores.activo}</p>
                      </div>
                      <CheckCircle className="w-12 h-12 text-green-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Suspendidos</p>
                        <p className="text-3xl font-bold text-red-600">{contadores.suspendido}</p>
                      </div>
                      <XCircle className="w-12 h-12 text-red-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Button
                      variant={filtro === 'todos' ? 'primary' : 'secondary'}
                      onClick={() => setFiltro('todos')}
                      size="sm"
                    >
                      Todos ({odontologos.length})
                    </Button>
                    <Button
                      variant={filtro === 'pendiente' ? 'primary' : 'secondary'}
                      onClick={() => setFiltro('pendiente')}
                      size="sm"
                    >
                      Pendientes ({contadores.pendiente})
                    </Button>
                    <Button
                      variant={filtro === 'activo' ? 'primary' : 'secondary'}
                      onClick={() => setFiltro('activo')}
                      size="sm"
                    >
                      Activos ({contadores.activo})
                    </Button>
                    <Button
                      variant={filtro === 'suspendido' ? 'primary' : 'secondary'}
                      onClick={() => setFiltro('suspendido')}
                      size="sm"
                    >
                      Suspendidos ({contadores.suspendido})
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de odontólogos */}
              <Card>
                <CardHeader>
                  <CardTitle>Odontólogos ({odontologosFiltrados.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {odontologosFiltrados.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No hay odontólogos en esta categoría</p>
                  ) : (
                    <div className="space-y-4">
                      {odontologosFiltrados.map((odontologo) => (
                        <div
                          key={odontologo.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Dr. {odontologo.nombre_completo}
                                </h3>
                                {getEstadoBadge(odontologo.estado)}
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p><strong>Email:</strong> {odontologo.user.email}</p>
                                {odontologo.especialidad && (
                                  <p><strong>Especialidad:</strong> {odontologo.especialidad}</p>
                                )}
                                {odontologo.matricula && (
                                  <p><strong>Matrícula:</strong> {odontologo.matricula}</p>
                                )}
                                <p><strong>Plan actual:</strong> <span className="text-blue-600 font-bold">{odontologo.plan?.nombre || 'Básico'}</span> ({odontologo.plan?.precio || 'Gratis'})</p>
                                <p><strong>Fecha de registro:</strong> {new Date(odontologo.fecha_alta).toLocaleDateString('es-AR')}</p>
                                {odontologo.fecha_aprobacion && (
                                  <p><strong>Fecha de aprobación:</strong> {new Date(odontologo.fecha_aprobacion).toLocaleDateString('es-AR')}</p>
                                )}
                                {odontologo.motivo_suspension && (
                                  <p className="text-red-600"><strong>Motivo de suspensión:</strong> {odontologo.motivo_suspension}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-[180px]">
                              {odontologo.estado === 'pendiente' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAprobar(odontologo.id)}
                                  isLoading={procesando}
                                  className="w-full"
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Aprobar
                                </Button>
                              )}
                              {odontologo.estado === 'activo' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setOdontologoSeleccionadoParaPlan(odontologo);
                                      setPlanSelect(odontologo.plan?.plan_key || 'basico');
                                      setMostrarModalCambiarPlan(true);
                                    }}
                                    className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1.5"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                    Cambiar Plan
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setOdontologoParaSuspender(odontologo.id);
                                      setMotivoSuspension('');
                                    }}
                                    className="w-full cursor-pointer"
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Suspender
                                  </Button>
                                </>
                              )}
                              {odontologo.estado === 'suspendido' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleActivar(odontologo.id)}
                                  isLoading={procesando}
                                  className="w-full"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Reactivar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {tabActivo === 'planes' && (
            <div>
              {loadingPlanes ? (
                <div className="flex flex-col items-center justify-center py-20 text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
                  <p className="text-slate-300 text-sm">Cargando configuración de planes...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {planes.map((plan) => (
                    <Card key={plan.plan_key} className="bg-white text-gray-900 border-none shadow-xl flex flex-col justify-between">
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-xl font-bold text-gray-850">{plan.nombre}</CardTitle>
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase">
                            {plan.plan_key}
                          </span>
                        </div>
                        <p className="text-2xl font-extrabold text-blue-600 mt-2">{plan.precio}</p>
                      </CardHeader>
                      <CardContent className="p-6 flex-grow flex flex-col justify-between">
                        <div className="space-y-4 mb-6">
                          <p className="text-sm text-gray-650 italic">"{plan.descripcion}"</p>
                          <hr className="border-gray-100" />
                          <ul className="space-y-2.5 text-sm text-gray-700">
                            <li className="flex items-center justify-between">
                              <span>Límite de Almacenamiento:</span>
                              <span className="font-semibold text-gray-900">{plan.limite_almacenamiento_gb} GB</span>
                            </li>
                            <li className="flex items-center justify-between">
                              <span>Agenda de Turnos:</span>
                              <span className={`font-semibold ${plan.tiene_turnos ? 'text-green-600' : 'text-red-500'}`}>
                                {plan.tiene_turnos ? 'Sí' : 'No'}
                              </span>
                            </li>
                            <li className="flex items-center justify-between">
                              <span>Recordatorios por Email:</span>
                              <span className={`font-semibold ${plan.tiene_recordatorios_email ? 'text-green-600' : 'text-red-500'}`}>
                                {plan.tiene_recordatorios_email ? 'Sí' : 'No'}
                              </span>
                            </li>
                            <li className="flex items-center justify-between">
                              <span>Odontograma Interactivo:</span>
                              <span className={`font-semibold ${plan.tiene_odontograma ? 'text-green-600' : 'text-red-500'}`}>
                                {plan.tiene_odontograma ? 'Sí' : 'No'}
                              </span>
                            </li>
                            <li className="flex items-center justify-between">
                              <span>Exportar PDF:</span>
                              <span className={`font-semibold ${plan.tiene_exportacion_pdf ? 'text-green-600' : 'text-red-500'}`}>
                                {plan.tiene_exportacion_pdf ? 'Sí' : 'No'}
                              </span>
                            </li>
                          </ul>
                        </div>
                        <Button
                          onClick={() => {
                            setPlanParaEditar(plan);
                            setEditarPlanForm({
                              nombre: plan.nombre,
                              precio: plan.precio,
                              limite_almacenamiento_gb: plan.limite_almacenamiento_gb,
                              tiene_turnos: plan.tiene_turnos,
                              tiene_recordatorios_email: plan.tiene_recordatorios_email,
                              tiene_odontograma: plan.tiene_odontograma,
                              tiene_exportacion_pdf: plan.tiene_exportacion_pdf,
                              descripcion: plan.descripcion
                            });
                          }}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editar Configuración
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Cambiar Plan de Odontólogo */}
      {mostrarModalCambiarPlan && odontologoSeleccionadoParaPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-fadeIn text-gray-900">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Cambiar Plan de Suscripción
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Estás modificando la suscripción de <strong>Dr. {odontologoSeleccionadoParaPlan.nombre_completo}</strong>.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Seleccionar Plan
              </label>
              <select
                value={planSelect}
                onChange={(e) => setPlanSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              >
                <option value="basico">Básico (Pacientes, 1GB)</option>
                <option value="medio">Medio (Pacientes, Turnos, Email, 1GB)</option>
                <option value="premium">Premium (Pacientes, Turnos, Email, 10GB, Odontograma, PDF)</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCambiarPlan}
                isLoading={guardandoPlanOdontologo}
                className="flex-grow bg-blue-600 hover:bg-blue-700 text-white"
              >
                Guardar Cambios
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setMostrarModalCambiarPlan(false);
                  setOdontologoSeleccionadoParaPlan(null);
                }}
                disabled={guardandoPlanOdontologo}
                className="flex-grow"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Configuración de Plan */}
      {planParaEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl animate-fadeIn text-gray-900 my-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-150">
              Editar Configuración: {planParaEditar.nombre}
            </h3>
            <form onSubmit={handleEditarPlanConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  value={editarPlanForm.nombre}
                  onChange={(e) => setEditarPlanForm({...editarPlanForm, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Precio Mensual</label>
                  <input
                    type="text"
                    required
                    value={editarPlanForm.precio}
                    onChange={(e) => setEditarPlanForm({...editarPlanForm, precio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Límite Storage (GB)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={editarPlanForm.limite_almacenamiento_gb}
                    onChange={(e) => setEditarPlanForm({...editarPlanForm, limite_almacenamiento_gb: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descripción</label>
                <textarea
                  required
                  value={editarPlanForm.descripcion}
                  onChange={(e) => setEditarPlanForm({...editarPlanForm, descripcion: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <p className="text-xs font-bold uppercase text-gray-500 mb-2">Habilitar Funcionalidades</p>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editarPlanForm.tiene_turnos}
                    onChange={(e) => setEditarPlanForm({...editarPlanForm, tiene_turnos: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Agenda de Turnos (Calendario)
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editarPlanForm.tiene_recordatorios_email}
                    onChange={(e) => setEditarPlanForm({...editarPlanForm, tiene_recordatorios_email: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Recordatorios automáticos por email
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editarPlanForm.tiene_odontograma}
                    onChange={(e) => setEditarPlanForm({...editarPlanForm, tiene_odontograma: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Odontograma Interactivo FDI
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editarPlanForm.tiene_exportacion_pdf}
                    onChange={(e) => setEditarPlanForm({...editarPlanForm, tiene_exportacion_pdf: e.target.checked})}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Exportar historial clínico a PDF
                </label>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button
                  type="submit"
                  isLoading={guardandoPlanConfig}
                  className="flex-grow bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Guardar Plan
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPlanParaEditar(null)}
                  disabled={guardandoPlanConfig}
                  className="flex-grow"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de suspensión */}
      {odontologoParaSuspender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Suspender Odontólogo
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la suspensión
              </label>
              <textarea
                value={motivoSuspension}
                onChange={(e) => setMotivoSuspension(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
                placeholder="Ej: Falta de pago, Incumplimiento de términos, etc."
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleSuspender}
                isLoading={procesando}
                className="flex-1"
              >
                Confirmar Suspensión
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setOdontologoParaSuspender(null);
                  setMotivoSuspension('');
                }}
                disabled={procesando}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, tipo: null, id: null })}
        onConfirm={confirmarAccion}
        title={confirmModal.tipo === 'aprobar' ? 'Aprobar Odontólogo' : 'Reactivar Odontólogo'}
        message={
          confirmModal.tipo === 'aprobar'
            ? '¿Estás seguro de que querés aprobar este odontólogo? Se le enviará una notificación por email.'
            : '¿Estás seguro de que querés reactivar este odontólogo?'
        }
        confirmText={confirmModal.tipo === 'aprobar' ? 'Sí, aprobar' : 'Sí, reactivar'}
        cancelText="Cancelar"
        variant={confirmModal.tipo === 'aprobar' ? 'info' : 'warning'}
      />
    </div>
  );
};

export default PanelAdministracion;
