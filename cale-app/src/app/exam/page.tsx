
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
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
    const [isPro, setIsPro] = useState(false);
    const [evalName, setEvalName] = useState(`Categoría ${category}`);

    const isSameLocalDay = (a: Date, b: Date) => {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    };

    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const getRecentQuestionIds = async (userId: string, category: Category, attempts: number) => {
        const res = await fetch('/api/results', { credentials: 'include' });
        if (!res.ok) return [];
        const data = await res.json();
        const results = data.results || [];
        return results
            .filter((r: ExamResult) => r.userId === userId && r.category === category)
            .sort((a: ExamResult, b: ExamResult) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, attempts)
            .flatMap((r: ExamResult) => r.questionIds ?? r.failedQuestions.map(f => f.questionId));
    };

    useEffect(() => {
        const loadQuestions = async () => {
            const user = await authClient.getCurrentUser();
            if (!user) {
                router.push('/');
                return;
            }

            const isProUser = user.isPro || user.role === 'admin' || user.role === 'admin_supertaxis';
            setIsPro(isProUser);

            // Parallelize all initial network requests to optimize load times
            const [evalRes, questionsRes, recentIdsList, resultsDataLimit] = await Promise.all([
                fetch(`/api/evaluations/${category}`, { credentials: 'include' }).catch(() => null),
                fetch(`/api/questions?category=${category}`, { credentials: 'include' }).catch(() => null),
                getRecentQuestionIds(user.id, category, 3).catch(() => []),
                !isProUser ? fetch('/api/results', { credentials: 'include' }).then(res => res.ok ? res.json() : null).catch(() => null) : Promise.resolve(null)
            ]);

            let isCustomEval = false;
            let customCount = 0;
            let customTime = 0;

            if (evalRes?.ok) {
                const evalData = await evalRes.json();
                if (evalData.evaluation) {
                    isCustomEval = true;
                    customCount = evalData.evaluation.questionCount;
                    customTime = evalData.evaluation.durationMinutes * 60;
                    setEvalName(evalData.evaluation.name);
                }
            }

            if (!user.isPro && resultsDataLimit && !isCustomEval) {
                const allResults = resultsDataLimit.results || [];
                // Find all evaluations mapped to check if it was a custom test taken today
                const today = new Date();
                const hasAttemptToday = allResults.some((r: ExamResult) =>
                    r.userId === user.id && isSameLocalDay(new Date(r.date), today) &&
                    !['A2', 'B1', 'C1'].includes(r.category) === false // Only count A2,B1,C1 limits
                );

                if (hasAttemptToday && ['A2', 'B1', 'C1'].includes(category)) {
                    router.push('/dashboard?limit=1');
                    return;
                }
            }

            if (!questionsRes?.ok) {
                console.error('Error cargando preguntas');
                router.push('/dashboard');
                return;
            }
            const questionsData = await questionsRes.json();
            const q: Question[] = questionsData.questions || [];

            const count = isCustomEval ? customCount : (isProUser ? 40 : 15);
            const avoidSet = new Set(recentIdsList);
            const filteredPool = q.filter((item: Question) => !avoidSet.has(item.id));
            const poolToUse = filteredPool.length >= count ? filteredPool : q;

            // 1. Shuffle all available questions (skip for custom evals to keep order)
            const shuffledPool = isCustomEval ? poolToUse : shuffleArray(poolToUse);

            // 2. Select amount based on configuration
            const selected = shuffledPool.slice(0, count);

            const finalized = selected.map(question => {
                const originalOptions = [...question.options];
                let shuffledOptions = originalOptions;
                let newCorrectAnswer = question.correctAnswer;

                if (!isCustomEval) {
                    const correctAnswerText = originalOptions[question.correctAnswer];
                    shuffledOptions = shuffleArray(originalOptions);
                    newCorrectAnswer = shuffledOptions.indexOf(correctAnswerText);
                }

                return {
                    ...question,
                    options: shuffledOptions,
                    correctAnswer: newCorrectAnswer
                };
            });

            setQuestions(finalized);

            // 4. Set timer (Custom evaluation settings always take priority)
            const finalTime = isCustomEval ? customTime : (isProUser ? 3000 : 900);
            setTimeLeft(finalTime);
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
        const user = await authClient.getCurrentUser();
        if (!user) {
            router.push('/');
            return;
        }

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
            questionIds: questions.map(q => q.id),
            failedQuestions
        };

        // Guardar resultado en API
        const res = await fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(result)
        });

        if (!res.ok) {
            console.error('Error guardando resultado');
        }

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
            <div className="min-h-screen flex items-center justify-center bg-white p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">¡Evaluación Finalizada!</h2>
                    <p className="text-gray-600">Estamos procesando tus resultados...</p>
                </motion.div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="min-h-screen bg-white">
            <header className="bg-white/95 border-b border-gray-200 sticky top-0 z-20 backdrop-blur-2xl">
                <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                            <Shield size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{evalName} {!isPro && !evalName.includes('Categoría') ? '' : (!isPro && '(PRUEBA - 15 preguntas)')}</p>
                            <h1 className="font-semibold text-gray-900">Evaluación Sin Fronteras</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-full font-mono font-semibold text-gray-900">
                        <Clock size={18} /> {formatTime(timeLeft)}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 mt-10">
                <div className="mb-10">
                    <div className="flex justify-between items-end mb-3">
                        <span className="text-sm font-medium text-gray-600">Pregunta {currentIndex + 1} de {questions.length}</span>
                        <span className="text-sm font-medium text-blue-600">{Math.round(((currentIndex + 1) / questions.length) * 100)}% Completado</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
                        className="bg-white p-10 md:p-14 rounded-3xl shadow-xl border border-gray-200"
                    >
                        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-10 leading-tight tracking-tight">
                            {currentQuestion.text}
                        </h2>

                        <div className="space-y-4">
                            {currentQuestion.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setAnswers({ ...answers, [currentQuestion.id]: idx })}
                                    className={`w-full p-5 rounded-2xl text-left font-normal transition-all flex items-center gap-4 border-2 text-base ${answers[currentQuestion.id] === idx
                                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                                        : 'bg-gray-50/50 border-transparent hover:bg-gray-50 hover:border-gray-200 text-gray-700'
                                        }`}
                                >
                                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold ${answers[currentQuestion.id] === idx
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-500 border-2 border-gray-200'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    {option}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="mt-10 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} /> Anterior
                    </button>

                    {currentIndex === questions.length - 1 ? (
                        <button
                            onClick={finishExam}
                            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-200 transition-all hover:scale-105"
                        >
                            Finalizar Evaluación
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            className="flex items-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-medium shadow-lg transition-all hover:scale-105"
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
