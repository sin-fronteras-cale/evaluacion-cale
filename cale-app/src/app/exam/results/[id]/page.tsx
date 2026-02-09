
'use client';

import { useState, useEffect, use } from 'react';
import { ExamResult, Question } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowLeft, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResultDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [result, setResult] = useState<ExamResult | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const router = useRouter();

    useEffect(() => {
        const loadResultData = async () => {
            // Cargar resultados desde API
            const resultsRes = await fetch('/api/results', { credentials: 'include' });
            if (resultsRes.ok) {
                const resultsData = await resultsRes.json();
                const allResults = resultsData.results || [];
                const found = allResults.find((r: ExamResult) => r.id === id);
                if (found) {
                    setResult(found);
                    // Cargar preguntas desde API
                    const questionsRes = await fetch('/api/questions', { credentials: 'include' });
                    if (questionsRes.ok) {
                        const questionsData = await questionsRes.json();
                        setQuestions(questionsData.questions || []);
                    }
                }
            }
        };
        loadResultData();
    }, [id]);

    if (!result) return null;

    const passingScore = Math.ceil(result.totalQuestions * 0.8);
    const passed = result.score >= passingScore;

    return (
        <div className="min-h-screen bg-white p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-10 transition-colors"
                >
                    <ArrowLeft size={20} /> Volver al Inicio
                </button>

                <header className={`p-12 rounded-3xl text-white shadow-2xl mb-12 relative overflow-hidden ${passed ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <span className="inline-block px-3.5 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-5 uppercase tracking-wide">
                                Resultado de Evaluación {result.category}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-semibold mb-3 tracking-tight">
                                {passed ? '¡Felicitaciones!' : 'Sigue Practicando'}
                            </h1>
                            <p className="text-white/90 text-lg leading-relaxed">
                                Has obtenido un puntaje de {result.score} sobre {result.totalQuestions}
                                <span className="block text-base opacity-80 mt-2">Se requiere {passingScore} para aprobar (80%)</span>
                            </p>
                        </div>

                        <div className="w-40 h-40 bg-white/20 rounded-full flex flex-col items-center justify-center border-4 border-white/30 backdrop-blur-md">
                            <span className="text-5xl font-semibold">{Math.round((result.score / result.totalQuestions) * 100)}%</span>
                            <span className="text-xs font-medium uppercase mt-2 text-white/80">{passed ? 'Aprobado' : 'Reprobado'}</span>
                        </div>
                    </div>

                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[100%] bg-white/10 rounded-full blur-[80px]" />
                </header>

                <section className="space-y-6">
                    <h2 className="text-3xl font-semibold text-gray-900 flex items-center gap-3 tracking-tight">
                        <AlertTriangle size={26} className="text-amber-500" />
                        Revisión de Errores ({result.failedQuestions.length})
                    </h2>

                    {result.failedQuestions.length > 0 ? (
                        <div className="space-y-4">
                            {result.failedQuestions.map((failed, idx) => {
                                const q = questions.find(q => q.id === failed.questionId);
                                if (!q) return null;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        className="bg-white p-7 rounded-3xl border border-gray-200 shadow-sm"
                                    >
                                        <p className="font-semibold text-gray-900 mb-5 text-lg">{q.text}</p>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="p-5 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                                                <XCircle size={20} className="text-red-600 mt-1 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Tu Respuesta</p>
                                                    <p className="text-sm text-gray-900 font-normal">{failed.userAnswer === -1 ? 'Sin responder' : q.options[failed.userAnswer]}</p>
                                                </div>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                                                <CheckCircle2 size={20} className="text-emerald-600 mt-1 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Respuesta Correcta</p>
                                                    <p className="text-sm text-gray-900 font-normal">{q.options[q.correctAnswer]}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-16 text-center bg-white rounded-3xl border border-gray-200">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600">
                                <CheckCircle2 size={32} />
                            </div>
                            <p className="font-semibold text-gray-900 text-lg mb-2">¡Perfecto!</p>
                            <p className="text-gray-600">No tuviste ningún error en esta evaluación.</p>
                        </div>
                    )}
                </section>

                <footer className="mt-16 flex justify-center pb-20">
                    <button
                        onClick={() => router.push(`/exam?category=${result.category}`)}
                        className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium shadow-xl transition-all flex items-center gap-3 hover:scale-105"
                    >
                        <RotateCcw size={20} /> Intentar de Nuevo
                    </button>
                </footer>
            </div>
        </div>
    );
}
