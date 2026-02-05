import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Users, Stethoscope, Calendar, Shield } from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: <Calendar className="w-12 h-12 text-blue-600" />,
      title: 'Gestión de Turnos',
      description: 'Administra turnos de forma eficiente con nuestro sistema intuitivo.',
    },
    {
      icon: <Users className="w-12 h-12 text-green-600" />,
      title: 'Control de Pacientes',
      description: 'Mantén un registro completo y organizado de todos tus pacientes.',
    },
    {
      icon: <Stethoscope className="w-12 h-12 text-purple-600" />,
      title: 'Panel Profesional',
      description: 'Herramientas diseñadas específicamente para odontólogos.',
    },
    {
      icon: <Shield className="w-12 h-12 text-indigo-600" />,
      title: 'Seguridad Garantizada',
      description: 'Protección de datos con los más altos estándares de seguridad.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Bienvenido al Sistema de
                <br />
                <span className="text-blue-200">Gestión Odontológica</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
                La solución completa para administrar tu consultorio odontológico
                de manera simple y profesional.
              </p>

              {/* Botones de acceso */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link to="/paciente">
                  <Card className="w-80 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-2 border-transparent hover:border-blue-400">
                    <CardContent className="p-8 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 bg-blue-100 rounded-full">
                          <Users className="w-12 h-12 text-blue-600" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Soy Paciente
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Gestiona tus turnos y consultas médicas
                      </p>
                      <Button variant="primary" className="w-full">
                        Acceder como Paciente
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/odontologo">
                  <Card className="w-80 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-2 border-transparent hover:border-indigo-400">
                    <CardContent className="p-8 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 bg-indigo-100 rounded-full">
                          <Stethoscope className="w-12 h-12 text-indigo-600" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Soy Odontólogo
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Administra tu consultorio y pacientes
                      </p>
                      <Button variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-700">
                        Acceder como Odontólogo
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Características Principales
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Herramientas diseñadas para optimizar la gestión de tu consultorio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para comenzar?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Únete a miles de profesionales que ya confían en nuestro sistema
            </p>
            <Link to="/register">
              <Button 
                variant="secondary" 
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                Crear Cuenta Gratis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
