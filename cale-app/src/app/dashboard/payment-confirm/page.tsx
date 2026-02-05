'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { storage } from '@/lib/storage';

function PaymentConfirmContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const transactionId = searchParams.get('id');

    useEffect(() => {
        const verifyPayment = async () => {
            if (!transactionId) {
                setStatus('failed');
                return;
            }

            try {
                const res = await fetch(`/api/payments/verify?id=${transactionId}`);
                const data = await res.json();

                if (data.success) {
                    setStatus('success');
                    // Update local storage to reflect the change immediately
                    const currentUser = storage.getCurrentUser();
                    if (currentUser) {
                        currentUser.isPro = true;
                        storage.setCurrentUser(currentUser);
                    }
                    // Redirect to dashboard after 3 seconds
                    setTimeout(() => router.push('/dashboard'), 3000);
                } else {
                    setStatus('failed');
                }
            } catch (e) {
                console.error(e);
                setStatus('failed');
            }
        };

        verifyPayment();
    }, [transactionId, router]);

    return (
        <div className="bg-white p-12 rounded-[2rem] border border-slate-200 shadow-2xl max-w-md w-full text-center">
            {status === 'loading' && (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Verificando Pago</h1>
                    <p className="text-slate-500">Espera un momento mientras confirmamos tu transacción con Wompi...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center animate-fade-in">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={48} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">¡Pago Exitoso!</h1>
                    <p className="text-slate-500 mb-8">Tu cuenta ha sido actualizada a **PRO**. Ahora tienes acceso a todos los simulacros.</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
                    >
                        Ir al Panel de Control
                    </button>
                </div>
            )}

            {status === 'failed' && (
                <div className="flex flex-col items-center animate-fade-in">
                    <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <XCircle size={48} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Ocurrió un Problema</h1>
                    <p className="text-slate-500 mb-8">No pudimos confirmar tu pago. Si crees que esto es un error, por favor contáctanos.</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold transition-all"
                    >
                        Volver al Panel
                    </button>
                </div>
            )}
        </div>
    );
}

export default function PaymentConfirmPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <Suspense fallback={
                <div className="bg-white p-12 rounded-[2rem] border border-slate-200 shadow-2xl max-w-md w-full text-center">
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6 mx-auto" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Cargando...</h1>
                </div>
            }>
                <PaymentConfirmContent />
            </Suspense>
        </div>
    );
}
