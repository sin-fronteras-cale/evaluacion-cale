
'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
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
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Credenciales incorrectas');
        return;
      }

      storage.setCurrentUser(data.user);
      router.push(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError('Error al iniciar sesión');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyAcceptedAt) {
      setError('Debes leer y aceptar la politica de tratamiento de datos');
      return;
    }
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
      password: registerPassword,
      phone,
      idType,
      idNumber,
      city,
      department,
      policyAcceptedAt
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.35)]">
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
              onClick={() => { setIsLoginOpen(true); setError(''); }}
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setIsRegisterOpen(true); setError(''); }}
              className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all font-medium shadow-lg shadow-slate-900/20"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-white/60 text-slate-700 text-sm font-semibold mb-6 shadow-sm">
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
              className="px-8 py-4 bg-gray-900 text-white rounded-full hover:bg-black transition-all font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
            >
              Comenzar Ahora
            </button>
            <button
              onClick={() => { setIsLoginOpen(true); setError(''); }}
              className="px-8 py-4 bg-white/80 text-gray-900 rounded-full hover:bg-white transition-all font-semibold text-lg border border-white/70 shadow-sm"
            >
              Iniciar Sesión
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 border-t border-white/50">
        <motion.div
          className="max-w-4xl mx-auto grid md:grid-cols-3 gap-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="text-center apple-card px-6 py-8"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">40+</div>
            <p className="text-gray-600 font-medium">Preguntas por categoría</p>
          </motion.div>
          <motion.div
            className="text-center apple-card px-6 py-8"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">3</div>
            <p className="text-gray-600 font-medium">Niveles de dificultad</p>
          </motion.div>
          <motion.div
            className="text-center apple-card px-6 py-8"
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
                className="p-8 apple-card transition-all"
                whileHover={{ y: -10, boxShadow: '0 24px 50px rgba(15, 23, 42, 0.15)' }}
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
      <section className="py-20 px-6 bg-[#0b1220] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -top-32 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 left-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>
        <motion.div
          className="relative max-w-3xl mx-auto text-center space-y-8"
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
            className="px-8 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-all font-semibold text-lg inline-block shadow-xl"
          >
            Registrarse Gratis
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">© 2026 CALE - Escuela Sin Fronteras</p>
        </div>
      </footer>

      {/* Login Modal */}
      <Modal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        title="Bienvenido de nuevo"
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
          <div className="text-center text-sm text-gray-500">
            <Link
              href="/forgot-password"
              className="text-gray-700 hover:text-gray-900 underline"
              onClick={() => setIsLoginOpen(false)}
            >
              Olvidaste tu contrasena?
            </Link>
          </div>
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
            <label className="block text-sm font-medium text-gray-900 mb-1">Celular</label>
            <input
              type="tel" required
              value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
              placeholder="3001234567"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Tipo de Identificacion</label>
              <select
                required
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
              >
                <option value="CC">Cedula</option>
                <option value="CE">Cedula de Extranjeria</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PAS">Pasaporte</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Numero de Identificacion</label>
              <input
                type="text" required
                value={idNumber} onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                placeholder="123456789"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Ciudad</label>
              <input
                type="text" required
                value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                placeholder="Bogota"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Departamento</label>
              <input
                type="text" required
                value={department} onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                placeholder="Cundinamarca"
              />
            </div>
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
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Politica de Tratamiento de Datos</p>
              <p className="text-xs text-gray-600">
                {policyAcceptedAt ? 'Aceptada' : 'Pendiente de lectura y aceptacion'}
              </p>
            </div>
            <button
              type="button"
              onClick={openPolicy}
              className="px-3 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
            >
              Leer politica
            </button>
          </div>
          <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-all mt-4">
            Empezar Evaluación
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
        title="Politica de Tratamiento de Datos"
      >
        <div className="space-y-4">
          <div
            className="max-h-[60vh] overflow-y-auto text-xs text-gray-700 leading-relaxed pr-2"
            onScroll={handlePolicyScroll}
          >
            <p className="font-semibold mb-2">POLITICA DE TRATAMIENTO DE DATOS PERSONALES</p>
            <p className="mb-2">Plataforma de Evaluacion Teorica CALE</p>
            <p className="mb-2">En cumplimiento de lo dispuesto en el articulo 15 de la Constitucion Politica de Colombia, la Ley 1581 de 2012, el Decreto 1377 de 2013, la Ley 1266 de 2008, y los lineamientos impartidos por la Superintendencia de Industria y Comercio (SIC), la presente Politica de Tratamiento de Datos Personales regula la recoleccion, uso, almacenamiento, circulacion y supresion de datos personales a traves de la Plataforma de Evaluacion Teorica CALE, incluyendo el tratamiento de datos personales de ninos, ninas y adolescentes.</p>
            <p className="font-semibold mb-1">1. Responsable del tratamiento</p>
            <p className="mb-2">El responsable del tratamiento de los datos personales es el administrador de la Plataforma de Evaluacion Teorica CALE, quien actua como responsable en los terminos establecidos por la legislacion colombiana vigente.</p>
            <p className="font-semibold mb-1">2. Marco legal aplicable</p>
            <p className="mb-2">Constitucion Politica de Colombia – Articulo 15. Ley 1581 de 2012. Decreto 1377 de 2013. Ley 1266 de 2008. Circulares y lineamientos de la Superintendencia de Industria y Comercio (SIC).</p>
            <p className="font-semibold mb-1">3. Definiciones</p>
            <p className="mb-2">Se aplican las definiciones contenidas en la Ley 1581 de 2012, incluyendo: Dato personal, Dato publico, Titular, Tratamiento, Responsable del tratamiento, Ninos, ninas y adolescentes (NNA).</p>
            <p className="font-semibold mb-1">4. Datos personales objeto de tratamiento</p>
            <p className="mb-2">La plataforma podra recolectar, entre otros, los siguientes datos personales: Nombre y apellidos, Tipo y numero de identificacion (cuando aplique), Edad, Correo electronico, Resultados, puntajes y registros academicos. En el caso de menores de edad, unicamente se trataran datos estrictamente necesarios para fines academicos.</p>
            <p className="font-semibold mb-1">5. Tratamiento de datos de menores de edad</p>
            <p className="mb-2">El tratamiento de datos personales de ninos, ninas y adolescentes se realizara exclusivamente cuando: Responda y respete el interes superior del menor, Asegure el respeto de sus derechos fundamentales, Exista autorizacion expresa y verificable del padre, madre o representante legal. La plataforma no exigira datos sensibles de menores de edad ni realizara tratamientos que puedan afectar negativamente sus derechos.</p>
            <p className="font-semibold mb-1">6. Finalidades del tratamiento</p>
            <p className="mb-2">Los datos personales seran tratados para las siguientes finalidades: Identificacion del usuario dentro de la plataforma, Permitir el acceso a la evaluacion teorica, Registrar y analizar resultados academicos, Realizar seguimiento formativo y estadistico, Mejorar los contenidos y funcionalidades del sistema, Atender requerimientos de autoridades competentes.</p>
            <p className="font-semibold mb-1">7. Autorizacion del titular y del representante legal</p>
            <p className="mb-2">El tratamiento de datos personales se realiza previa autorizacion libre, expresa, informada e inequivoca: Del titular de los datos, cuando sea mayor de edad; Del padre, madre o representante legal, cuando el titular sea menor de edad. Dicha autorizacion se entiende otorgada mediante la aceptacion de esta politica y el uso de la plataforma.</p>
            <p className="font-semibold mb-1">8. Derechos del titular de los datos</p>
            <p className="mb-2">El titular de los datos personales, o su representante legal en el caso de menores de edad, tiene derecho a: Conocer, actualizar y rectificar los datos personales, Solicitar prueba de la autorizacion otorgada, Solicitar la supresion de los datos o revocar la autorizacion, Ser informado sobre el uso dado a los datos, Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</p>
            <p className="font-semibold mb-1">9. Procedimiento para ejercer los derechos</p>
            <p className="mb-2">Las solicitudes podran ser presentadas por el titular o su representante legal, acreditando dicha calidad, mediante comunicacion dirigida al responsable del tratamiento. Las solicitudes seran atendidas dentro de los terminos establecidos por la ley colombiana vigente.</p>
            <p className="font-semibold mb-1">10. Uso de la plataforma y exoneracion de responsabilidad</p>
            <p className="mb-2">El usuario y/o su representante legal reconocen y aceptan que: La plataforma corresponde a un simulador academico; Los resultados obtenidos son orientativos y no oficiales; La aprobacion de las evaluaciones no garantiza la aprobacion del examen CALE oficial; El uso de la plataforma se realiza bajo su exclusiva responsabilidad, exonerando al responsable del tratamiento de cualquier consecuencia derivada del uso de los resultados.</p>
            <p className="font-semibold mb-1">11. Medidas de seguridad</p>
            <p className="mb-2">El responsable del tratamiento implementa medidas tecnicas, humanas y administrativas razonables para garantizar la seguridad de los datos personales y prevenir accesos no autorizados.</p>
            <p className="font-semibold mb-1">12. Vigencia</p>
            <p className="mb-2">La presente politica entra en vigencia a partir de su publicacion y permanecera vigente mientras se realice el tratamiento de datos personales en la plataforma.</p>
            <p className="font-semibold mb-1">13. Aceptacion de la politica</p>
            <p>Al acceder o utilizar la plataforma, el usuario y/o su representante legal declara haber leido, comprendido y aceptado la presente Politica de Tratamiento de Datos Personales, conforme a la normativa colombiana vigente.</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] text-gray-500">
              {policyScrolled ? 'Puedes aceptar la politica' : 'Desplaza hasta el final para habilitar'}
            </p>
            <button
              type="button"
              onClick={acceptPolicy}
              disabled={!policyScrolled}
              className="px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              Leido y acepto
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
