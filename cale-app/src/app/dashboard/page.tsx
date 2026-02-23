
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { authClient } from '@/lib/auth-client';
import { User, ExamResult, Category, Payment } from '@/lib/data';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogOut, BookOpen, Award, History, ChevronRight, Zap, Settings, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { WompiWidget } from '@/components/WompiWidget';
import { Modal } from '@/components/Modal';

const isSameLocalDay = (a: Date, b: Date) => {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
};

const getNextResetTime = (attemptDate: Date) => {
    const next = new Date(attemptDate);
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() + 1);
    return next;
};

const formatCountdown = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<User | null>(null);
    const [results, setResults] = useState<ExamResult[]>([]);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [profileDraft, setProfileDraft] = useState<Partial<User> | null>(null);
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [priceCop, setPriceCop] = useState(20000);

    // Derived state for limits
    const limitNextReset = useMemo(() => {
        if (!user || user.isPro) return null;
        const latestAttempt = results
            .filter(r => r.userId === user.id && !evaluations.some(ev => ev.id === r.category))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        if (latestAttempt) {
            const attemptDate = new Date(latestAttempt.date);
            if (isSameLocalDay(attemptDate, new Date())) {
                return getNextResetTime(attemptDate);
            }
        }
        return null;
    }, [user, results, evaluations]);

    const limitMessage = useMemo(() => {
        if (limitNextReset) return 'En modo prueba solo puedes realizar 1 evaluacion al dia.';
        if (searchParams.get('limit') === '1') return 'En modo prueba solo puedes realizar 1 evaluacion al dia.';
        return '';
    }, [limitNextReset, searchParams]);

    const [limitCountdown, setLimitCountdown] = useState('');
    const wompiPublicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';
    const paymentRedirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/dashboard/payment-confirm`
        : '';

    useEffect(() => {
        const loadData = async () => {
            const current = await authClient.getCurrentUser();
            if (!current) {
                router.push('/');
                return;
            }

            setUser(current);

            // Fetch all data in parallel to optimize load time
            const [resultsRes, paymentsRes, evalsRes] = await Promise.all([
                fetch('/api/results', { credentials: 'include' }).catch(() => null),
                fetch(`/api/payments?userId=${current.id}`, { credentials: 'include' }).catch(() => null),
                fetch('/api/evaluations', { credentials: 'include', cache: 'no-store' }).catch(() => null)
            ]);

            if (resultsRes?.ok) {
                const resultsData = await resultsRes.json();
                const userResults = resultsData.results?.filter((r: ExamResult) => r.userId === current.id).reverse() || [];
                setResults(userResults);
            }

            if (paymentsRes?.ok) {
                const paymentsData = await paymentsRes.json();
                setPayments(paymentsData.payments || []);
            }

            if (evalsRes?.ok) {
                const evalData = await evalsRes.json();
                setEvaluations(evalData.evaluations?.filter((e: any) => e.isActive) || []);
            }
        };
        loadData();
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
                }
            } catch (e) {
                console.error('Failed to load price setting', e);
            }
        };
        loadPrice();
    }, []);

    const handleLogout = async () => {
        await authClient.logout();
        router.push('/');
    };

    const openProfile = () => {
        if (!user) return;
        setProfileDraft({ ...user });
        setIsProfileOpen(true);
    };

    const loadPayments = async () => {
        if (!user) return;
        const res = await fetch(`/api/payments?userId=${user.id}`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            setPayments(data.payments || []);
        }
        setIsProfileOpen(false);
        setIsPaymentsModalOpen(true);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileDraft || !user) return;

        const updated: User = {
            ...user,
            name: profileDraft.name || user.name,
            email: profileDraft.email || user.email,
            phone: profileDraft.phone || '',
            idType: profileDraft.idType || 'CC',
            idNumber: profileDraft.idNumber || '',
            city: profileDraft.city || '',
            department: profileDraft.department || ''
        };

        // Actualizar perfil usando API de perfil (no requiere admin)
        const res = await fetch('/api/auth/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updated)
        });

        if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setIsProfileOpen(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (!user) return;
        if (passwordData.new.length < 6) {
            setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (passwordData.new !== passwordData.confirm) {
            setPasswordError('Las contraseñas no coinciden');
            return;
        }

        setPasswordStatus('loading');

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    currentPassword: passwordData.current,
                    newPassword: passwordData.new
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setPasswordError(data?.error || 'Error al cambiar contraseña');
                setPasswordStatus('idle');
                return;
            }

            setPasswordStatus('success');
            setTimeout(() => {
                setIsPasswordModalOpen(false);
                setPasswordStatus('idle');
                setPasswordData({ current: '', new: '', confirm: '' });
            }, 1500);
        } catch {
            setPasswordError('Error de conexión');
            setPasswordStatus('idle');
        }
    };

    useEffect(() => {
        if (!limitNextReset) {
            setLimitCountdown((prev) => prev !== '' ? '' : prev);
            return;
        }

        const updateCountdown = () => {
            const remaining = limitNextReset.getTime() - Date.now();
            if (remaining <= 0) {
                setLimitCountdown((prev) => prev !== '' ? '' : prev);
                return;
            }
            setLimitCountdown(formatCountdown(remaining));
        };

        updateCountdown();
        const timer = window.setInterval(updateCountdown, 1000);
        return () => window.clearInterval(timer);
    }, [limitNextReset]);

    const startExam = async (category: Category) => {
        if (!user) return;

        // Restriction for supertaxis users
        if (user.role === 'supertaxis' && ['A2', 'B1', 'C1'].includes(category)) {
            alert('Esta cuenta solo está autorizada para evaluaciones personalizadas.');
            return;
        }

        const isCustomEval = evaluations.some(e => e.id === category);

        if (!user.isPro && !isCustomEval) {
            const res = await fetch('/api/results', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                const allResults = data.results || [];
                const today = new Date();
                const hasAttemptToday = allResults.some((r: ExamResult) =>
                    r.userId === user.id && isSameLocalDay(new Date(r.date), today) &&
                    !evaluations.some(ev => ev.id === r.category)
                );
                if (hasAttemptToday) {
                    return;
                }
            }
        }
        router.push(`/exam?category=${category}`);
    };

    const formatCOP = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount);
    };

    const [paymentReference, setPaymentReference] = useState('');

    useEffect(() => {
        if (user?.id) {
            setPaymentReference(prev => {
                if (prev.startsWith(`PRO-${user.id}-`)) return prev;
                return `PRO-${user.id}-${Date.now()}`;
            });
        }
    }, [user?.id]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white relative">
            <nav className="bg-white/95 border-b border-gray-100 px-6 py-5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12">
                        <Image src="/logo.png" alt="Logo" fill priority className="object-contain" sizes="48px" />
                    </div>
                    <span className="font-semibold text-gray-900 hidden sm:block">Sin Fronteras</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-gray-900 leading-none mb-1.5">Hola, {user.name}</span>
                        {user.isPro && user.proExpiresAt && (
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                PRO · Vence: {new Date(user.proExpiresAt).toLocaleDateString()}
                            </span>
                        )}
                        {!user.isPro && (
                            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full">
                                Modo Prueba
                            </span>
                        )}
                    </div>
                    <button
                        onClick={openProfile}
                        className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all"
                        title="Configuración"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-6 md:p-10">
                <header className="mb-12">
                    <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">Panel de Control</h1>
                    <p className="text-lg text-gray-600">Selecciona una categoría para iniciar tu evaluación de {user.isPro ? '40' : '15'} preguntas.</p>
                </header>

                {limitMessage && (
                    <div className="mb-10 space-y-5">
                        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium">{limitMessage}</p>
                                {limitCountdown && (
                                    <p className="text-xs text-amber-700 mt-2">Disponible en {limitCountdown}</p>
                                )}
                            </div>
                        </div>
                        {!user.isPro && (
                            <div className="rounded-3xl border border-gray-200 bg-gradient-to-r from-white via-gray-50 to-blue-50 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Acceso ilimitado</p>
                                    <p className="text-xl font-semibold text-gray-900 mb-1">Activa PRO y realiza evaluaciones completas sin límite.</p>
                                    <p className="text-sm text-gray-600">40 preguntas, 50 minutos, intentos ilimitados y reportes detallados.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('pro-offer')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-6 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all hover:scale-105"
                                >
                                    Ver PRO
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {[
                        { id: 'A2', title: 'Moto A2', desc: 'Licencia para motocicletas y mototriciclos.', icon: <BookOpen className="text-blue-600" size={24} /> },
                        { id: 'B1', title: 'Carro B1', desc: 'Automóviles particulares, camionetas y camperos.', icon: <BookOpen className="text-amber-600" size={24} /> },
                        { id: 'C1', title: 'Público C1', desc: 'Vehículos de servicio público y transporte escolar.', icon: <BookOpen className="text-emerald-600" size={24} /> }
                    ].filter(cat => user?.role !== 'supertaxis').map((cat) => (
                        <div
                            key={cat.id}
                            className="bg-white rounded-3xl p-8 border border-gray-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                            onClick={() => startExam(cat.id as Category)}
                        >
                            <div>
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {cat.icon}
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">{cat.title}</h3>
                                <p className="text-gray-600 text-base mb-6 leading-relaxed">{cat.desc}</p>
                            </div>
                            <div className="flex items-center text-blue-600 font-medium text-base group-hover:gap-2 transition-all">
                                Iniciar Evaluación <ChevronRight size={18} />
                            </div>
                        </div>
                    ))}

                    {evaluations.map((ev) => (
                        <div
                            key={ev.id}
                            className="bg-white rounded-3xl p-8 border border-blue-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between shadow-blue-50"
                            onClick={() => startExam(ev.id as Category)}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <BookOpen size={24} />
                                    </div>
                                    <span className="px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full shadow-lg">Esp.</span>
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">{ev.name}</h3>
                                <p className="text-gray-600 text-sm mb-6 leading-relaxed line-clamp-2">{ev.description || 'Evaluación personalizada'}</p>
                                <div className="flex gap-2 mb-6">
                                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 text-xs font-medium rounded-lg">{ev.questionCount} pags</span>
                                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 text-xs font-medium rounded-lg">{ev.durationMinutes} min</span>
                                </div>
                            </div>
                            <div className="flex items-center text-blue-600 font-medium text-base group-hover:gap-2 transition-all">
                                Iniciar Evaluación <ChevronRight size={18} />
                            </div>
                        </div>
                    ))}
                </div>

                {!user.isPro && (
                    <section id="pro-offer" className="mb-16">
                        <div className="bg-gradient-to-r from-white via-blue-50/50 to-white rounded-[2rem] p-10 md:p-14 text-gray-900 shadow-xl relative overflow-hidden border border-gray-200">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100/40 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                <div className="max-w-xl text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-900 text-white text-sm font-medium mb-5">
                                        <Zap size={16} className="fill-current" />
                                        OFERTA ESPECIAL
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-semibold mb-5 tracking-tight">¡Vuélvete PRO y acelera tu aprendizaje!</h2>
                                    <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                        Desbloquea simulacros completos de 40 preguntas con tiempo real de 50 minutos.
                                        Estás en modo prueba con 15 preguntas y 15 minutos. Prepárate como un experto y asegura tu licencia.
                                    </p>
                                    <ul className="grid grid-cols-2 gap-4 mb-8 text-base text-gray-700">
                                        <li className="flex items-center gap-2">✓ Exámenes de 40 preguntas</li>
                                        <li className="flex items-center gap-2">✓ Simulacros de 50 min</li>
                                        <li className="flex items-center gap-2">✓ Historial ilimitado</li>
                                        <li className="flex items-center gap-2">✓ Reportes detallados</li>
                                    </ul>
                                </div>
                                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl w-full max-w-sm flex flex-col items-center">
                                    <div className="w-full flex flex-col items-center">
                                        <p className="text-gray-600 font-medium text-sm tracking-wide mb-2 text-center">Pago Único</p>
                                        <div className="flex items-end justify-center gap-1 mb-4">
                                            <span className="text-5xl md:text-6xl font-semibold tracking-tight text-gray-900">${formatCOP(priceCop)}</span>
                                            <span className="text-gray-400 font-medium mb-2 text-base">COP</span>
                                        </div>
                                        <div className="w-full h-px bg-gray-200 my-5" />
                                        <div className="w-full flex justify-center">
                                            <div className="w-full max-w-[260px]">
                                                <WompiWidget
                                                    amount={priceCop}
                                                    publicKey={wompiPublicKey}
                                                    reference={paymentReference}
                                                    redirectUrl={paymentRedirectUrl}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-5 text-xs text-gray-500 text-center leading-relaxed">
                                        Transacción segura procesada por Wompi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2.5 tracking-tight">
                            <History size={22} className="text-gray-500" />
                            Tus Últimas Evaluaciones
                        </h2>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                        {results.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</th>
                                            <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-wider">Categoría</th>
                                            <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-wider">Puntaje</th>
                                            <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                                            <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-wider"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {results.map((res) => (
                                            <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-700">{new Date(res.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">{res.category}</span></td>
                                                <td className="px-6 py-4 font-semibold text-gray-900">{res.score}/{res.totalQuestions}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${res.score >= Math.ceil(res.totalQuestions * 0.8) ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                        {res.score >= Math.ceil(res.totalQuestions * 0.8) ? 'Aprobado' : 'Reprobado'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => router.push(`/exam/results/${res.id}`)}
                                                        className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                                                    >
                                                        Ver Detalles
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-16 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Award size={32} className="text-gray-300" />
                                </div>
                                <p className="text-gray-600">Aún no has realizado ninguna evaluación.</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-14">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2.5 tracking-tight">
                            <CreditCard size={22} className="text-gray-500" />
                            Historial de Pagos
                        </h2>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                        {payments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</th>
                                            <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-wider">Referencia</th>
                                            <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-wider">Monto</th>
                                            <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-600">{payment.reference}</td>
                                                <td className="px-6 py-4 font-semibold text-gray-900">{formatCOP(payment.amountInCents / 100)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${payment.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                                                        payment.status === 'DECLINED' ? 'bg-red-50 text-red-700' :
                                                            'bg-amber-50 text-amber-700'
                                                        }`}>
                                                        {payment.status === 'APPROVED' ? 'Aprobado' :
                                                            payment.status === 'DECLINED' ? 'Rechazado' : payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-10 text-center">
                                <p className="text-gray-600 text-sm">No tienes pagos registrados.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Modal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                title="Editar Información"
            >
                <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div>
                        <label className="block text-sm font-normal text-gray-900 mb-2">Nombre completo</label>
                        <input
                            required
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                            value={profileDraft?.name || ''}
                            onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-normal text-gray-900 mb-2">Correo</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                            value={profileDraft?.email || ''}
                            onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-normal text-gray-900 mb-2">Celular</label>
                        <input
                            type="tel"
                            required
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                            value={profileDraft?.phone || ''}
                            onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-normal text-gray-900 mb-2">Tipo ID</label>
                            <select
                                required
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base bg-white"
                                value={profileDraft?.idType || 'CC'}
                                onChange={(e) => setProfileDraft({ ...profileDraft, idType: e.target.value })}
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
                                required
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                                value={profileDraft?.idNumber || ''}
                                onChange={(e) => setProfileDraft({ ...profileDraft, idNumber: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-normal text-gray-900 mb-2">Ciudad</label>
                            <input
                                required
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                                value={profileDraft?.city || ''}
                                onChange={(e) => setProfileDraft({ ...profileDraft, city: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-normal text-gray-900 mb-2">Departamento</label>
                            <input
                                required
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                                value={profileDraft?.department || ''}
                                onChange={(e) => setProfileDraft({ ...profileDraft, department: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="pt-4 mt-2 border-t border-gray-100 space-y-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsProfileOpen(false);
                                setIsPasswordModalOpen(true);
                            }}
                            className="w-full py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <Zap size={16} />
                            Cambiar Contraseña
                        </button>
                    </div>

                    <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-normal mt-6 transition-all hover:scale-[1.01]">
                        Guardar cambios
                    </button>
                </form>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title="Cambiar Contraseña"
            >
                <form onSubmit={handleChangePassword} className="space-y-5">
                    {passwordError && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 font-normal">
                            {passwordError}
                        </div>
                    )}
                    {passwordStatus === 'success' && (
                        <div className="p-4 bg-emerald-50 text-emerald-600 text-sm rounded-2xl border border-emerald-100 font-normal">
                            Contraseña actualizada exitosamente
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-normal text-gray-900 mb-2">Contraseña Actual</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                            value={passwordData.current}
                            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                        />
                        <div className="text-right mt-2">
                            <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 transition-colors font-normal">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-normal text-gray-900 mb-2">Nueva Contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                            value={passwordData.new}
                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-normal text-gray-900 mb-2">Confirmar Nueva Contraseña</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                            value={passwordData.confirm}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={passwordStatus === 'loading' || passwordStatus === 'success'}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-normal mt-6 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {passwordStatus === 'loading' ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                </form>
            </Modal>

            {/* Payments History Modal */}
            <Modal
                isOpen={isPaymentsModalOpen}
                onClose={() => setIsPaymentsModalOpen(false)}
                title="Historial de Pagos"
            >
                <div className="space-y-4">
                    {payments.length === 0 ? (
                        <p className="text-center text-gray-600 py-8">No hay pagos registrados.</p>
                    ) : (
                        <div className="space-y-3">
                            {payments.map((payment) => (
                                <div key={payment.id} className="p-4 border border-gray-200 rounded-2xl bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-900">Ref: {payment.reference}</p>
                                        <p className="text-sm text-gray-600 mt-1">{new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatCOP(payment.amountInCents / 100)}</p>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-block mt-1 ${payment.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                            payment.status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {payment.status === 'APPROVED' ? 'Aprobado' :
                                                payment.status === 'DECLINED' ? 'Rechazado' : payment.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
            <DashboardContent />
        </Suspense>
    );
}
