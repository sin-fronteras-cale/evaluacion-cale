
'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { User, ExamResult, Category } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { LogOut, BookOpen, Clock, Award, History, ChevronRight, Zap } from 'lucide-react';
import Image from 'next/image';
import { WompiWidget } from '@/components/WompiWidget';

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [results, setResults] = useState<ExamResult[]>([]);
    const router = useRouter();

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

    const handleLogout = () => {
        storage.setCurrentUser(null);
        router.push('/');
    };

    const startExam = (category: Category) => {
        router.push(`/exam?category=${category}`);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
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

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {[
                        { id: 'A2', title: 'Moto A2', desc: 'Licencia para motocicletas y mototriciclos.', icon: <BookOpen className="text-blue-600" /> },
                        { id: 'B1', title: 'Carro B1', desc: 'Automóviles particulares, camionetas y camperos.', icon: <BookOpen className="text-amber-600" /> },
                        { id: 'C1', title: 'Público C1', desc: 'Vehículos de servicio público y transporte escolar.', icon: <BookOpen className="text-emerald-600" /> }
                    ].map((cat) => (
                        <div
                            key={cat.id}
                            className="glass p-8 rounded-[2rem] border border-blue-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
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
                    <section className="mb-12">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="max-w-xl text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-bold mb-4">
                                        <Zap size={14} className="fill-current" />
                                        OFERTA ESPECIAL
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-4">¡Vuélvete PRO y acelera tu aprendizaje!</h2>
                                    <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                                        Desbloquea simulacros completos de 40 preguntas con tiempo real de 50 minutos.
                                        Estás en modo prueba con 15 preguntas y 15 minutos. Prepárate como un experto y asegura tu licencia.
                                    </p>
                                    <ul className="grid grid-cols-2 gap-3 mb-8 text-sm font-medium text-left">
                                        <li className="flex items-center gap-2">✓ Exámenes de 40 preguntas</li>
                                        <li className="flex items-center gap-2">✓ Simulacros de 50 min</li>
                                        <li className="flex items-center gap-2">✓ Historial ilimitado</li>
                                        <li className="flex items-center gap-2">✓ Reportes detallados</li>
                                    </ul>
                                </div>
                                <div className="bg-white p-8 rounded-3xl text-slate-900 shadow-xl w-full max-w-sm flex flex-col items-center border border-slate-100">
                                    <div
                                        onClick={() => window.dispatchEvent(new CustomEvent('trigger-wompi-payment'))}
                                        className="w-full cursor-pointer group/price flex flex-col items-center mb-6 transition-all hover:scale-105"
                                    >
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2 text-center group-hover/price:text-blue-600 transition-colors">Pago Único</p>
                                        <div className="flex items-end gap-1 mb-2">
                                            <span className="text-5xl font-black text-slate-900 group-hover/price:text-blue-700 transition-colors">$20.000</span>
                                            <span className="text-slate-400 font-bold mb-1">COP</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-blue-500 opacity-0 group-hover/price:opacity-100 transition-opacity">
                                            HACER CLIC PARA PAGAR
                                        </div>
                                    </div>
                                    <WompiWidget
                                        amount={20000}
                                        publicKey="pub_test_bHNa3A6RLYk7fSGgvxFYkDDe05OzwBPP"
                                        reference={`PRO-${user.id}-${Date.now()}`}
                                        redirectUrl="https://cale-app.vercel.app/dashboard/payment-confirm"
                                    />
                                    <p className="mt-4 text-[10px] text-slate-400 text-center">
                                        Transacción segura procesada por Wompi.<br />
                                        Actualmente en modo PRUEBA.
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
        </div>
    );
}
