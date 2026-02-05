
'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { User } from '@/lib/data';
import { Modal } from '@/components/Modal';
import { LogIn, UserPlus, Shield, ChevronRight, BookOpen, Zap, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const current = storage.getCurrentUser();
    if (current) {
      if (current.role === 'admin') router.push('/admin');
      else router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const users = await storage.getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      if (isAdminMode && user.role !== 'admin') {
        setError('No tienes permisos de administrador');
        return;
      }
      storage.setCurrentUser(user);
      router.push(user.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      setError('Credenciales incorrectas');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const users = await storage.getUsers();
    if (users.find(u => u.email === email)) {
      setError('El correo ya está registrado');
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role: 'user',
      password: registerPassword
    };

    await storage.saveUser(newUser);
    storage.setCurrentUser(newUser);
    router.push('/dashboard');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  return (
    <div className="bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-semibold text-gray-900"
          >
            CALE
          </motion.div>
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => { setIsLoginOpen(true); setIsAdminMode(false); setError(''); }}
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setIsRegisterOpen(true); setError(''); }}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium"
            >
              Registrarse
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold mb-6">
              <Zap size={16} />
              Plataforma de Evaluación CALE
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight tracking-tight"
          >
            Domina tu examen de
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              conducción
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            Prepárate para obtener tu licencia de conducción con nuestra plataforma interactiva. Categorías A2, B1 y C1 con evaluaciones completas y análisis detallado de resultados.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <button
              onClick={() => { setIsRegisterOpen(true); setError(''); }}
              className="px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Comenzar Ahora
            </button>
            <button
              onClick={() => { setIsLoginOpen(true); setIsAdminMode(false); setError(''); }}
              className="px-8 py-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-all font-semibold text-lg"
            >
              Iniciar Sesión
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 border-t border-gray-100">
        <motion.div
          className="max-w-4xl mx-auto grid md:grid-cols-3 gap-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="text-center"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">40+</div>
            <p className="text-gray-600 font-medium">Preguntas por categoría</p>
          </motion.div>
          <motion.div
            className="text-center"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">3</div>
            <p className="text-gray-600 font-medium">Niveles de dificultad</p>
          </motion.div>
          <motion.div
            className="text-center"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">100%</div>
            <p className="text-gray-600 font-medium">Análisis de resultados</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">
            Todo lo que necesitas
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Preguntas Reales',
                description: 'Basadas en exámenes oficiales de conducción'
              },
              {
                icon: Award,
                title: 'Certificación',
                description: 'Obtén reportes detallados de tu desempeño'
              },
              {
                icon: Zap,
                title: 'Análisis Inteligente',
                description: 'Identifica tus áreas débiles y mejora'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all"
                whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                transition={{ duration: 0.3 }}
              >
                <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-900 text-white">
        <motion.div
          className="max-w-3xl mx-auto text-center space-y-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl text-gray-300">
            Únete a miles de estudiantes que ya aprobaron su examen CALE
          </p>
          <button
            onClick={() => { setIsRegisterOpen(true); setError(''); }}
            className="px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all font-semibold text-lg inline-block"
          >
            Registrarse Gratis
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">© 2026 CALE - Escuela Sin Fronteras</p>
          <button
            onClick={() => { setIsLoginOpen(true); setIsAdminMode(true); setError(''); }}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium flex items-center gap-1 group"
          >
            Acceso Admin <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </footer>

      {/* Login Modal */}
      <Modal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        title={isAdminMode ? 'Acceso Administrador' : 'Bienvenido de nuevo'}
      >
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Correo Electrónico</label>
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Contraseña</label>
            <input
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all mt-4">
            Ingresar
          </button>
        </form>
      </Modal>

      {/* Register Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Crear Nueva Cuenta"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Nombre Completo</label>
            <input
              type="text" required
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
              placeholder="Juan Perez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Correo Electrónico</label>
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Contraseña</label>
            <input
              type="password" required
              value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all mt-4">
            Empezar Evaluación
          </button>
        </form>
      </Modal>
    </div>
  );
}
