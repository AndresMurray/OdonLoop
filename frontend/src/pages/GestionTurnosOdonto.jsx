/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearTurno, crearTurnosLote, getMisTurnos, cancelarTurno, completarTurno, actualizarTurno, getTurnosPorFecha, toggleVisibilidadTurno } from '../api/turnoService';
import { authService } from '../api/authService';
import Button from '../components/Button';
import { Card } from '../components/Card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import ModalAsignarPaciente from '../components/ModalAsignarPaciente';
import TurnoCalendar from '../components/TurnoCalendar';

const GestionTurnosOdonto = () => {
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [modoCreacion, setModoCreacion] = useState('lote'); // 'individual' o 'lote'
  const [turnoEditando, setTurnoEditando] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState(() => {
    // Por defecto mostrar la fecha de hoy
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }); // Filtro para turnos disponibles

  // Estados de paginación
  const [paginaDisponibles, setPaginaDisponibles] = useState(1);
  const [paginaReservados, setPaginaReservados] = useState(1);
  const ITEMS_POR_PAGINA = 5;

  // Tab activa para no renderizar todo a la vez
  const [tabActiva, setTabActiva] = useState('disponibles'); // 'disponibles' | 'reservados' | 'crear'

  // Estados para el modal de confirmación de cancelación
  const [modalCancelar, setModalCancelar] = useState({
    isOpen: false,
    turnoId: null,
    title: '',
    message: '',
    variant: 'danger'
  });

  // Estado para el modal de asignar paciente
  const [modalAsignarPaciente, setModalAsignarPaciente] = useState(false);

  // Estados para verificar horarios ocupados
  const [turnosDiaSeleccionado, setTurnosDiaSeleccionado] = useState([]);
  const [horarioOcupadoWarning, setHorarioOcupadoWarning] = useState('');

  // Estado del formulario para crear turno individual
  const [turnoIndividual, setTurnoIndividual] = useState({
    fecha: '',
    hora: '',
    duracion_minutos: 20,
    visible: true
  });

  // Estado del formulario para crear turnos en lote
  const [loteForm, setLoteForm] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    duracion_minutos: 20,
    dias_semana: [0, 1, 2, 3, 4], // Lunes a viernes por defecto
    visible: true
  });

  const userData = authService.getUserData();

  const diasSemanaOptions = [
    { value: 0, label: 'Lunes' },
    { value: 1, label: 'Martes' },
    { value: 2, label: 'Miércoles' },
    { value: 3, label: 'Jueves' },
    { value: 4, label: 'Viernes' },
    { value: 5, label: 'Sábado' },
    { value: 6, label: 'Domingo' }
  ];

  useEffect(() => {
    cargarTurnos();
  }, []);

  // Cargar turnos del día cuando se selecciona una fecha en el formulario individual
  useEffect(() => {
    if (showForm && modoCreacion === 'individual' && turnoIndividual.fecha) {
      cargarTurnosDia(turnoIndividual.fecha);
    }
  }, [showForm, modoCreacion, turnoIndividual.fecha]);

  const cargarTurnos = async () => {
    setLoading(true);
    try {
      const data = await getMisTurnos();
      setTurnos(data);
      setError('');
      // Resetear paginación al recargar
      setPaginaDisponibles(1);
      setPaginaReservados(1);
    } catch (err) {
      setError('Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar turnos de un día específico para verificar disponibilidad
  const cargarTurnosDia = async (fecha) => {
    if (!fecha) return;

    try {
      const data = await getTurnosPorFecha(fecha);
      setTurnosDiaSeleccionado(data);
    } catch (err) {
      setTurnosDiaSeleccionado([]);
    }
  };

  // Verificar si un horario está ocupado
  const verificarHorarioOcupado = (fecha, hora, duracion) => {
    if (!fecha || !hora || !turnosDiaSeleccionado.length) return false;

    const [horaInicio, minutoInicio] = hora.split(':').map(Number);
    const inicioMinutos = horaInicio * 60 + minutoInicio;
    const finMinutos = inicioMinutos + duracion;

    for (const turno of turnosDiaSeleccionado) {
      // Solo verificar turnos que no estén cancelados
      if (turno.estado === 'cancelado') continue;

      // Parsear directamente el string (formato: "2026-02-10T19:00:00")
      const [, horaStr] = turno.fecha_hora.split('T');
      const [turnoHora, turnoMinuto] = horaStr.split(':').map(Number);
      const turnoInicioMinutos = turnoHora * 60 + turnoMinuto;
      const turnoFinMinutos = turnoInicioMinutos + turno.duracion_minutos;

      // Verificar superposición
      if (inicioMinutos < turnoFinMinutos && finMinutos > turnoInicioMinutos) {
        return true;
      }
    }

    return false;
  };

  // Actualizar warning cuando cambie la hora o duración
  useEffect(() => {
    if (turnoIndividual.fecha && turnoIndividual.hora && turnoIndividual.duracion_minutos) {
      if (verificarHorarioOcupado(turnoIndividual.fecha, turnoIndividual.hora, parseInt(turnoIndividual.duracion_minutos))) {
        setHorarioOcupadoWarning('⚠️ Este horario se superpone con un turno existente');
      } else {
        setHorarioOcupadoWarning('');
      }
    }
  }, [turnoIndividual.fecha, turnoIndividual.hora, turnoIndividual.duracion_minutos, turnosDiaSeleccionado]);

  const handleCrearTurnoIndividual = async (e) => {
    e.preventDefault();

    // Verificar si el horario está ocupado antes de enviar
    if (verificarHorarioOcupado(turnoIndividual.fecha, turnoIndividual.hora, parseInt(turnoIndividual.duracion_minutos))) {
      setError('⚠️ El horario seleccionado se superpone con un turno existente. Por favor elige otro horario.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Crear fecha en formato ISO
      const fechaHora = `${turnoIndividual.fecha}T${turnoIndividual.hora}:00`;

      // Solo enviamos fecha_hora y duración, el backend obtiene el odontólogo del token
      const turnoData = {
        fecha_hora: fechaHora,
        duracion_minutos: parseInt(turnoIndividual.duracion_minutos),
        visible: turnoIndividual.visible
      };

      await crearTurno(turnoData);

      setSuccess('Turno creado exitosamente');
      setShowForm(false);
      setTurnoIndividual({
        fecha: '',
        hora: '',
        duracion_minutos: 20,
        visible: true
      });
      setTurnosDiaSeleccionado([]); // Limpiar turnos del día
      cargarTurnos();
    } catch (err) {
      // Intentar obtener el mensaje de error más específico
      let errorMessage = 'Error al crear el turno';

      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
        } else if (err.response.data.fecha_hora) {
          errorMessage = `Error en fecha/hora: ${err.response.data.fecha_hora[0]}`;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearTurnosLote = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await crearTurnosLote(loteForm);

      if (response.turnos_creados === 0) {
        setError(response.message || 'No se pudo crear ningún turno debido a conflictos de horario');
      } else if (response.conflictos > 0) {
        setSuccess(`${response.message}`);
      } else {
        setSuccess(response.message);
      }

      if (response.turnos_creados > 0) {
        setShowForm(false);
        setLoteForm({
          fecha_inicio: '',
          fecha_fin: '',
          hora_inicio: '08:00',
          hora_fin: '12:00',
          duracion_minutos: 20,
          dias_semana: [0, 1, 2, 3, 4],
          visible: true
        });
        cargarTurnos();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || err.response?.data?.error || 'Error al crear los turnos');
    } finally {
      setLoading(false);
    }
  };

  const handleDiasSemanaChange = (dia) => {
    setLoteForm(prev => {
      const dias = prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter(d => d !== dia)
        : [...prev.dias_semana, dia];
      return { ...prev, dias_semana: dias.sort() };
    });
  };

  const handleEditarTurno = (turno) => {
    // El backend envía fecha_hora en formato: "2026-02-10T19:00:00" (hora Argentina, sin timezone)
    // Parsear directamente el string sin conversión de timezone
    const [fechaStr, horaStr] = turno.fecha_hora.split('T');
    const [año, mes, dia] = fechaStr.split('-');
    const [hora, minuto] = horaStr.split(':');

    setTurnoEditando({
      id: turno.id,
      fecha: fechaStr, // Ya viene en formato YYYY-MM-DD
      hora: `${hora}:${minuto}`, // HH:MM
      duracion_minutos: turno.duracion_minutos,
      estado: turno.estado,
      paciente_id: turno.paciente?.id || null,
      paciente_nombre: turno.paciente?.nombre_completo || '',
      nombre_paciente_manual: turno.nombre_paciente_manual || '',
      apellido_paciente_manual: turno.apellido_paciente_manual || '',
      telefono_paciente_manual: turno.telefono_paciente_manual || ''
    });
  };

  const handleSeleccionarPaciente = (paciente) => {
    setTurnoEditando(prev => ({
      ...prev,
      paciente_id: paciente.id,
      paciente_nombre: paciente.nombre_completo,
      estado: 'reservado',
      nombre_paciente_manual: '',
      apellido_paciente_manual: '',
      telefono_paciente_manual: ''
    }));
  };

  const handleQuitarPaciente = () => {
    setTurnoEditando(prev => ({
      ...prev,
      paciente_id: null,
      paciente_nombre: '',
      estado: 'disponible'
    }));
  };

  const handleGuardarEdicion = async () => {
    if (!turnoEditando) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const fechaHora = `${turnoEditando.fecha}T${turnoEditando.hora}:00`;
      const updateData = {
        fecha_hora: fechaHora,
        duracion_minutos: parseInt(turnoEditando.duracion_minutos)
      };

      // Si tiene paciente_id asignado (paciente registrado)
      if (turnoEditando.paciente_id) {
        updateData.paciente = turnoEditando.paciente_id;
        updateData.estado = 'reservado';
      }
      // Si se está marcando como reservado manualmente (sin usuario)
      else if (turnoEditando.estado === 'reservado') {
        updateData.estado = 'reservado';
        updateData.nombre_paciente_manual = turnoEditando.nombre_paciente_manual;
        updateData.apellido_paciente_manual = turnoEditando.apellido_paciente_manual;
        updateData.telefono_paciente_manual = turnoEditando.telefono_paciente_manual || null;
      }

      await actualizarTurno(turnoEditando.id, updateData);
      setSuccess('Turno actualizado exitosamente');
      setTurnoEditando(null);
      cargarTurnos();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar el turno');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarTurno = (turnoId) => {
    // Buscar el turno para determinar el tipo y mostrar mensaje apropiado
    const turno = turnos.find(t => t.id === turnoId);

    if (!turno) {
      setError('No se encontró el turno');
      return;
    }

    let title = '';
    let message = '';
    let variant = 'danger';

    // Determinar el tipo de turno y el mensaje de confirmación
    if (turno.estado === 'disponible') {
      // Turno no reservado
      title = 'Cancelar turno disponible';
      message = 'Este turno se sacará de la lista de turnos disponibles.\n\n¿Desea continuar con la cancelación?';
      variant = 'info';
    } else if (turno.paciente && turno.paciente.nombre_completo && turno.paciente.email) {
      // Turno con paciente registrado que TIENE email
      title = 'Cancelar turno';
      message = `Este turno está reservado para: ${turno.paciente.nombre_completo}\n\n✉️ Se enviará automáticamente un email al paciente notificando la cancelación.\n\n¿Desea continuar?`;
      variant = 'danger';
    } else if (turno.paciente && turno.paciente.nombre_completo) {
      // Turno con paciente registrado pero SIN email (creado manualmente)
      title = 'Cancelar turno';
      message = `⚠️ Este turno está reservado para: ${turno.paciente.nombre_completo}\n\nIMPORTANTE: Este paciente no tiene email registrado. Deberá contactarse con el paciente para notificar la cancelación.\n\n¿Desea continuar?`;
      variant = 'warning';
    } else if (turno.nombre_paciente_manual && turno.apellido_paciente_manual) {
      // Turno con reserva manual antigua (campos nombre_paciente_manual)
      const nombreCompleto = `${turno.nombre_paciente_manual} ${turno.apellido_paciente_manual}`;
      title = 'Cancelar turno - Reserva manual';
      message = `⚠️ Este turno está reservado para: ${nombreCompleto}\n\nIMPORTANTE: Deberá contactarse con el paciente para notificar la cancelación.\n\n¿Desea continuar?`;
      variant = 'warning';
    } else {
      // Caso por defecto
      title = 'Cancelar turno';
      message = '¿Está seguro de cancelar este turno?';
      variant = 'danger';
    }

    // Abrir el modal con la información apropiada
    setModalCancelar({
      isOpen: true,
      turnoId,
      title,
      message,
      variant
    });
  };

  const confirmarCancelacion = async () => {
    const turnoId = modalCancelar.turnoId;

    // Cerrar el modal
    setModalCancelar({ ...modalCancelar, isOpen: false });

    setLoading(true);
    try {
      const response = await cancelarTurno(turnoId);

      // Usar la respuesta del backend para determinar el mensaje de éxito
      if (response.is_manual_booking) {
        // Obtener el nombre del paciente según qué campos estén disponibles
        let nombreCompleto = '';
        if (response.nombre_paciente_manual && response.apellido_paciente_manual) {
          // Reserva manual antigua
          nombreCompleto = `${response.nombre_paciente_manual} ${response.apellido_paciente_manual}`.trim();
        } else if (response.paciente && response.paciente.nombre_completo) {
          // Paciente registrado sin email
          nombreCompleto = response.paciente.nombre_completo;
        } else {
          nombreCompleto = 'el paciente';
        }
        setSuccess(`⚠️ Turno cancelado. IMPORTANTE: Debes avisar manualmente a ${nombreCompleto} sobre la cancelación.`);
      } else if (response.email_sent) {
        setSuccess('✓ Turno cancelado exitosamente. Se ha enviado un email al paciente notificando la cancelación.');
      } else {
        // Turno disponible (sin paciente asignado) o sin necesidad de notificación
        setSuccess('✓ Turno cancelado exitosamente.');
      }

      cargarTurnos();
    } catch (err) {
      setError('Error al cancelar el turno');
    } finally {
      setLoading(false);
    }
  };
  const handleToggleVisible = async (turnoId) => {
    try {
      const turnoActualizado = await toggleVisibilidadTurno(turnoId);
      // Actualizar el turno en el estado local
      setTurnos(prev => prev.map(t => t.id === turnoId ? turnoActualizado : t));
    } catch (err) {
      setError('Error al cambiar la visibilidad del turno');
    }
  };




  const formatearFecha = (fechaHora) => {
    // El backend ahora envía la fecha en hora Argentina sin timezone
    // Parsear directamente el string ISO
    const [fechaStr, horaStr] = fechaHora.split('T');
    const [año, mes, dia] = fechaStr.split('-');
    const [hora, minuto] = horaStr.split(':');

    // Crear fecha local
    const fechaLocal = new Date(
      parseInt(año),
      parseInt(mes) - 1,
      parseInt(dia),
      parseInt(hora),
      parseInt(minuto)
    );

    const opciones = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const fechaFormateada = fechaLocal.toLocaleDateString('es-AR', opciones);
    const horaFormateada = `${hora}:${minuto} hs`;

    return `${fechaFormateada}, ${horaFormateada}`;
  };

  const getEstadoColor = (estado) => {
    const colores = {
      disponible: 'bg-green-100 text-green-800',
      reservado: 'bg-blue-100 text-blue-800',
      confirmado: 'bg-purple-100 text-purple-800',
      completado: 'bg-gray-100 text-gray-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  // Memoizar turnos filtrados para evitar recálculos
  const turnosDisponibles = useMemo(() => {
    if (!fechaFiltro) return [];
    return turnos.filter(t => {
      if (t.estado !== 'disponible') return false;
      const [fechaTurnoStr] = t.fecha_hora.split('T');
      return fechaTurnoStr === fechaFiltro;
    });
  }, [turnos, fechaFiltro]);

  const turnosReservados = useMemo(() => {
    if (!fechaFiltro) return [];
    return turnos.filter(t => {
      if (t.estado !== 'reservado') return false;
      const [fechaTurnoStr] = t.fecha_hora.split('T');
      return fechaTurnoStr === fechaFiltro;
    });
  }, [turnos, fechaFiltro]);

  // Contadores memoizados
  const contadores = useMemo(() => ({
    disponibles: turnosDisponibles.length,
    reservados: turnosReservados.length
  }), [turnosDisponibles, turnosReservados]);

  // Funciones de paginación memoizadas
  const turnosDisponiblesPaginados = useMemo(() => {
    const inicio = (paginaDisponibles - 1) * ITEMS_POR_PAGINA;
    return turnosDisponibles.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [turnosDisponibles, paginaDisponibles]);

  const turnosReservadosPaginados = useMemo(() => {
    const inicio = (paginaReservados - 1) * ITEMS_POR_PAGINA;
    return turnosReservados.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [turnosReservados, paginaReservados]);

  const totalPaginasDisponibles = useMemo(() =>
    Math.ceil(turnosDisponibles.length / ITEMS_POR_PAGINA)
    , [turnosDisponibles.length]);

  const totalPaginasReservados = useMemo(() =>
    Math.ceil(turnosReservados.length / ITEMS_POR_PAGINA)
    , [turnosReservados.length]);

  // Mapas de turnos por día para el calendario
  const turnosDisponiblesPorDia = useMemo(() => {
    const mapa = {};
    turnos.filter(t => t.estado === 'disponible').forEach(t => {
      const [fechaStr] = t.fecha_hora.split('T');
      mapa[fechaStr] = (mapa[fechaStr] || 0) + 1;
    });
    return mapa;
  }, [turnos]);

  const turnosReservadosPorDia = useMemo(() => {
    const mapa = {};
    turnos.filter(t => t.estado === 'reservado').forEach(t => {
      const [fechaStr] = t.fecha_hora.split('T');
      mapa[fechaStr] = (mapa[fechaStr] || 0) + 1;
    });
    return mapa;
  }, [turnos]);

  // Compatibilidad con código existente
  const getTurnosPorEstado = useCallback((estado) => {
    if (estado === 'disponible') return turnosDisponibles;
    if (estado === 'reservado') return turnosReservados;
    return turnos.filter(t => t.estado === estado);
  }, [turnos, turnosDisponibles, turnosReservados]);


  const cambiarFecha = (nuevaFecha) => {
    setFechaFiltro(nuevaFecha);
    setPaginaDisponibles(1);
    setPaginaReservados(1);
  };

  const avanzarDia = () => {
    const fecha = new Date(fechaFiltro);
    fecha.setDate(fecha.getDate() + 1);
    cambiarFecha(fecha.toISOString().split('T')[0]);
  };

  const retrocederDia = () => {
    const fecha = new Date(fechaFiltro);
    fecha.setDate(fecha.getDate() - 1);
    cambiarFecha(fecha.toISOString().split('T')[0]);
  };

  const irHoy = () => {
    const hoy = new Date();
    cambiarFecha(hoy.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      <div className="flex-grow bg-white/5 backdrop-blur-sm p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Gestión de Turnos</h1>
              <p className="text-slate-200 mt-2">Dr. {userData.nombre} {userData.apellido}</p>
            </div>
            <Button onClick={() => navigate('/home-odontologo')} variant="secondary" className="w-full sm:w-auto">
              Volver al Inicio
            </Button>
          </div>

          {/* Tabs de navegación */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6 bg-white/10 p-2 rounded-lg">
            <button
              onClick={() => { setTabActiva('disponibles'); setShowForm(false); }}
              className={`flex-1 px-3 sm:px-4 py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${tabActiva === 'disponibles'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              <span className="hidden sm:inline">📅 </span>Disponibles
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs sm:text-sm">
                {contadores.disponibles}
              </span>
            </button>
            <button
              onClick={() => { setTabActiva('reservados'); setShowForm(false); }}
              className={`flex-1 px-3 sm:px-4 py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${tabActiva === 'reservados'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              <span className="hidden sm:inline">👤 </span>Reservados
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs sm:text-sm">
                {contadores.reservados}
              </span>
            </button>
            <button
              onClick={() => { setTabActiva('crear'); setShowForm(true); setModoCreacion('individual'); }}
              className={`flex-1 px-3 sm:px-4 py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${tabActiva === 'crear'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              <span className="hidden sm:inline">➕ </span>Crear Turno
            </button>
          </div>

          {/* Mensajes */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Formulario Crear Turnos */}
          {tabActiva === 'crear' && showForm && (
            <Card className="mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Crear Turno</h2>

                {/* Selector de Modo */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setModoCreacion('individual')}
                    className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${modoCreacion === 'individual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    Turno Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoCreacion('lote')}
                    className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${modoCreacion === 'lote'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    Turnos en Lote
                  </button>
                </div>
              </div>

              {modoCreacion === 'individual' ? (
                /* Formulario Individual */
                <form onSubmit={handleCrearTurnoIndividual} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha
                      </label>
                      <input
                        type="date"
                        required
                        value={turnoIndividual.fecha}
                        onChange={(e) => {
                          setTurnoIndividual({ ...turnoIndividual, fecha: e.target.value });
                          cargarTurnosDia(e.target.value);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora
                      </label>
                      <input
                        type="time"
                        required
                        value={turnoIndividual.hora}
                        onChange={(e) => setTurnoIndividual({ ...turnoIndividual, hora: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {horarioOcupadoWarning && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">{horarioOcupadoWarning}</p>
                    </div>
                  )}

                  {turnosDiaSeleccionado.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Turnos del día seleccionado ({turnosDiaSeleccionado.filter(t => t.estado !== 'cancelado').length}):
                      </p>
                      <div className="text-xs text-blue-700 space-y-1 max-h-32 overflow-y-auto">
                        {turnosDiaSeleccionado
                          .filter(t => t.estado !== 'cancelado')
                          .slice(0, 8)
                          .map(turno => {
                            // Parsear directamente el string de fecha_hora (formato: "2026-02-10T19:00:00")
                            const [, horaStr] = turno.fecha_hora.split('T');
                            const [hora, minuto] = horaStr.split(':');
                            return (
                              <div key={turno.id}>
                                • {hora}:{minuto} ({turno.duracion_minutos} min) - {turno.estado}
                              </div>
                            );
                          })
                        }
                        {turnosDiaSeleccionado.filter(t => t.estado !== 'cancelado').length > 8 && (
                          <div className="text-blue-600 font-medium pt-1">
                            ... y {turnosDiaSeleccionado.filter(t => t.estado !== 'cancelado').length - 8} más
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración (minutos)
                    </label>
                    <input
                      type="number"
                      required
                      value={turnoIndividual.duracion_minutos}
                      onChange={(e) => setTurnoIndividual({ ...turnoIndividual, duracion_minutos: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="10"
                      max="180"
                      step="5"
                    />
                  </div>


                  {/* Toggle visibilidad */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                    <input
                      type="checkbox"
                      id="visible-individual"
                      checked={turnoIndividual.visible}
                      onChange={(e) => setTurnoIndividual({ ...turnoIndividual, visible: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="visible-individual" className="text-sm text-gray-700 cursor-pointer">
                      <span className="font-medium">Visible para pacientes</span>
                      <span className="block text-xs text-gray-500">Si lo desactivás, el turno solo aparece en tu agenda</span>
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creando...' : 'Crear Turno'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                /* Formulario en Lote */
                <form onSubmit={handleCrearTurnosLote} className="space-y-6">
                  <p className="text-gray-600 mb-4">Crea múltiples turnos de manera rápida seleccionando un rango de fechas, horas y días de la semana.</p>
                  {/* Rango de Fechas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Rango de Fechas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha Inicio
                        </label>
                        <input
                          type="date"
                          required
                          value={loteForm.fecha_inicio}
                          onChange={(e) => setLoteForm({ ...loteForm, fecha_inicio: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha Fin
                        </label>
                        <input
                          type="date"
                          required
                          value={loteForm.fecha_fin}
                          onChange={(e) => setLoteForm({ ...loteForm, fecha_fin: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min={loteForm.fecha_inicio || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Días de la Semana */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Días de la Semana</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {diasSemanaOptions.map(dia => (
                        <label key={dia.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={loteForm.dias_semana.includes(dia.value)}
                            onChange={() => handleDiasSemanaChange(dia.value)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{dia.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rango de Horas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Rango de Horas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora Inicio
                        </label>
                        <input
                          type="time"
                          required
                          value={loteForm.hora_inicio}
                          onChange={(e) => setLoteForm({ ...loteForm, hora_inicio: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hora Fin
                        </label>
                        <input
                          type="time"
                          required
                          value={loteForm.hora_fin}
                          onChange={(e) => setLoteForm({ ...loteForm, hora_fin: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Duración */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración de cada turno (minutos)
                    </label>
                    <input
                      type="number"
                      required
                      value={loteForm.duracion_minutos}
                      onChange={(e) => setLoteForm({ ...loteForm, duracion_minutos: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="10"
                      max="180"
                      step="5"
                    />
                    <p className="text-sm text-gray-500 mt-1">Por defecto: 20 minutos</p>
                  </div>

                  {/* Toggle visibilidad */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                    <input
                      type="checkbox"
                      id="visible-lote"
                      checked={loteForm.visible}
                      onChange={(e) => setLoteForm({ ...loteForm, visible: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="visible-lote" className="text-sm text-gray-700 cursor-pointer">
                      <span className="font-medium">Turnos visibles para pacientes</span>
                      <span className="block text-xs text-gray-500">Si lo desactivás, estos turnos solo aparecen en tu agenda (modo privado)</span>
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading || loteForm.dias_semana.length === 0}>
                      {loading ? 'Creando Turnos...' : 'Crear Turnos en Lote'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {/* Lista de Turnos */}
          {loading && !turnos.length ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-white">Cargando turnos...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Turnos Disponibles */}
              {tabActiva === 'disponibles' && (
                <Card>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Turnos Disponibles
                    </h3>

                    {/* Calendario */}
                    <TurnoCalendar
                      turnosPorDia={turnosDisponiblesPorDia}
                      fechaSeleccionada={fechaFiltro}
                      onSelectFecha={cambiarFecha}
                      highlightColor="green"
                      label="disponibles"
                      totalLabel="Total disponibles"
                    />

                    {/* Navegación por día */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-100 p-3 rounded-lg">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={retrocederDia}
                        className="shrink-0"
                      >
                        ← Día Anterior
                      </Button>

                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        <input
                          type="date"
                          value={fechaFiltro}
                          onChange={(e) => cambiarFecha(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-medium text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={irHoy}
                        >
                          Hoy
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={avanzarDia}
                        className="shrink-0"
                      >
                        Día Siguiente →
                      </Button>
                    </div>

                    <p className="text-sm text-gray-600 mt-3 text-center">
                      Mostrando <span className="font-semibold">{getTurnosPorEstado('disponible').length}</span> turnos disponibles para el {new Date(fechaFiltro + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  {turnosDisponibles.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay turnos disponibles para esta fecha</p>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {turnosDisponiblesPaginados.map((turno) => (
                          <div
                            key={turno.id}
                            className="p-4 bg-gray-50 rounded-lg"
                          >
                            {turnoEditando && turnoEditando.id === turno.id ? (
                              /* Modo Edición */
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                                    <input
                                      type="date"
                                      value={turnoEditando.fecha}
                                      onChange={(e) => setTurnoEditando({ ...turnoEditando, fecha: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Hora</label>
                                    <input
                                      type="time"
                                      value={turnoEditando.hora}
                                      onChange={(e) => setTurnoEditando({ ...turnoEditando, hora: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Duración (min)</label>
                                    <input
                                      type="number"
                                      value={turnoEditando.duracion_minutos}
                                      onChange={(e) => setTurnoEditando({ ...turnoEditando, duracion_minutos: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                      min="10"
                                      max="180"
                                      step="5"
                                    />
                                  </div>
                                </div>

                                {/* Opciones de Asignación de Paciente */}
                                <div className="border-t pt-3">
                                  <h4 className="text-sm font-medium text-gray-700 mb-3">Asignar Paciente</h4>

                                  {/* Paciente Registrado Asignado */}
                                  {turnoEditando.paciente_id && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium text-emerald-900">
                                            Paciente Registrado
                                          </p>
                                          <p className="text-sm text-emerald-700 mt-1">
                                            {turnoEditando.paciente_nombre}
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleQuitarPaciente}
                                        >
                                          Quitar
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Botón para abrir modal de asignación */}
                                  {!turnoEditando.paciente_id && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => setModalAsignarPaciente(true)}
                                      className="mb-3 w-full"
                                    >
                                      🔍 Buscar o Crear Paciente
                                    </Button>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleGuardarEdicion}>
                                    Guardar
                                  </Button>
                                  <Button size="sm" variant="secondary" onClick={() => setTurnoEditando(null)}>
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* Modo Vista */
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-800">{formatearFecha(turno.fecha_hora)}</p>
                                    {!turno.visible && (
                                      <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded-full font-medium">
                                        🚫 Oculto para pacientes
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">{turno.duracion_minutos} minutos</p>
                                  {turno.motivo && (
                                    <p className="text-sm text-gray-500 mt-1">{turno.motivo}</p>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(turno.estado)}`}>
                                    {turno.estado}
                                  </span>
                                  <button
                                    onClick={() => handleToggleVisible(turno.id)}
                                    title={turno.visible ? 'Ocultar para pacientes' : 'Mostrar para pacientes'}
                                    className={`p-1.5 rounded-lg border text-sm transition-colors ${turno.visible
                                      ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                                      : 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                                      }`}
                                  >
                                    {turno.visible ? '👁' : '🚫'}
                                  </button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleEditarTurno(turno)}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleCancelarTurno(turno.id)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Paginación para turnos disponibles */}
                      <Pagination
                        currentPage={paginaDisponibles}
                        totalPages={totalPaginasDisponibles}
                        onPageChange={setPaginaDisponibles}
                        itemsPerPage={ITEMS_POR_PAGINA}
                        totalItems={turnosDisponibles.length}
                      />
                    </>
                  )}
                </Card>
              )}

              {/* Turnos Reservados */}
              {tabActiva === 'reservados' && (
                <Card>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Turnos Reservados
                    </h3>

                    {/* Calendario */}
                    <TurnoCalendar
                      turnosPorDia={turnosReservadosPorDia}
                      fechaSeleccionada={fechaFiltro}
                      onSelectFecha={cambiarFecha}
                      highlightColor="blue"
                      label="reservados"
                      totalLabel="Total reservados"
                    />

                    {/* Navegación por día */}
                    <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={retrocederDia}
                      >
                        ← Día Anterior
                      </Button>

                      <div className="flex items-center gap-3">
                        <input
                          type="date"
                          value={fechaFiltro}
                          onChange={(e) => cambiarFecha(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-medium"
                        />
                        <Button
                          size="sm"
                          onClick={irHoy}
                        >
                          Hoy
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={avanzarDia}
                      >
                        Día Siguiente →
                      </Button>
                    </div>

                    <p className="text-sm text-gray-600 mt-3 text-center">
                      Mostrando <span className="font-semibold">{contadores.reservados}</span> turnos reservados para el {new Date(fechaFiltro + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  {turnosReservados.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay turnos reservados para esta fecha</p>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {turnosReservadosPaginados.map((turno) => (
                          <div
                            key={turno.id}
                            className="flex justify-between items-center p-4 bg-blue-50 rounded-lg"
                          >
                            <div>
                              <p className="font-semibold text-gray-800">{formatearFecha(turno.fecha_hora)}</p>
                              {turno.paciente ? (
                                <p className="text-sm text-gray-600">
                                  Paciente: {turno.paciente.nombre_completo}
                                </p>
                              ) : turno.nombre_paciente_manual && turno.apellido_paciente_manual ? (
                                <div className="text-sm text-gray-600">
                                  <p>Paciente: {turno.nombre_paciente_manual} {turno.apellido_paciente_manual} <span className="text-xs text-blue-600">(reserva manual)</span></p>
                                  {turno.telefono_paciente_manual && (
                                    <p className="text-xs text-gray-500 mt-0.5">📞 {turno.telefono_paciente_manual}</p>
                                  )}
                                </div>
                              ) : null}
                              <p className="text-sm text-gray-600">{turno.duracion_minutos} minutos</p>
                              {turno.motivo && (
                                <p className="text-sm text-gray-500 mt-1">{turno.motivo}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(turno.estado)}`}>
                                {turno.estado}
                              </span>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleCancelarTurno(turno.id)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Paginación para turnos reservados */}
                      <Pagination
                        currentPage={paginaReservados}
                        totalPages={totalPaginasReservados}
                        onPageChange={setPaginaReservados}
                        itemsPerPage={ITEMS_POR_PAGINA}
                        totalItems={turnosReservados.length}
                      />
                    </>
                  )}
                </Card>
              )}

            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Modal de confirmación de cancelación */}
      <ConfirmModal
        isOpen={modalCancelar.isOpen}
        onClose={() => setModalCancelar({ ...modalCancelar, isOpen: false })}
        onConfirm={confirmarCancelacion}
        title={modalCancelar.title}
        message={modalCancelar.message}
        confirmText="Sí, cancelar turno"
        cancelText="No, mantener turno"
        variant={modalCancelar.variant}
      />

      {/* Modal de asignar paciente */}
      <ModalAsignarPaciente
        isOpen={modalAsignarPaciente}
        onClose={() => setModalAsignarPaciente(false)}
        onSeleccionar={handleSeleccionarPaciente}
      />
    </div>
  );
};

export default GestionTurnosOdonto;
