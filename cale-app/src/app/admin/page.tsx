
'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
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
    const [stats, setStats] = useState({
        usersCount: 0,
        examCount: 0,
        passRate: 0,
        topFailed: [] as any[]
    });

    useEffect(() => {
        const loadStats = async () => {
            const users = await storage.getUsers();
            const results = await storage.getResults();
            const topFailed = await storage.getTopFailedQuestions(20);

            const passCount = results.filter(r => r.score >= 32).length;

            setStats({
                usersCount: users.length,
                examCount: results.length,
                passRate: results.length > 0 ? Math.round((passCount / results.length) * 100) : 0,
                topFailed
            });
        };
        loadStats();
    }, []);

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
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard de Análisis</h1>
                    <p className="text-slate-500">Métricas globales de la Escuela de Conducción Sin Fronteras.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Total Usuarios', value: stats.usersCount, icon: <UsersIcon className="text-blue-600" />, bg: 'bg-blue-50' },
                        { label: 'Exámenes Realizados', value: stats.examCount, icon: <FileText className="text-amber-600" />, bg: 'bg-amber-50' },
                        { label: 'Tasa de Aprobación', value: `${stats.passRate}%`, icon: <CheckCircle className="text-emerald-600" />, bg: 'bg-emerald-50' },
                        { label: 'Preguntas con Error', value: stats.topFailed.length, icon: <TrendingDown className="text-red-600" />, bg: 'bg-red-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <section className="bg-white p-8 rounded-[2rem] border border-slate-200">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <TrendingDown size={20} className="text-red-500" />
                            Top 20 Preguntas más Falladas
                        </h2>
                    </div>

                    <div className="h-[600px]">
                        {stats.topFailed.length > 0 ? (
                            <Bar data={chartData} options={chartOptions} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
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
