
'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

import { User } from '@/lib/data';
import { Modal } from '@/components/Modal';
import { BookOpen, Zap, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idType, setIdType] = useState('CC');
  const [idNumber, setIdNumber] = useState('');
  const [city, setCity] = useState('');
  const [department, setDepartment] = useState('');
  const [policyAcceptedAt, setPolicyAcceptedAt] = useState('');
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [policyScrolled, setPolicyScrolled] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[LandingPage] Verificando autenticación...');
      const current = await authClient.getCurrentUser();
      console.log('[LandingPage] Usuario actual:', current);
      
      if (current) {
        console.log('[LandingPage] Usuario autenticado, redirigiendo...');
        if (current.role === 'admin') {
          console.log('[LandingPage] Es admin, redirigiendo a /admin');
          router.push('/admin');
        } else {
          console.log('[LandingPage] Es usuario regular, redirigiendo a /dashboard');
          router.push('/dashboard');
        }
      } else {
        console.log('[LandingPage] No hay usuario autenticado');
      }
    };
    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) {
      console.log('[handleLogin] Ya hay un proceso de login en curso, ignorando...');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    console.log('🚀 [handleLogin] Iniciando proceso de login...');
    console.log('📧 [handleLogin] Email:', email);
    console.log('🔑 [handleLogin] Password length:', password.length);

    try {
      console.log('📡 [handleLogin] Llamando authClient.login...');
      const result = await authClient.login(email, password);
      console.log('📨 [handleLogin] Resultado completo:', result);
      
      if (!result.success) {
        console.error('❌ [handleLogin] Login FALLÓ');
        console.error('❌ [handleLogin] Error específico:', result.error);
        setError(result.error || 'Credenciales incorrectas');
        setIsLoading(false);
        return;
      }

      if (result.user) {
        console.log('✅ [handleLogin] Login exitoso, usuario:', result.user);
        
        // Verificar que la sesión esté activa antes de redirigir
        try {
          console.log('🔍 [handleLogin] Verificando sesión...');
          const verifyRes = await fetch('/api/auth/me', { credentials: 'include' });
          console.log('🔍 [handleLogin] Verificación status:', verifyRes.status);
          
          if (verifyRes.ok) {
            console.log('✅ [handleLogin] Sesión verificada, redirigiendo...');
            const targetUrl = result.user.role === 'admin' ? '/admin' : '/dashboard';
            console.log('🚀 [handleLogin] Redirigiendo a:', targetUrl);
            window.location.href = targetUrl;
          } else {
            console.error('❌ [handleLogin] La sesión no se estableció correctamente');
            setError('Error al establecer la sesión. Por favor intenta de nuevo.');
            setIsLoading(false);
          }
        } catch (verifyErr) {
          console.error('❌ [handleLogin] Error verificando sesión:', verifyErr);
          setError('Error al verificar la sesión');
          setIsLoading(false);
        }
      } else {
        console.error('Login exitoso pero sin usuario en respuesta');
        setError('Error inesperado al iniciar sesión');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Excepción en handleLogin:', err);
      setError('Error al procesar la solicitud');
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!policyAcceptedAt) {
      setError('Debes leer y aceptar la politica de tratamiento de datos');
      return;
    }

    if (registerPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Registrar usuario usando API pública
    const registerRes = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name,
        email,
        password: registerPassword,
        phone,
        idType,
        idNumber,
        city,
        department,
        policyAcceptedAt
      })
    });
    
    if (!registerRes.ok) {
      const data = await registerRes.json();
      setError(data?.error || 'Error al registrar usuario');
      return;
    }
    
    // El registro exitoso ya crea la sesión automáticamente
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

  const handlePolicyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
      setPolicyScrolled(true);
    }
  };

  const openPolicy = () => {
    setPolicyScrolled(false);
    setIsPolicyOpen(true);
  };

  const acceptPolicy = () => {
    if (!policyScrolled) return;
    setPolicyAcceptedAt(new Date().toISOString());
    setIsPolicyOpen(false);
  };

  return (
    <div className="bg-transparent overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center"
          >
            <Image
              src="/logo.png"
              alt="Escuela Sin Fronteras"
              width={320}
              height={96}
              className="h-14 w-auto object-contain hover:opacity-90 transition-opacity duration-200"
              priority
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="hidden md:flex items-center gap-5"
          >
            <button
              onClick={() => { setIsLoginOpen(true); setError(''); }}
              className="text-gray-900 hover:text-gray-600 transition-colors duration-200 font-normal text-sm px-4 py-2"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setIsRegisterOpen(true); setError(''); }}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-all duration-200 font-normal hover:scale-[1.02]"
            >
              Registrarse
            </button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-52 pb-32 px-6">
        <motion.div
          className="max-w-5xl mx-auto text-center space-y-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-100/80 backdrop-blur-xl text-gray-900 text-sm font-medium mb-8">
              <Zap size={18} className="text-blue-600" />
              Plataforma de Evaluación CALE
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-8xl font-semibold text-gray-900 leading-[1.05] tracking-[-0.02em]"
          >
            Domina tu examen de{' '}
            <span className="text-gray-900">
              conducción
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-normal"
          >
            Prepárate para obtener tu licencia con evaluaciones completas. Categorías A2, B1 y C1.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-5 justify-center pt-8"
          >
            <button
              onClick={() => { setIsRegisterOpen(true); setError(''); }}
              className="px-10 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium text-base hover:shadow-lg hover:scale-[1.02]"
            >
              Comenzar Ahora
            </button>
            <button
              onClick={() => { setIsLoginOpen(true); setError(''); }}
              className="px-10 py-4 bg-transparent text-blue-600 rounded-full hover:bg-gray-100 transition-all duration-200 font-medium text-base border border-gray-300"
            >
              Iniciar Sesión
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-28 px-6 bg-gray-50/50">
        <motion.div
          className="max-w-5xl mx-auto grid md:grid-cols-3 gap-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-6xl md:text-7xl font-semibold text-gray-900 mb-3">40+</div>
            <p className="text-lg text-gray-600">Preguntas por categoría</p>
          </motion.div>
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-6xl md:text-7xl font-semibold text-gray-900 mb-3">3</div>
            <p className="text-lg text-gray-600">Niveles de dificultad</p>
          </motion.div>
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-6xl md:text-7xl font-semibold text-gray-900 mb-3">100%</div>
            <p className="text-lg text-gray-600">Análisis de resultados</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-semibold text-gray-900 text-center mb-24 tracking-tight">
            Todo lo que necesitas
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
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
                className="p-10 bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 transition-all"
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <feature.icon className="w-14 h-14 text-blue-600 mb-6" strokeWidth={1.5} />
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />
        </div>
        <motion.div
          className="relative max-w-4xl mx-auto text-center space-y-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-7xl font-semibold tracking-tight">
            ¿Listo para empezar?
          </h2>
          <p className="text-2xl text-gray-300 font-normal">
            Únete a miles de estudiantes que ya aprobaron su examen
          </p>
          <button
            onClick={() => { setIsRegisterOpen(true); setError(''); }}
            className="px-10 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-all duration-200 font-medium text-base inline-block hover:scale-[1.02]"
          >
            Registrarse Gratis
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-gray-600 text-sm font-normal">© 2026 Escuela Sin Fronteras. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Login Modal */}
      <Modal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        title="Iniciar Sesión"
      >
        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 font-normal">{error}</div>}
          <div>
            <label className="block text-sm font-normal text-gray-900 mb-2">Correo Electrónico</label>
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-normal text-gray-900 mb-2">Contraseña</label>
            <input
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-normal transition-all mt-6 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
          <div className="text-center text-sm text-gray-600 pt-2">
            <Link
              href="/forgot-password"
              className="text-blue-600 hover:text-blue-700 font-normal"
              onClick={() => setIsLoginOpen(false)}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </Modal>

      {/* Register Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Crear Cuenta"
      >
        <form onSubmit={handleRegister} className="space-y-5">
          {error && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 font-normal">{error}</div>}
          <div>
            <label className="block text-sm font-normal text-gray-900 mb-2">Nombre Completo</label>
            <input
              type="text" required
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-normal text-gray-900 mb-2">Celular</label>
            <input
              type="tel" required
              value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
              placeholder="300 123 4567"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-normal text-gray-900 mb-2">Tipo ID</label>
              <select
                required
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base bg-white"
              >
                <option value="CC">Cédula</option>
                <option value="CE">Cédula Extranjería</option>
                <option value="TI">Tarjeta Identidad</option>
                <option value="PAS">Pasaporte</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-normal text-gray-900 mb-2">Número ID</label>
              <input
                type="text" required
                value={idNumber} onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                placeholder="123456789"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-normal text-gray-900 mb-2">Ciudad</label>
              <input
                type="text" required
                value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                placeholder="Bogotá"
              />
            </div>
            <div>
              <label className="block text-sm font-normal text-gray-900 mb-2">Departamento</label>
              <input
                type="text" required
                value={department} onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                placeholder="Cundinamarca"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-normal text-gray-900 mb-2">Correo Electrónico</label>
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-normal text-gray-900 mb-2">Contraseña</label>
            <input
              type="password" required
              value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
              placeholder="••••••••"
            />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Política de Tratamiento de Datos</p>
              <p className="text-xs text-gray-600 mt-1">
                {policyAcceptedAt ? 'Aceptada' : 'Pendiente de lectura'}
              </p>
            </div>
            <button
              type="button"
              onClick={openPolicy}
              className="px-4 py-2.5 text-sm font-normal bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              Leer
            </button>
          </div>
          <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-normal transition-all mt-6 hover:scale-[1.01]">
            Crear Cuenta
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
        title="Política de Datos"
      >
        <div className="space-y-5">
          <div
            className="max-h-[55vh] overflow-y-auto text-sm text-gray-700 leading-relaxed pr-3 space-y-4"
            onScroll={handlePolicyScroll}
          >
            <p className="font-semibold text-gray-900">POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES</p>
            <p>Plataforma de Evaluación Teórica CALE</p>
            <p>En cumplimiento de lo dispuesto en el artículo 15 de la Constitución Política de Colombia, la Ley 1581 de 2012, el Decreto 1377 de 2013, la Ley 1266 de 2008, y los lineamientos impartidos por la Superintendencia de Industria y Comercio (SIC), la presente Política de Tratamiento de Datos Personales regula la recolección, uso, almacenamiento, circulación y supresión de datos personales a través de la Plataforma de Evaluación Teórica CALE, incluyendo el tratamiento de datos personales de niños, niñas y adolescentes.</p>
            <p className="font-semibold text-gray-900">1. Responsable del tratamiento</p>
            <p>El responsable del tratamiento de los datos personales es el administrador de la Plataforma de Evaluación Teórica CALE, quien actúa como responsable en los términos establecidos por la legislación colombiana vigente.</p>
            <p className="font-semibold text-gray-900">2. Marco legal aplicable</p>
            <p>Constitución Política de Colombia – Artículo 15. Ley 1581 de 2012. Decreto 1377 de 2013. Ley 1266 de 2008. Circulares y lineamientos de la Superintendencia de Industria y Comercio (SIC).</p>
            <p className="font-semibold text-gray-900">3. Definiciones</p>
            <p>Se aplican las definiciones contenidas en la Ley 1581 de 2012, incluyendo: Dato personal, Dato público, Titular, Tratamiento, Responsable del tratamiento, Niños, niñas y adolescentes (NNA).</p>
            <p className="font-semibold text-gray-900">4. Datos personales objeto de tratamiento</p>
            <p>La plataforma podrá recolectar, entre otros, los siguientes datos personales: Nombre y apellidos, Tipo y número de identificación (cuando aplique), Edad, Correo electrónico, Resultados, puntajes y registros académicos. En el caso de menores de edad, únicamente se tratarán datos estrictamente necesarios para fines académicos.</p>
            <p className="font-semibold text-gray-900">5. Tratamiento de datos de menores de edad</p>
            <p>El tratamiento de datos personales de niños, niñas y adolescentes se realizará exclusivamente cuando: Responda y respete el interés superior del menor, Asegure el respeto de sus derechos fundamentales, Exista autorización expresa y verificable del padre, madre o representante legal. La plataforma no exigirá datos sensibles de menores de edad ni realizará tratamientos que puedan afectar negativamente sus derechos.</p>
            <p className="font-semibold text-gray-900">6. Finalidades del tratamiento</p>
            <p>Los datos personales serán tratados para las siguientes finalidades: Identificación del usuario dentro de la plataforma, Permitir el acceso a la evaluación teórica, Registrar y analizar resultados académicos, Realizar seguimiento formativo y estadístico, Mejorar los contenidos y funcionalidades del sistema, Atender requerimientos de autoridades competentes.</p>
            <p className="font-semibold text-gray-900">7. Autorización del titular y del representante legal</p>
            <p>El tratamiento de datos personales se realiza previa autorización libre, expresa, informada e inequívoca: Del titular de los datos, cuando sea mayor de edad; Del padre, madre o representante legal, cuando el titular sea menor de edad. Dicha autorización se entiende otorgada mediante la aceptación de esta política y el uso de la plataforma.</p>
            <p className="font-semibold text-gray-900">8. Derechos del titular de los datos</p>
            <p>El titular de los datos personales, o su representante legal en el caso de menores de edad, tiene derecho a: Conocer, actualizar y rectificar los datos personales, Solicitar prueba de la autorización otorgada, Solicitar la supresión de los datos o revocar la autorización, Ser informado sobre el uso dado a los datos, Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</p>
            <p className="font-semibold text-gray-900">9. Procedimiento para ejercer los derechos</p>
            <p>Las solicitudes podrán ser presentadas por el titular o su representante legal, acreditando dicha calidad, mediante comunicación dirigida al responsable del tratamiento. Las solicitudes serán atendidas dentro de los términos establecidos por la ley colombiana vigente.</p>
            <p className="font-semibold text-gray-900">10. Uso de la plataforma y exoneración de responsabilidad</p>
            <p>El usuario y/o su representante legal reconocen y aceptan que: La plataforma corresponde a un simulador académico; Los resultados obtenidos son orientativos y no oficiales; La aprobación de las evaluaciones no garantiza la aprobación del examen CALE oficial; El uso de la plataforma se realiza bajo su exclusiva responsabilidad, exonerando al responsable del tratamiento de cualquier consecuencia derivada del uso de los resultados.</p>
            <p className="font-semibold text-gray-900">11. Medidas de seguridad</p>
            <p>El responsable del tratamiento implementa medidas técnicas, humanas y administrativas razonables para garantizar la seguridad de los datos personales y prevenir accesos no autorizados.</p>
            <p className="font-semibold text-gray-900">12. Vigencia</p>
            <p>La presente política entra en vigencia a partir de su publicación y permanecerá vigente mientras se realice el tratamiento de datos personales en la plataforma.</p>
            <p className="font-semibold text-gray-900">13. Aceptación de la política</p>
            <p>Al acceder o utilizar la plataforma, el usuario y/o su representante legal declara haber leído, comprendido y aceptado la presente Política de Tratamiento de Datos Personales, conforme a la normativa colombiana vigente.</p>
          </div>
          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs text-gray-600">
              {policyScrolled ? 'Puedes aceptar la política' : 'Desplázate hasta el final'}
            </p>
            <button
              type="button"
              onClick={acceptPolicy}
              disabled={!policyScrolled}
              className="px-5 py-2.5 text-sm font-normal bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Leído y acepto
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
