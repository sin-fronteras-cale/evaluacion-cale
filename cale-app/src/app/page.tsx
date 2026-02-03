
'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { User } from '@/lib/data';
import { Modal } from '@/components/Modal';
import { LogIn, UserPlus, Shield, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-[100px] opacity-50" />

      <main className="z-10 w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-in order-2 md:order-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Shield size={14} />
            Evaluación Cale Profesional
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Conduce tu <span className="text-blue-600">Futuro</span> Sin Fronteras.
          </h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Prepárate para tu examen de conducción con nuestra plataforma de evaluación interactiva. A2, B1 y C1.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => { setIsRegisterOpen(true); setError(''); }}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
            >
              Registrarse <UserPlus size={18} />
            </button>
            <button
              onClick={() => { setIsLoginOpen(true); setIsAdminMode(false); setError(''); }}
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              Iniciar Sesión <LogIn size={18} />
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex gap-8">
            <div>
              <p className="text-2xl font-bold text-slate-900">40</p>
              <p className="text-sm text-slate-500">Preguntas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">A2, B1, C1</p>
              <p className="text-sm text-slate-500">Categorías</p>
            </div>
          </div>
        </div>

        <div className="relative order-1 md:order-2">
          <div className="aspect-square bg-white rounded-[2rem] shadow-2xl p-8 border border-slate-100 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-amber-500/5" />
            <div className="h-full flex flex-col justify-between relative z-10">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Shield size={24} />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Escuela de Conducción</p>
                  <p className="text-xl font-bold text-slate-900">Sin Fronteras</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-4 w-3/4 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-4 w-1/2 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-4 w-2/3 bg-slate-100 rounded-full animate-pulse" />
              </div>

              <button
                onClick={() => { setIsLoginOpen(true); setIsAdminMode(true); setError(''); }}
                className="w-full py-4 text-sm font-medium text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 group"
              >
                Acceso Administrador <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      <Modal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        title={isAdminMode ? 'Acceso Administrador' : 'Bienvenido de nuevo'}
      >
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-100 transition-all mt-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
            <input
              type="text" required
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Juan Perez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password" required
              value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-100 transition-all mt-4">
            Empezar Evaluación
          </button>
        </form>
      </Modal>
    </div>
  );
}
