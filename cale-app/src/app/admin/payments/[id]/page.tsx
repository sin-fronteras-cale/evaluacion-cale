'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
        const loadPayment = async () => {
            const id = params?.id as string;
            const res = await fetch(`/api/payments/${id}`);
            if (!res.ok) {
                setError('No se pudo cargar el detalle del pago.');
                return;
            }
            const data = await res.json();
            setPayment(data);
        };
        loadPayment();
    }, [params]);

    const formatCOP = (amountInCents: number) => {
        const amount = amountInCents / 100;
        return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 p-8">
                <header className="flex items-center justify-between gap-4 mb-10">
                    <div>
                        <button
                            onClick={() => router.push('/admin/payments')}
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-4"
                        >
                            <ArrowLeft size={18} /> Volver a pagos
                        </button>
                        <h1 className="text-3xl font-bold text-slate-900">Detalle de pago</h1>
                        <p className="text-slate-500">Informacion completa de la transaccion.</p>
                    </div>
                </header>

                {error && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-600">
                        {error}
                    </div>
                )}

                {!error && !payment && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                        Cargando detalle...
                    </div>
                )}

                {payment && (
                    <div className="grid lg:grid-cols-3 gap-6">
                        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Resumen</h2>
                                    <p className="text-sm text-slate-500">Transaccion #{payment.transactionId}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{payment.status}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monto</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">${formatCOP(payment.amountInCents)} {payment.currency}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metodo</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{payment.paymentMethodType || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Referencia</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1 break-all">{payment.reference}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuario</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{payment.userName || 'Usuario'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correo</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{payment.customerEmail || 'Sin correo'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{new Date(payment.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white border border-slate-200 rounded-2xl p-8">
                            <h3 className="text-sm font-bold text-slate-900 mb-4">Respuesta Wompi (raw)</h3>
                            <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 max-h-[520px] overflow-auto">
{JSON.stringify(payment.raw, null, 2)}
                            </pre>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
