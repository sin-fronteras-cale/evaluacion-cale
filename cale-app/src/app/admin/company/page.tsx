'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AdminSidebar } from '@/components/AdminSidebar';
import {
    Users as UsersIcon,
    FileText,
    CheckCircle,
    TrendingDown,
    BarChart3,
    Building2,
    Target,
    Award
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function CompanyAnalytics() {
    const router = useRouter();
    const [stats, setStats] = useState({
        usersCount: 0,
        examCount: 0,
        passRate: 0,
        avgScore: 0,
        topFailed: [] as { id: string; text: string; count: number }[]
    });
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [allResults, setAllResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [companyTag, setCompanyTag] = useState<string>('');

    useEffect(() => {
        const loadCompanyStats = async () => {
            const user = await authClient.getCurrentUser();
            if (!user || user.role !== 'admin_supertaxis') {
                router.push('/admin');
                return;
            }
            setCompanyTag(user.companyTag || 'Empresa');

            try {
                // We fetch all data and filter in client to avoid making too many specialized endpoints
                const [usersRes, resultsRes, questionsRes, evalsRes] = await Promise.all([
                    fetch('/api/users?limit=1000', { credentials: 'include' }),
                    fetch('/api/results?limit=1000', { credentials: 'include' }),
                    fetch('/api/questions', { credentials: 'include' }),
                    fetch('/api/evaluations', { credentials: 'include' })
                ]);

                const usersData = await usersRes.json();
                const resultsData = await resultsRes.json();
                const questionsData = await questionsRes.json();
                const evalsData = await evalsRes.json();

                const companyUsers = usersData.users || [];
                const companyResults = resultsData.results || [];
                const companyEvals = evalsData.evaluations || [];
                const allQs = questionsData.questions || [];

                setEvaluations(companyEvals);
                setAllResults(companyResults);

                // Process Stats
                const passCount = companyResults.filter((r: any) => r.score >= Math.ceil(r.totalQuestions * 0.8)).length;
                const totalScorePct = companyResults.reduce((acc: number, r: any) => acc + (r.score / r.totalQuestions), 0);

                const failedCounts: Record<string, { id: string, text: string, count: number }> = {};
                companyResults.forEach((res: any) => {
                    res.failedQuestions?.forEach((f: any) => {
                        if (!failedCounts[f.questionId]) {
                            const q = allQs.find((q: any) => q.id === f.questionId);
                            failedCounts[f.questionId] = { id: f.questionId, text: q?.text || 'Privada', count: 0 };
                        }
                        failedCounts[f.questionId].count++;
                    });
                });

                const topFailed = Object.values(failedCounts)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                setStats({
                    usersCount: companyUsers.length,
                    examCount: companyResults.length,
                    passRate: companyResults.length > 0 ? Math.round((passCount / companyResults.length) * 100) : 0,
                    avgScore: companyResults.length > 0 ? Math.round((totalScorePct / companyResults.length) * 100) : 0,
                    topFailed
                });

            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadCompanyStats();
    }, [router]);

    const chartData = {
        labels: stats.topFailed.map(q => q.text.substring(0, 30) + '...'),
        datasets: [
            {
                label: 'Errores por conductores',
                data: stats.topFailed.map(q => q.count),
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderRadius: 8,
            },
        ],
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-slate-50 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-blue-600 font-semibold uppercase tracking-wider text-sm mb-2">
                            <Building2 size={16} />
                            Portal de Empresa
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Dashboard {companyTag.toUpperCase()}</h1>
                        <p className="text-gray-600 mt-2 text-lg">Métricas exclusivas para tu organización.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Conductores', value: stats.usersCount, icon: <UsersIcon className="text-blue-600" size={24} />, bg: 'bg-blue-50' },
                        { label: 'Exámenes Tomados', value: stats.examCount, icon: <FileText className="text-amber-600" size={24} />, bg: 'bg-amber-50' },
                        { label: 'Tasa Aprobación', value: `${stats.passRate}%`, icon: <CheckCircle className="text-emerald-600" size={24} />, bg: 'bg-emerald-50' },
                        { label: 'Promedio Puntaje', value: `${stats.avgScore}%`, icon: <Award className="text-purple-600" size={24} />, bg: 'bg-purple-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <section className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                            <Target size={20} className="text-red-500" />
                            Puntos Críticos (Preguntas más falladas por tu equipo)
                        </h2>
                        <div className="h-[400px]">
                            {stats.topFailed.length > 0 ? (
                                <Bar
                                    data={chartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                        },
                                        scales: {
                                            y: { beginAtZero: true, grid: { display: false } },
                                            x: { grid: { display: false } }
                                        }
                                    }}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <p>Sin datos de errores registrados aún.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-8">
                            Tus Evaluaciones
                        </h2>
                        <div className="space-y-4">
                            {evaluations.length > 0 ? evaluations.map(ev => {
                                const evResults = allResults.filter(r => r.category === ev.id);
                                const passRate = evResults.length > 0
                                    ? Math.round((evResults.filter(r => r.score >= Math.ceil(r.totalQuestions * 0.8)).length / evResults.length) * 100)
                                    : 0;

                                return (
                                    <div key={ev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="font-bold text-gray-900 mb-1">{ev.name}</p>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">{evResults.length} intentos</span>
                                            <span className={`font-bold ${passRate > 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{passRate}% éxito</span>
                                        </div>
                                        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${passRate > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                style={{ width: `${passRate}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-gray-400 text-center py-10">No has creado evaluaciones personalizadas aún.</p>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
