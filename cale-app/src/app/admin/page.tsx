
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

    useEffect(() => {
        const checkAuthAndLoadStats = async () => {
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

            // Cargar estadísticas
            loadStats();
        };

        const loadStats = async () => {
            try {
                // Cargar usuarios desde API
                const usersRes = await fetch('/api/users', { credentials: 'include' });
                const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
                const users = usersData.users || [];

                // Cargar resultados desde API
                const resultsRes = await fetch('/api/results', { credentials: 'include' });
                const resultsData = resultsRes.ok ? await resultsRes.json() : { results: [] };
                const results = resultsData.results || [];

                // Cargar preguntas desde API
                const questionsRes = await fetch('/api/questions', { credentials: 'include' });
                const questionsData = questionsRes.ok ? await questionsRes.json() : { questions: [] };
                const questions = questionsData.questions || [];

                // Calcular estadísticas
                const passCount = results.filter((r: any) => r.score >= Math.ceil(r.totalQuestions * 0.8)).length;

                // Procesar preguntas más falladas
                const failedCounts: Record<string, { id: string, text: string, count: number }> = {};
                results.forEach((res: any) => {
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

                setStats({
                    usersCount: users.length,
                    examCount: results.length,
                    passRate: results.length > 0 ? Math.round((passCount / results.length) * 100) : 0,
                    topFailed
                });
            } catch (error) {
                console.error('Error cargando estadísticas:', error);
            }
        };
        
        checkAuthAndLoadStats();
    }, [router]);

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
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3 tracking-tight">
                            <TrendingDown size={24} className="text-red-500" />
                            Top 20 Preguntas más Falladas
                        </h2>
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
            </main>
        </div>
    );
}
