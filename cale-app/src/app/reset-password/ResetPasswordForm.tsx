'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ResetPasswordFormProps = {
  token: string;
};

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!token) {
      setStatus('error');
      setMessage('Token invalido');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Las contrasenas no coinciden');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage(data?.error || 'No se pudo restablecer');
        return;
      }

      setStatus('success');
      setMessage('Contrasena actualizada. Ya puedes iniciar sesion.');
      setTimeout(() => router.push('/'), 1500);
    } catch {
      setStatus('error');
      setMessage('No se pudo restablecer');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-xl p-10">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">Restablecer contraseña</h1>
        <p className="text-base text-gray-600 mb-8 leading-relaxed">
          Ingresa tu nueva contraseña para recuperar tu cuenta.
        </p>

        {message && (
          <div
            className={`mb-6 text-sm rounded-2xl px-5 py-4 ${
              status === 'error'
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-normal text-gray-900 mb-2">Nueva contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-normal text-gray-900 mb-2">Confirmar contraseña</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-normal hover:bg-blue-700 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {status === 'loading' ? 'Actualizando...' : 'Actualizar contraseña'}
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
