'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Search, CreditCard, ArrowUpRight } from 'lucide-react';

interface Payment {
    id: string;
    transactionId: string;
    reference: string;
    status: string;
    amountInCents: number;
    currency: string;
    paymentMethodType?: string | null;
    customerEmail?: string | null;
    userName?: string | null;
    createdAt: string;
}

export default function AdminPayments() {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [priceCop, setPriceCop] = useState(20000);
    const [priceInput, setPriceInput] = useState('20000');
    const [priceStatus, setPriceStatus] = useState('');
    const [isSavingPrice, setIsSavingPrice] = useState(false);

    useEffect(() => {
        const checkAuthAndLoadPayments = async () => {
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

            // Cargar pagos
            loadPayments();
        };

        const loadPayments = async () => {
            const res = await fetch('/api/payments', {
                credentials: 'include'
            });
            if (!res.ok) {
                setPayments([]);
                return;
            }
            const data = await res.json();
            setPayments(data.payments || []);
        };
        
        checkAuthAndLoadPayments();
    }, [router]);

    useEffect(() => {
        const loadPrice = async () => {
            try {
                const res = await fetch('/api/settings?key=pro_price_cop', {
                    credentials: 'include'
                });
                if (!res.ok) return;
                const data = await res.json();
                if (typeof data?.valueInt === 'number' && data.valueInt > 0) {
                    setPriceCop(data.valueInt);
                    setPriceInput(String(data.valueInt));
                }
            } catch (e) {
                console.error('Failed to load price setting', e);
            }
        };
        loadPrice();
    }, []);

    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return payments;
        return payments.filter(p => {
            return [
                p.reference,
                p.transactionId,
                p.status,
                p.customerEmail,
                p.userName,
                p.paymentMethodType
            ].filter(Boolean).join(' ').toLowerCase().includes(term);
        });
    }, [payments, searchTerm]);

    const formatCOP = (amountInCents: number) => {
        const amount = amountInCents / 100;
        return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount);
    };

    const formatCOPRaw = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount);
    };

    const handleSavePrice = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextValue = Number(priceInput);
        if (!Number.isFinite(nextValue) || nextValue <= 0) {
            setPriceStatus('Ingresa un valor valido en COP.');
            return;
        }

        setIsSavingPrice(true);
        setPriceStatus('');
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ key: 'pro_price_cop', valueInt: Math.round(nextValue) })
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                throw new Error(payload?.error || 'No se pudo guardar el precio.');
            }
            setPriceCop(Math.round(nextValue));
            setPriceInput(String(Math.round(nextValue)));
            setPriceStatus('Precio actualizado.');
        } catch (e) {
            const message = e instanceof Error ? e.message : 'No se pudo guardar el precio.';
            setPriceStatus(message);
        } finally {
            setIsSavingPrice(false);
        }
    };

    const statusStyles: Record<string, string> = {
        APPROVED: 'bg-emerald-50 text-emerald-700',
        DECLINED: 'bg-red-50 text-red-700',
        ERROR: 'bg-red-50 text-red-700',
        PENDING: 'bg-amber-50 text-amber-700'
    };

    return (
        <div className="flex min-h-screen bg-white">
            <AdminSidebar />
            <main className="flex-1 p-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900">Pagos</h1>
                        <p className="text-gray-600">Revisa el historial de transacciones y su estado.</p>
                    </div>
                </header>

                <section className="bg-white rounded-3xl border border-gray-200 p-6 mb-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Precio del boton de pago</h2>
                            <p className="text-sm text-gray-600">Actual en COP: ${formatCOPRaw(priceCop)}</p>
                        </div>
                        <form onSubmit={handleSavePrice} className="flex flex-col sm:flex-row items-stretch gap-3">
                            <input
                                type="number"
                                min={1}
                                step={1}
                                className="w-full sm:w-48 px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                                value={priceInput}
                                onChange={(e) => setPriceInput(e.target.value)}
                                placeholder="20000"
                            />
                            <button
                                type="submit"
                                disabled={isSavingPrice}
                                className="px-5 py-3.5 rounded-xl bg-blue-600 text-white font-normal hover:bg-blue-700 transition-all disabled:opacity-60"
                            >
                                {isSavingPrice ? 'Guardando...' : 'Guardar precio'}
                            </button>
                        </form>
                    </div>
                    {priceStatus && (
                        <p className="mt-3 text-sm text-gray-600">{priceStatus}</p>
                    )}
                </section>

                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                        <Search className="text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por referencia, correo o estado..."
                            className="bg-transparent border-none outline-none text-gray-900 w-full font-normal"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-600">
                            <CreditCard className="mx-auto mb-4 opacity-30" size={40} />
                            No hay pagos para mostrar.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/80 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide">Usuario</th>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide">Referencia</th>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide">Estado</th>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide">Monto</th>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide">Metodo</th>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide">Fecha</th>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide text-right">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{payment.userName || 'Usuario'}</p>
                                                    <p className="text-sm text-gray-600">{payment.customerEmail || 'Sin correo'}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm text-gray-700">{payment.reference}</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide ${statusStyles[payment.status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 font-semibold text-gray-900">${formatCOP(payment.amountInCents)} {payment.currency}</td>
                                            <td className="px-8 py-5 text-sm text-gray-700">{payment.paymentMethodType || 'N/A'}</td>
                                            <td className="px-8 py-5 text-sm text-gray-700">{new Date(payment.createdAt).toLocaleDateString()}</td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => router.push(`/admin/payments/${payment.id}`)}
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                >
                                                    Ver detalle <ArrowUpRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
