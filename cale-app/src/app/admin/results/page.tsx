'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { FileText, Search, Download, Calendar } from 'lucide-react';

export default function ResultsManagement() {
    const router = useRouter();
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const checkAuthAndLoad = async () => {
            const user = await authClient.getCurrentUser();
            if (!user || (user.role !== 'admin' && user.role !== 'admin_supertaxis')) {
                router.push('/');
                return;
            }
            loadResults();
        };
        checkAuthAndLoad();
    }, [router]);

    const loadResults = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/results?limit=100', {
                credentials: 'include',
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredResults = results.filter(r =>
        r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.evaluation?.name || r.category).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 p-10">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Historial de Resultados</h1>
                        <p className="text-gray-600 mt-2">Seguimiento detallado de todas las evaluaciones realizadas.</p>
                    </div>
                </header>

                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por usuario o evaluación..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Evaluación</th>
                                    <th className="px-6 py-4 text-center">Puntaje</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-right">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">Cargando resultados...</td>
                                    </tr>
                                ) : filteredResults.length > 0 ? (
                                    filteredResults.map((r) => {
                                        const isPass = r.score >= Math.ceil(r.totalQuestions * 0.8);
                                        const percentage = Math.round((r.score / r.totalQuestions) * 100);

                                        return (
                                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">{r.user?.name || 'Usuario desconocido'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium uppercase">
                                                        {r.evaluation?.name || r.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className="font-medium text-gray-700">{r.score} / {r.totalQuestions}</p>
                                                    <p className="text-xs text-gray-400">{percentage}%</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {isPass ? 'APROBADO' : 'REPROBADO'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-500">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Calendar size={14} />
                                                        {new Date(r.date).toLocaleDateString('es-CO')}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No se encontraron resultados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
