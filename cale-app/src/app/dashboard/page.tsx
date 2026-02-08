
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { storage } from '@/lib/storage';
import { User, ExamResult, Category } from '@/lib/data';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogOut, BookOpen, Clock, Award, History, ChevronRight, Zap, Pencil } from 'lucide-react';
import Image from 'next/image';
import { WompiWidget } from '@/components/WompiWidget';
import { Modal } from '@/components/Modal';

function DashboardContent() {
    const [user, setUser] = useState<User | null>(null);
    const [results, setResults] = useState<ExamResult[]>([]);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileDraft, setProfileDraft] = useState<Partial<User> | null>(null);
    const [priceCop, setPriceCop] = useState(20000);
    const [limitMessage, setLimitMessage] = useState('');
    const [limitNextReset, setLimitNextReset] = useState<Date | null>(null);
    const [limitCountdown, setLimitCountdown] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const wompiPublicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';
    const paymentRedirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/dashboard/payment-confirm`
        : '';

    useEffect(() => {
        const loadData = async () => {
            const current = storage.getCurrentUser();
            if (!current) {
                router.push('/');
                return;
            }

            // Client side expiration check
            if (current.isPro && current.proExpiresAt && new Date(current.proExpiresAt) < new Date()) {
                current.isPro = false;
                storage.setCurrentUser(current);
            }

            setUser(current);
            const allResults = await storage.getResults();
            setResults(allResults.filter(r => r.userId === current.id).reverse());
        };
        loadData();
    }, [router]);

    useEffect(() => {
        if (searchParams.get('limit') === '1') {
            setLimitMessage('En modo prueba solo puedes realizar 1 evaluacion al dia.');
        }
    }, [searchParams]);

    useEffect(() => {
        const loadPrice = async () => {
            try {
                const res = await fetch('/api/settings?key=pro_price_cop');
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

    const handleLogout = () => {
        storage.setCurrentUser(null);
        router.push('/');
    };

    const openProfile = () => {
        if (!user) return;
        setProfileDraft({ ...user });
        setIsProfileOpen(true);
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

        await storage.saveUser(updated);
        storage.setCurrentUser(updated);
        setUser(updated);
        setIsProfileOpen(false);
    };

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

    useEffect(() => {
        if (!user || user.isPro) {
            setLimitNextReset(null);
            return;
        }

        const latestAttempt = results
            .filter(r => r.userId === user.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (latestAttempt) {
            const attemptDate = new Date(latestAttempt.date);
            if (isSameLocalDay(attemptDate, new Date())) {
                setLimitNextReset(getNextResetTime(attemptDate));
                setLimitMessage('En modo prueba solo puedes realizar 1 evaluacion al dia.');
                return;
            }
        }

        setLimitNextReset(null);
    }, [user, results]);

    useEffect(() => {
        if (!limitNextReset) {
            setLimitCountdown('');
            return;
        }

        const updateCountdown = () => {
            const remaining = limitNextReset.getTime() - Date.now();
            if (remaining <= 0) {
                setLimitCountdown('');
                setLimitNextReset(null);
                setLimitMessage('');
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
        if (!user.isPro) {
            const allResults = await storage.getResults();
            const today = new Date();
            const hasAttemptToday = allResults.some(r =>
                r.userId === user.id && isSameLocalDay(new Date(r.date), today)
            );
            if (hasAttemptToday) {
                const latestAttempt = allResults
                    .filter(r => r.userId === user.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                if (latestAttempt) {
                    setLimitNextReset(getNextResetTime(new Date(latestAttempt.date)));
                }
                setLimitMessage('En modo prueba solo puedes realizar 1 evaluacion al dia.');
                return;
            }
        }
        router.push(`/exam?category=${category}`);
    };

    const formatCOP = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount);
    };

    const paymentReference = useMemo(() => {
        if (!user) return '';
        return `PRO-${user.id}-${Date.now()}`;
    }, [user?.id]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <nav className="bg-white/70 border-b border-white/40 px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl shadow-[0_8px_30px_-20px_rgba(15,23,42,0.35)]">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                        <Image src="/logo.jpg" alt="Logo" fill className="object-contain" />
                    </div>
                    <span className="font-bold text-slate-900 hidden sm:block">Sin Fronteras</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-900 leading-none mb-1">Hola, {user.name}</span>
                        {user.isPro && user.proExpiresAt && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                PRO · Vence: {new Date(user.proExpiresAt).toLocaleDateString()}
                            </span>
                        )}
                        {!user.isPro && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Modo Prueba
                            </span>
                        )}
                    </div>
                    <button
                        onClick={openProfile}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        title="Editar perfil"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-6 md:p-10">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Panel de Control</h1>
                    <p className="text-slate-500">Selecciona una categoría para iniciar tu evaluación de {user.isPro ? '40' : '15'} preguntas.</p>
                </header>

                {limitMessage && (
                    <div className="mb-8 space-y-4">
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-amber-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold">{limitMessage}</p>
                                {limitCountdown && (
                                    <p className="text-xs text-amber-700 mt-1">Disponible en {limitCountdown}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setLimitMessage('')}
                                className="text-xs font-bold uppercase tracking-wide text-amber-700 hover:text-amber-900"
                            >
                                Cerrar
                            </button>
                        </div>
                        {!user.isPro && (
                            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-blue-50 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Acceso ilimitado</p>
                                    <p className="text-lg font-bold text-slate-900">Activa PRO y realiza evaluaciones completas sin limite.</p>
                                    <p className="text-sm text-slate-500">40 preguntas, 50 minutos, intentos ilimitados y reportes detallados.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('pro-offer')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-black transition-colors"
                                >
                                    Ver PRO
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {[
                        { id: 'A2', title: 'Moto A2', desc: 'Licencia para motocicletas y mototriciclos.', icon: <BookOpen className="text-blue-600" /> },
                        { id: 'B1', title: 'Carro B1', desc: 'Automóviles particulares, camionetas y camperos.', icon: <BookOpen className="text-amber-600" /> },
                        { id: 'C1', title: 'Público C1', desc: 'Vehículos de servicio público y transporte escolar.', icon: <BookOpen className="text-emerald-600" /> }
                    ].map((cat) => (
                        <div
                            key={cat.id}
                            className="apple-card p-8 hover:shadow-[0_30px_70px_-50px_rgba(15,23,42,0.45)] hover:-translate-y-1 transition-all cursor-pointer group"
                            onClick={() => startExam(cat.id as Category)}
                        >
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                                {cat.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{cat.title}</h3>
                            <p className="text-slate-500 text-sm mb-6">{cat.desc}</p>
                            <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                                Iniciar Evaluación <ChevronRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>

                {!user.isPro && (
                    <section id="pro-offer" className="mb-12">
                        <div className="bg-gradient-to-r from-white/90 via-[#eef4ff] to-white/90 rounded-[2rem] p-8 md:p-12 text-slate-900 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.4)] relative overflow-hidden border border-white/60">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/60 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="max-w-xl text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-sm font-bold mb-4">
                                        <Zap size={14} className="fill-current" />
                                        OFERTA ESPECIAL
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-4">¡Vuélvete PRO y acelera tu aprendizaje!</h2>
                                    <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                                        Desbloquea simulacros completos de 40 preguntas con tiempo real de 50 minutos.
                                        Estás en modo prueba con 15 preguntas y 15 minutos. Prepárate como un experto y asegura tu licencia.
                                    </p>
                                    <ul className="grid grid-cols-2 gap-3 mb-8 text-sm font-medium text-left text-slate-700">
                                        <li className="flex items-center gap-2">✓ Exámenes de 40 preguntas</li>
                                        <li className="flex items-center gap-2">✓ Simulacros de 50 min</li>
                                        <li className="flex items-center gap-2">✓ Historial ilimitado</li>
                                        <li className="flex items-center gap-2">✓ Reportes detallados</li>
                                    </ul>
                                </div>
                                <div className="apple-card p-8 text-slate-900 w-full max-w-sm flex flex-col items-center">
                                    <div className="w-full flex flex-col items-center">
                                        <p className="text-slate-500 font-semibold text-xs tracking-wide mb-2 text-center">Pago Unico</p>
                                        <div className="flex items-end justify-center gap-1 mb-3">
                                            <span className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">${formatCOP(priceCop)}</span>
                                            <span className="text-slate-400 font-semibold mb-1 text-sm">COP</span>
                                        </div>
                                        <div className="w-full h-px bg-slate-200/70 my-4" />
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
                                    <p className="mt-4 text-[11px] text-slate-400 text-center">
                                        Transaccion segura procesada por Wompi.<br />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen size={20} className="text-slate-400" />
                            Categorías de Evaluación
                        </h2>
                    </div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <History size={20} className="text-slate-400" />
                            Tus Últimas Evaluaciones
                        </h2>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        {results.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Puntaje</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {results.map((res) => (
                                            <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-slate-600">{new Date(res.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">{res.category}</span></td>
                                                <td className="px-6 py-4 font-bold text-slate-900">{res.score}/{res.totalQuestions}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${res.score >= Math.ceil(res.totalQuestions * 0.8) ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                        {res.score >= Math.ceil(res.totalQuestions * 0.8) ? 'Aprobado' : 'Reprobado'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => router.push(`/exam/results/${res.id}`)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
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
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Award size={32} className="text-slate-300" />
                                </div>
                                <p className="text-slate-500">Aún no has realizado ninguna evaluación.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Modal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                title="Editar mi informacion"
            >
                <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                        <input
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={profileDraft?.name || ''}
                            onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={profileDraft?.email || ''}
                            onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Celular</label>
                        <input
                            type="tel"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={profileDraft?.phone || ''}
                            onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de identificacion</label>
                            <select
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={profileDraft?.idType || 'CC'}
                                onChange={(e) => setProfileDraft({ ...profileDraft, idType: e.target.value })}
                            >
                                <option value="CC">Cedula</option>
                                <option value="CE">Cedula de Extranjeria</option>
                                <option value="TI">Tarjeta de Identidad</option>
                                <option value="PAS">Pasaporte</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Numero de identificacion</label>
                            <input
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={profileDraft?.idNumber || ''}
                                onChange={(e) => setProfileDraft({ ...profileDraft, idNumber: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
                            <input
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={profileDraft?.city || ''}
                                onChange={(e) => setProfileDraft({ ...profileDraft, city: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                            <input
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={profileDraft?.department || ''}
                                onChange={(e) => setProfileDraft({ ...profileDraft, department: e.target.value })}
                            />
                        </div>
                    </div>
                    <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold mt-4">
                        Guardar cambios
                    </button>
                </form>
            </Modal>
        </div>
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50" /> }>
            <DashboardContent />
        </Suspense>
    );
}
