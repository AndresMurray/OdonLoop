import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Users, Stethoscope, LogIn, CalendarCheck, ClipboardList, SmilePlus, Gift, Mail, Play, Instagram } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full space-y-10">

          {/* ── Hero / Welcome Card ── */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 md:p-10 text-center shadow-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
              OdonLoop
            </h1>
            <p className="text-cyan-300 text-lg md:text-xl font-semibold mb-6">
              Todo lo que tu consultorio necesita, en una sola plataforma.
            </p>

            {/* Feature pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center bg-white/10 rounded-xl p-5 hover:bg-white/20 transition-colors duration-300">
                <CalendarCheck className="w-9 h-9 text-cyan-400 mb-2" />
                <h3 className="text-white font-bold text-sm mb-1">Turnos con avisos por mail</h3>
                <p className="text-slate-300 text-xs">Tus pacientes reciben recordatorios automáticos.</p>
              </div>
              <div className="flex flex-col items-center bg-white/10 rounded-xl p-5 hover:bg-white/20 transition-colors duration-300">
                <ClipboardList className="w-9 h-9 text-emerald-400 mb-2" />
                <h3 className="text-white font-bold text-sm mb-1">Seguimiento de pacientes</h3>
                <p className="text-slate-300 text-xs">Historial clínico con notas, imágenes y archivos de cada visita.</p>
              </div>
              <div className="flex flex-col items-center bg-white/10 rounded-xl p-5 hover:bg-white/20 transition-colors duration-300">
                <SmilePlus className="w-9 h-9 text-amber-400 mb-2" />
                <h3 className="text-white font-bold text-sm mb-1">Odontograma interactivo</h3>
                <p className="text-slate-300 text-xs">Registrá tratamientos de forma visual.</p>
              </div>
            </div>

            {/* 30-day trial banner */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 rounded-full px-6 py-2 mb-8">
              <Gift className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 font-semibold text-sm">
                ¡Los primeros 30 días de prueba son gratis!
              </span>
            </div>

            {/* Contact + Demo + Instagram row */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap w-full">
              <a
                href="mailto:sistemagestionodontologico@gmail.com"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 border border-cyan-400/50 text-white font-semibold rounded-lg px-5 py-3 transition-colors duration-300 text-sm shadow-md"
              >
                <Mail className="w-5 h-5 text-cyan-300" />
                Contactate
              </a>
              <a
                href="https://youtu.be/5HqWZP25XYY?si=U3sXYRRcPtbziMmN"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600/80 hover:bg-red-600 border border-red-500/50 text-white font-semibold rounded-lg px-5 py-3 transition-colors duration-300 text-sm"
              >
                <Play className="w-5 h-5" />
                Ver demo del sistema
              </a>
              <a
                href="https://www.instagram.com/odonloop/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 border border-pink-400/50 text-white font-semibold rounded-lg px-5 py-3 transition-colors duration-300 text-sm"
              >
                <Instagram className="w-5 h-5" />
                Seguinos en Instagram
              </a>
            </div>

            {/* ── Separador ── */}
            <div className="border-t border-white/15 my-8"></div>

            {/* ── Login + Registro compacto ── */}
            <div className="space-y-4">
              {/* Iniciar Sesión — prominente */}
              <Link to="/login" className="block">
                <button className="w-full sm:w-auto mx-auto flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl px-10 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                  <LogIn className="w-6 h-6" />
                  Iniciar Sesión
                </button>
              </Link>

              <p className="text-slate-400 text-sm font-medium">
                ¿No tenés cuenta? Registrate:
              </p>

              {/* Registro en fila compacta */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link to="/register/paciente" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-300 text-sm">
                    <Users className="w-5 h-5 text-blue-400" />
                    Registrarme como Paciente
                  </button>
                </Link>
                <Link to="/register/odontologo" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-300 text-sm">
                    <Stethoscope className="w-5 h-5 text-slate-300" />
                    Registrarme como Odontólogo
                  </button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;

