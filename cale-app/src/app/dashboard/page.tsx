
'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { User, ExamResult, Category } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { LogOut, BookOpen, Clock, Award, History, ChevronRight } from 'lucide-react';

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
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">SF</div>
                    <span className="font-bold text-slate-900 hidden sm:block">Sin Fronteras</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600">Hola, {user.name}</span>
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
                    <p className="text-slate-500">Selecciona una categoría para iniciar tu evaluación de 40 preguntas.</p>
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

                <section>
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
                                                <td className="px-6 py-4 font-bold text-slate-900">{res.score}/40</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${res.score >= 32 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                        {res.score >= 32 ? 'Aprobado' : 'Reprobado'}
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
