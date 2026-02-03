import { useState } from 'react';
import { Calendar } from '../components/Calendar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Clock, User, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Datos mock de odontólogos
const odontologos = [
  { id: 1, nombre: 'Dr. Juan Pérez', especialidad: 'Ortodoncia' },
  { id: 2, nombre: 'Dra. María García', especialidad: 'Endodoncia' },
  { id: 3, nombre: 'Dr. Carlos López', especialidad: 'Odontología General' },
];

// Horarios disponibles mock
const horariosDisponibles = [
  '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function TurnosPage() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedOdontologo, setSelectedOdontologo] = useState(null);
  const [selectedHorario, setSelectedHorario] = useState(null);

  const handleReservar = () => {
    if (!selectedDate || !selectedOdontologo || !selectedHorario) {
      alert('Por favor, selecciona todos los datos necesarios');
      return;
    }

    const turno = {
      fecha: format(selectedDate, 'dd/MM/yyyy', { locale: es }),
      horario: selectedHorario,
      odontologo: odontologos.find(o => o.id === selectedOdontologo).nombre,
    };

    alert(`Turno reservado:\nFecha: ${turno.fecha}\nHorario: ${turno.horario}\nOdontólogo: ${turno.odontologo}`);
    
    // Reset
    setSelectedDate(null);
    setSelectedOdontologo(null);
    setSelectedHorario(null);
  };

  // Deshabilitar domingos y fechas pasadas
  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0; // Domingo = 0
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reservar Turno</h1>
          <p className="text-slate-600">Selecciona un odontólogo, fecha y horario para tu consulta</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Paso 1: Seleccionar Odontólogo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5" />
                1. Seleccionar Odontólogo
              </CardTitle>
              <CardDescription>Elige el profesional de tu preferencia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {odontologos.map((odontologo) => (
                  <button
                    key={odontologo.id}
                    onClick={() => {
                      setSelectedOdontologo(odontologo.id);
                      setSelectedHorario(null); // Reset horario al cambiar odontólogo
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedOdontologo === odontologo.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{odontologo.nombre}</div>
                    <div className="text-sm text-slate-600">{odontologo.especialidad}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Paso 2: Seleccionar Fecha */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                2. Seleccionar Fecha
              </CardTitle>
              <CardDescription>Elige el día de tu consulta</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedHorario(null); // Reset horario al cambiar fecha
                }}
                disabled={isDateDisabled}
                className="rounded-md border"
              />
              {selectedDate && (
                <p className="mt-4 text-sm text-slate-600 text-center">
                  Fecha seleccionada: <span className="font-semibold">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: es })}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Paso 3: Seleccionar Horario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="h-5 w-5" />
                3. Seleccionar Horario
              </CardTitle>
              <CardDescription>Elige la hora de tu consulta</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedOdontologo || !selectedDate ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  Primero selecciona un odontólogo y una fecha
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {horariosDisponibles.map((horario) => (
                    <button
                      key={horario}
                      onClick={() => setSelectedHorario(horario)}
                      className={`p-3 rounded-lg border-2 transition-all font-medium ${
                        selectedHorario === horario
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {horario}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen y botón de reserva */}
        {selectedOdontologo && selectedDate && selectedHorario && (
          <Card className="mt-6 bg-slate-900 text-white border-slate-900">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <h3 className="font-semibold text-lg mb-2">Resumen del Turno</h3>
                  <div className="text-slate-300 space-y-1">
                    <p><span className="font-medium">Odontólogo:</span> {odontologos.find(o => o.id === selectedOdontologo)?.nombre}</p>
                    <p><span className="font-medium">Fecha:</span> {format(selectedDate, "dd/MM/yyyy")}</p>
                    <p><span className="font-medium">Horario:</span> {selectedHorario}</p>
                  </div>
                </div>
                <button
                  onClick={handleReservar}
                  className="px-8 py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                >
                  Confirmar Reserva
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
