'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { ArrowLeft, CreditCard } from 'lucide-react';

interface PaymentDetail {
    id: string;
    transactionId: string;
    reference: string;
    status: string;
    amountInCents: number;
    currency: string;
    paymentMethodType?: string | null;
    customerEmail?: string | null;
    userName?: string | null;
    userId?: string | null;
    createdAt: string;
    raw: any;
}

export default function PaymentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [payment, setPayment] = useState<PaymentDetail | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkAuthAndLoadPayment = async () => {
            // Verificar autenticación primero
            const user = await authClient.getCurrentUser();
            if (!user) {
                console.error('No authenticated user, redirecting to login');
                router.push('/');
                return;
            }
            
            if (user.role !== 'admin') {
                console.error('User is not admin, redirecting to dashboard');
                router.push('/dashboard');
                return;
            }

            // Cargar detalle del pago
            const id = params?.id as string;
            const res = await fetch(`/api/payments/${id}`);
            if (!res.ok) {
                setError('No se pudo cargar el detalle del pago.');
                return;
            }
            const data = await res.json();
            setPayment(data);
        };
        
        checkAuthAndLoadPayment();
    }, [params, router]);

    const formatCOP = (amountInCents: number) => {
        const amount = amountInCents / 100;
        return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="flex min-h-screen bg-white">
            <AdminSidebar />
            <main className="flex-1 p-10">
                <header className="flex items-center justify-between gap-4 mb-12">
                    <div>
                        <button
                            onClick={() => router.push('/admin/payments')}
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                        >
                            <ArrowLeft size={18} /> Volver a pagos
                        </button>
                        <h1 className="text-3xl font-semibold text-gray-900">Detalle de pago</h1>
                        <p className="text-gray-600">Informacion completa de la transaccion.</p>
                    </div>
                </header>

                {error && (
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 text-gray-700 shadow-sm">
                        {error}
                    </div>
                )}

                {!error && !payment && (
                    <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-gray-600 shadow-sm">
                        Cargando detalle...
                    </div>
                )}

                {payment && (
                    <div className="grid lg:grid-cols-3 gap-6">
                        <section className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
                                    <p className="text-sm text-gray-600">Transaccion #{payment.transactionId}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">{payment.status}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monto</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">${formatCOP(payment.amountInCents)} {payment.currency}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Metodo</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">{payment.paymentMethodType || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Referencia</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1 break-all">{payment.reference}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Usuario</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">{payment.userName || 'Usuario'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Correo</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">{payment.customerEmail || 'Sin correo'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">{new Date(payment.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Respuesta Wompi (raw)</h3>
                            <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 max-h-[520px] overflow-auto">
{JSON.stringify(payment.raw, null, 2)}
                            </pre>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
