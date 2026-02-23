
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { TrendingDown, Users as UsersIcon, FileText, CheckCircle, BarChart3 } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        usersCount: 0,
        examCount: 0,
        passRate: 0,
        topFailed: [] as { id: string; text: string; count: number }[]
    });
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [allResults, setAllResults] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        const checkAuthAndLoadStats = async () => {
            // Verificar autenticación primero
            const user = await authClient.getCurrentUser();
            if (!user) {
                console.error('No authenticated user, redirecting to login');
                router.push('/');
                return;
            }

            if (user.role !== 'admin' && user.role !== 'admin_supertaxis') {
                console.error('User is not authorized, redirecting to dashboard');
                router.push('/dashboard');
                return;
            }

            setUserRole(user.role);

            // Cargar estadísticas
            loadStats();
        };

        const loadStats = async () => {
            try {
                setIsLoading(true);
                // Cargar todo en paralelo
                const [usersRes, resultsRes, questionsRes, evalsRes] = await Promise.all([
                    fetch('/api/users', { credentials: 'include' }),
                    fetch('/api/results', { credentials: 'include' }),
                    fetch('/api/questions', { credentials: 'include' }),
                    fetch('/api/evaluations', { credentials: 'include' })
                ]);

                const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
                const resultsData = resultsRes.ok ? await resultsRes.json() : { results: [] };
                const questionsData = questionsRes.ok ? await questionsRes.json() : { questions: [] };
                const evalsData = evalsRes.ok ? await evalsRes.json() : { evaluations: [] };

                const users = usersData.users || [];
                const results = resultsData.results || [];
                const allQs = questionsData.questions || [];
                const evals = evalsData.evaluations || [];

                setQuestions(allQs);
                setAllResults(results);
                setEvaluations(evals);

                processStats(results, allQs, users.length, 'ALL');
            } catch (error) {
                console.error('Error cargando estadísticas:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const processStats = (results: any[], allQs: any[], usersCount: number, category: string) => {
            const filteredResults = category === 'ALL'
                ? results
                : results.filter(r => r.category === category);

            const passCount = filteredResults.filter((r: any) => r.score >= Math.ceil(r.totalQuestions * 0.8)).length;

            const failedCounts: Record<string, { id: string, text: string, count: number }> = {};
            filteredResults.forEach((res: any) => {
                res.failedQuestions?.forEach((f: any) => {
                    if (!failedCounts[f.questionId]) {
                        const q = allQs.find((q: any) => q.id === f.questionId);
                        failedCounts[f.questionId] = { id: f.questionId, text: q?.text || 'Privado', count: 0 };
                    }
                    failedCounts[f.questionId].count++;
                });
            });

            const topFailed = Object.values(failedCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 20);

            setStats({
                usersCount: usersCount,
                examCount: filteredResults.length,
                passRate: filteredResults.length > 0 ? Math.round((passCount / filteredResults.length) * 100) : 0,
                topFailed
            });
        };

        checkAuthAndLoadStats();
    }, [router]);

    useEffect(() => {
        if (allResults.length > 0) {
            // Re-procesar cuando cambie la categoría
            const passCount = (allResults || []).filter((r: any) => (selectedCategory === 'ALL' || r.category === selectedCategory)).filter((r: any) => r.score >= Math.ceil(r.totalQuestions * 0.8)).length;
            const filteredResults = selectedCategory === 'ALL' ? allResults : allResults.filter(r => r.category === selectedCategory);

            const failedCounts: Record<string, { id: string, text: string, count: number }> = {};
            filteredResults.forEach((res: any) => {
                res.failedQuestions?.forEach((f: any) => {
                    if (!failedCounts[f.questionId]) {
                        const q = questions.find((q: any) => q.id === f.questionId);
                        failedCounts[f.questionId] = { id: f.questionId, text: q?.text || 'Privado', count: 0 };
                    }
                    failedCounts[f.questionId].count++;
                });
            });

            const topFailed = Object.values(failedCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 20);

            setStats(prev => ({
                ...prev,
                examCount: filteredResults.length,
                passRate: filteredResults.length > 0 ? Math.round((passCount / filteredResults.length) * 100) : 0,
                topFailed
            }));
        }
    }, [selectedCategory, allResults, questions]);

    const chartData = {
        labels: stats.topFailed.map(q => q.text.substring(0, 30) + (q.text.length > 30 ? '...' : '')),
        datasets: [
            {
                label: 'Veces Fallada',
                data: stats.topFailed.map(q => q.count),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
                borderRadius: 8,
            },
        ],
    };

    const chartOptions = {
        indexAxis: 'y' as const,
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' as any },
                bodyFont: { size: 13 },
                cornerRadius: 8,
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { stepSize: 1 } },
            y: { grid: { display: false } }
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            <AdminSidebar />
            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Dashboard de Análisis</h1>
                    <p className="text-gray-600 mt-2 text-lg">Métricas globales de la Escuela de Conducción Sin Fronteras.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Usuarios', value: stats.usersCount, icon: <UsersIcon className="text-blue-600" size={24} />, bg: 'bg-blue-50' },
                        { label: 'Exámenes Realizados', value: stats.examCount, icon: <FileText className="text-amber-600" size={24} />, bg: 'bg-amber-50' },
                        { label: 'Tasa de Aprobación', value: `${stats.passRate}%`, icon: <CheckCircle className="text-emerald-600" size={24} />, bg: 'bg-emerald-50' },
                        { label: 'Preguntas con Error', value: stats.topFailed.length, icon: <TrendingDown className="text-red-600" size={24} />, bg: 'bg-red-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-7 rounded-3xl border border-gray-200 flex items-center gap-4 shadow-sm">
                            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">{stat.label}</p>
                                <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <section className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3 tracking-tight">
                            <TrendingDown size={24} className="text-red-500" />
                            Top 20 Preguntas más Falladas
                        </h2>

                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-500">Evaluación:</label>
                            <select
                                className="px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="ALL">Todas las Categorías</option>
                                {(userRole === 'admin' || userRole === 'admin_supertaxis') && (
                                    <>
                                        <option value="A2">MOTO A2</option>
                                        <option value="B1">CARRO B1</option>
                                        <option value="C1">PÚBLICO C1</option>
                                    </>
                                )}
                                {evaluations.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="h-[600px]">
                        {stats.topFailed.length > 0 ? (
                            <Bar data={chartData} options={chartOptions} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <BarChart3 size={48} className="mb-4 opacity-20" />
                                <p>No hay suficientes datos para generar gráficas.</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-12 bg-white p-10 rounded-3xl border border-gray-200 shadow-sm">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-8 tracking-tight">
                        Resumen de Evaluaciones Personalizadas
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 text-sm font-medium">
                                    <th className="pb-4 font-semibold uppercase tracking-wider">Evaluación</th>
                                    <th className="pb-4 font-semibold uppercase tracking-wider text-center">Intentos</th>
                                    <th className="pb-4 font-semibold uppercase tracking-wider text-center">Aprobación</th>
                                    <th className="pb-4 font-semibold uppercase tracking-wider text-right">Promedio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {evaluations.map(ev => {
                                    const evResults = allResults.filter(r => r.category === ev.id);
                                    const attempts = evResults.length;
                                    const passes = evResults.filter(r => r.score >= Math.ceil(r.totalQuestions * 0.8)).length;
                                    const avgScore = attempts > 0
                                        ? Math.round((evResults.reduce((acc, r) => acc + r.score, 0) / evResults.reduce((acc, r) => acc + r.totalQuestions, 0)) * 100)
                                        : 0;
                                    const passRate = attempts > 0 ? Math.round((passes / attempts) * 100) : 0;

                                    return (
                                        <tr key={ev.id} className="text-gray-700">
                                            <td className="py-5 font-medium text-gray-900">{ev.name}</td>
                                            <td className="py-5 text-center">{attempts}</td>
                                            <td className="py-5 text-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${passRate >= 70 ? 'bg-emerald-50 text-emerald-700' :
                                                        passRate >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {passRate}%
                                                </span>
                                            </td>
                                            <td className="py-5 text-right font-mono text-gray-500">{avgScore}%</td>
                                        </tr>
                                    );
                                })}
                                {evaluations.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-gray-400">No hay evaluaciones personalizadas registradas.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}
