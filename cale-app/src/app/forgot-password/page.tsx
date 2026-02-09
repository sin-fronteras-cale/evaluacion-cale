'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data?.error || 'No se pudo enviar el correo');
        setStatus('error');
        return;
      }

      setStatus('sent');
      setMessage('Si el correo existe, enviaremos un link para restablecer tu contrasena.');
    } catch {
      setStatus('error');
      setMessage('No se pudo enviar el correo');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-xl p-10">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">Recuperar contraseña</h1>
        <p className="text-base text-gray-600 mb-8 leading-relaxed">
          Ingresa tu correo y te enviaremos un link para restablecer tu contraseña.
        </p>

        {message && (
          <div
            className={`mb-6 text-sm rounded-2xl px-5 py-4 ${
              status === 'error'
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-normal text-gray-900 mb-2">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-normal hover:bg-blue-700 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {status === 'loading' ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-normal transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
