import { useState, useMemo } from 'react';

const TurnoCalendar = ({
    turnosPorDia = {},
    fechaSeleccionada,
    onSelectFecha,
    highlightColor = 'blue',
    label = 'turnos',
    totalLabel = 'Total de turnos',
    showTotal = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mesActual, setMesActual] = useState(() => {
        if (fechaSeleccionada) {
            const [y, m] = fechaSeleccionada.split('-');
            return new Date(parseInt(y), parseInt(m) - 1, 1);
        }
        return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    });

    const colorConfig = {
        blue: {
            bg: 'bg-blue-500',
            bgLight: 'bg-blue-50',
            bgHover: 'hover:bg-blue-100',
            text: 'text-blue-700',
            badge: 'bg-blue-600 text-white',
            ring: 'ring-blue-400',
            totalBg: 'bg-blue-600',
            dot: 'bg-blue-500'
        },
        green: {
            bg: 'bg-green-500',
            bgLight: 'bg-green-50',
            bgHover: 'hover:bg-green-100',
            text: 'text-green-700',
            badge: 'bg-green-600 text-white',
            ring: 'ring-green-400',
            totalBg: 'bg-green-600',
            dot: 'bg-green-500'
        }
    };

    const colors = colorConfig[highlightColor] || colorConfig.blue;

    // Total general de turnos
    const totalTurnos = useMemo(() => {
        return Object.values(turnosPorDia).reduce((sum, count) => sum + count, 0);
    }, [turnosPorDia]);

    // Generar días del mes
    const diasDelMes = useMemo(() => {
        const year = mesActual.getFullYear();
        const month = mesActual.getMonth();

        const primerDia = new Date(year, month, 1);
        const ultimoDia = new Date(year, month + 1, 0);

        // Ajustar para que la semana empiece en lunes (0=Lun, 6=Dom)
        let startDay = primerDia.getDay() - 1;
        if (startDay < 0) startDay = 6;

        const dias = [];

        // Días del mes anterior (relleno)
        const diasMesAnterior = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            dias.push({
                day: diasMesAnterior - i,
                date: null,
                isCurrentMonth: false
            });
        }

        // Días del mes actual
        for (let d = 1; d <= ultimoDia.getDate(); d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            dias.push({
                day: d,
                date: dateStr,
                isCurrentMonth: true,
                turnos: turnosPorDia[dateStr] || 0
            });
        }

        // Días del mes siguiente (relleno para completar la grilla)
        const remaining = 7 - (dias.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                dias.push({
                    day: i,
                    date: null,
                    isCurrentMonth: false
                });
            }
        }

        return dias;
    }, [mesActual, turnosPorDia]);

    const mesAnterior = () => {
        setMesActual(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const mesSiguiente = () => {
        setMesActual(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleSelectDia = (dateStr) => {
        if (!dateStr) return;
        onSelectFecha(dateStr);
        setIsOpen(false);
    };

    const hoyStr = (() => {
        const h = new Date();
        return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
    })();

    const nombreMes = mesActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="mb-4">
            {/* Botón toggle + total */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                    <span>📅</span>
                    <span>{isOpen ? 'Cerrar Calendario' : 'Ver Calendario'}</span>
                    <svg
                        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showTotal && totalTurnos > 0 && totalLabel && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-medium ${colors.totalBg}`}>
                        <span>{totalLabel}:</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold">{totalTurnos}</span>
                    </div>
                )}
            </div>

            {/* Calendario */}
            {isOpen && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 animate-fadeIn max-w-sm">
                    {/* Header del mes */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={mesAnterior}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h3 className="text-base font-semibold text-gray-800 capitalize">{nombreMes}</h3>
                        <button
                            onClick={mesSiguiente}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {diasSemana.map(dia => (
                            <div key={dia} className="text-center text-xs font-medium text-gray-500 py-1">
                                {dia}
                            </div>
                        ))}
                    </div>

                    {/* Grilla de días */}
                    <div className="grid grid-cols-7 gap-1">
                        {diasDelMes.map((dia, idx) => {
                            const isSelected = dia.date === fechaSeleccionada;
                            const isToday = dia.date === hoyStr;
                            const hasTurnos = dia.turnos > 0;

                            if (!dia.isCurrentMonth) {
                                return (
                                    <div key={idx} className="aspect-square flex items-center justify-center">
                                        <span className="text-xs text-gray-300">{dia.day}</span>
                                    </div>
                                );
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectDia(dia.date)}
                                    className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-all
                    ${isSelected
                                            ? `${colors.bg} text-white shadow-md ring-2 ${colors.ring} ring-offset-1`
                                            : hasTurnos
                                                ? `${colors.bgLight} ${colors.text} ${colors.bgHover} font-semibold`
                                                : isToday
                                                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 font-semibold'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                        }
                  `}
                                >
                                    <span className="text-xs leading-none">{dia.day}</span>
                                    {hasTurnos && !isSelected && (
                                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} mt-0.5`}></span>
                                    )}
                                    {hasTurnos && isSelected && (
                                        <span className="text-[10px] font-bold leading-none mt-0.5 bg-white/30 px-1 rounded">
                                            {dia.turnos}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Leyenda */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                            <span>Con {label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                            <span>Sin {label}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TurnoCalendar;
