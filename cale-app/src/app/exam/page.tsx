
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Question, ExamResult, Category } from '@/lib/data';
import { ChevronLeft, ChevronRight, Clock, Shield, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ExamContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const category = (searchParams.get('category') as Category) || 'A2';

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [timeLeft, setTimeLeft] = useState(3000); // Default to 50 mins
    const [isFinished, setIsFinished] = useState(false);

    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    useEffect(() => {
        const loadQuestions = async () => {
            const user = storage.getCurrentUser();
            const q = await storage.getQuestions(category);

            // 1. Shuffle all available questions
            const shuffledPool = shuffleArray(q);

            // 2. Select amount based on Pro status
            const count = user?.isPro ? 40 : 15;
            const selected = shuffledPool.slice(0, count);

            // 3. Shuffle options for each selected question
            const finalized = selected.map(question => {
                const originalOptions = [...question.options];
                const correctAnswerText = originalOptions[question.correctAnswer];
                const shuffledOptions = shuffleArray(originalOptions);
                const newCorrectAnswer = shuffledOptions.indexOf(correctAnswerText);

                return {
                    ...question,
                    options: shuffledOptions,
                    correctAnswer: newCorrectAnswer
                };
            });

            setQuestions(finalized);

            // 4. Set timer based on Pro status
            setTimeLeft(user?.isPro ? 3000 : 1200); // 50m vs 20m
        };
        loadQuestions();

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    finishExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [category]);

    const finishExam = async () => {
        const user = storage.getCurrentUser();
        if (!user) return;

        let score = 0;
        const failedQuestions: ExamResult['failedQuestions'] = [];

        questions.forEach((q) => {
            if (answers[q.id] === q.correctAnswer) {
                score++;
            } else {
                failedQuestions.push({
                    questionId: q.id,
                    userAnswer: answers[q.id] ?? -1
                });
            }
        });

        const result: ExamResult = {
            id: Math.random().toString(36).substr(2, 9),
            userId: user.id,
            userName: user.name,
            category,
            date: new Date().toISOString(),
            score,
            totalQuestions: questions.length,
            failedQuestions
        };

        await storage.saveResult(result);
        setIsFinished(true);
        setTimeout(() => router.push(`/exam/results/${result.id}`), 2000);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (questions.length === 0) return null;

    if (isFinished) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Evaluación Finalizada!</h2>
                    <p className="text-slate-500">Estamos procesando tus resultados...</p>
                </motion.div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                            <Shield size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Categoría {category}</p>
                            <h1 className="font-bold text-slate-900">Evaluación Sin Fronteras</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full font-mono font-bold text-slate-700">
                        <Clock size={16} /> {formatTime(timeLeft)}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 mt-8">
                <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-400 uppercase">Pregunta {currentIndex + 1} de {questions.length}</span>
                        <span className="text-sm font-bold text-blue-600">{Math.round(((currentIndex + 1) / questions.length) * 100)}% Completado</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100"
                    >
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 leading-tight">
                            {currentQuestion.text}
                        </h2>

                        <div className="space-y-4">
                            {currentQuestion.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setAnswers({ ...answers, [currentQuestion.id]: idx })}
                                    className={`w-full p-5 rounded-2xl text-left font-medium transition-all flex items-center gap-4 border-2 ${answers[currentQuestion.id] === idx
                                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                                        : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600'
                                        }`}
                                >
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${answers[currentQuestion.id] === idx ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    {option}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} /> Anterior
                    </button>

                    {currentIndex === questions.length - 1 ? (
                        <button
                            onClick={finishExam}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
                        >
                            Finalizar Evaluación
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-lg transition-all"
                        >
                            Siguiente <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ExamPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ExamContent />
        </Suspense>
    );
}
