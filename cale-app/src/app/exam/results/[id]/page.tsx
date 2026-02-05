
'use client';

import { useState, useEffect, use } from 'react';
import { storage } from '@/lib/storage';
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
            const allResults = await storage.getResults();
            const found = allResults.find(r => r.id === id);
            if (found) {
                setResult(found);
                const allQuestions = await storage.getQuestions();
                setQuestions(allQuestions);
            }
        };
        loadResultData();
    }, [id]);

    if (!result) return null;

    const passingScore = Math.ceil(result.totalQuestions * 0.8);
    const passed = result.score >= passingScore;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-8 transition-colors"
                >
                    <ArrowLeft size={20} /> Volver al Inicio
                </button>

                <header className={`p-10 rounded-[2.5rem] text-white shadow-2xl mb-10 relative overflow-hidden ${passed ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-bold mb-4 uppercase tracking-wider">
                                Resultado de Evaluación {result.category}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold mb-2">
                                {passed ? '¡Felicitaciones!' : 'Sigue Practicando'}
                            </h1>
                            <p className="text-white/80 text-lg">
                                Has obtenido un puntaje de {result.score} sobre {result.totalQuestions}
                                <span className="block text-sm opacity-80 mt-1">Se requiere {passingScore} para aprobar (80%)</span>
                            </p>
                        </div>

                        <div className="w-40 h-40 bg-white/20 rounded-full flex flex-col items-center justify-center border-4 border-white/30 backdrop-blur-md">
                            <span className="text-5xl font-bold">{Math.round((result.score / result.totalQuestions) * 100)}%</span>
                            <span className="text-xs font-bold uppercase mt-1 text-white/70">{passed ? 'Aprobado' : 'Reprobado'}</span>
                        </div>
                    </div>

                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[100%] bg-white/10 rounded-full blur-[80px]" />
                </header>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle size={24} className="text-amber-500" />
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
                                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                                    >
                                        <p className="font-bold text-slate-900 mb-4">{q.text}</p>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                                                <XCircle size={18} className="text-red-600 mt-1 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-red-600 uppercase">Tu Respuesta</p>
                                                    <p className="text-sm text-slate-700 font-medium">{failed.userAnswer === -1 ? 'Sin responder' : q.options[failed.userAnswer]}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                                                <CheckCircle2 size={18} className="text-emerald-600 mt-1 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-emerald-600 uppercase">Respuesta Correcta</p>
                                                    <p className="text-sm text-slate-700 font-medium">{q.options[q.correctAnswer]}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                                <CheckCircle2 size={32} />
                            </div>
                            <p className="font-bold text-slate-900">¡Perfecto!</p>
                            <p className="text-slate-500">No tuviste ningún error en esta evaluación.</p>
                        </div>
                    )}
                </section>

                <footer className="mt-12 flex justify-center pb-20">
                    <button
                        onClick={() => router.push(`/exam?category=${result.category}`)}
                        className="px-10 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold shadow-xl transition-all flex items-center gap-3"
                    >
                        <RotateCcw size={20} /> Intentar de Nuevo
                    </button>
                </footer>
            </div>
        </div>
    );
}
