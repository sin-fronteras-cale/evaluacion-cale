'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Modal } from '@/components/Modal';
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { use } from 'react';

export default function EvaluationQuestions({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const routerParams = use(params);
    const evaluationId = routerParams.id;

    const [evaluation, setEvaluation] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthAndLoad = async () => {
            const user = await authClient.getCurrentUser();
            if (!user || (user.role !== 'admin' && user.role !== 'admin_supertaxis')) {
                router.push('/');
                return;
            }
            loadEvaluation();
        };
        checkAuthAndLoad();
    }, [router, evaluationId]);

    const loadEvaluation = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/evaluations/${evaluationId}`, {
                credentials: 'include',
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setEvaluation(data.evaluation);

                // Cargar las preguntas (asociadas configurando el ID como category)
                const qRes = await fetch(`/api/questions?category=${evaluationId}`, {
                    credentials: 'include',
                    cache: 'no-store'
                });
                if (qRes.ok) {
                    const qData = await qRes.json();
                    setQuestions(qData.questions || []);
                }
            } else {
                router.push('/admin/evaluations');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const q = {
                id: currentQuestion?.id || `${evaluationId}-${Date.now()}`,
                category: evaluationId, // Use evaluation ID as category
                text: currentQuestion.text,
                options: currentQuestion.options,
                correctAnswer: currentQuestion.correctAnswer ?? 0,
                evaluationId: evaluationId
            };

            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(q)
            });

            if (res.ok) {
                setIsModalOpen(false);
                loadEvaluation();
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'al guardar pregunta'}`);
            }
        } catch (e) {
            alert('Error de red');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta pregunta?')) return;
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'delete', id })
            });

            if (res.ok) {
                loadEvaluation();
            } else {
                alert('Error al eliminar');
            }
        } catch (e) {
            alert('Error de red');
        }
    };

    const updateOption = (idx: number, val: string) => {
        const opts = [...(currentQuestion?.options || ['', '', '', ''])];
        opts[idx] = val;
        setCurrentQuestion({ ...currentQuestion, options: opts });
    };

    if (isLoading || !evaluation) return <div className="p-10 text-center">Cargando...</div>;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 p-10">
                <button onClick={() => router.push('/admin/evaluations')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium transition">
                    <ArrowLeft size={18} /> Volver a Evaluaciones
                </button>

                <header className="flex justify-between items-center mb-10 pb-6 border-b border-gray-200">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Preguntas de {evaluation.name}</h1>
                        <p className="text-gray-600 mt-2">Administra las preguntas que aparecerán en esta evaluación ({questions.length} / {evaluation.questionCount} min).</p>
                    </div>
                    <button
                        onClick={() => {
                            setCurrentQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0 });
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"
                    >
                        <Plus size={20} /> Nueva Pregunta
                    </button>
                </header>

                <div className="space-y-4">
                    {questions.length === 0 ? (
                        <div className="text-center p-16 bg-white rounded-2xl border border-gray-200 border-dashed text-gray-500">
                            No hay preguntas en esta evaluación. Haz clic en "Nueva Pregunta" para empezar.
                        </div>
                    ) : (
                        questions.map((q, idx) => (
                            <div key={q.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex justify-between gap-6 hover:border-blue-200 transition">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">#{idx + 1}</span>
                                    </div>
                                    <h3 className="font-medium text-gray-900 mb-4">{q.text}</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {q.options.map((opt: string, i: number) => (
                                            <div key={i} className={`flex items-center gap-2 ${i === q.correctAnswer ? 'text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded' : 'text-gray-600 px-2 py-1'}`}>
                                                <span className="text-xs uppercase bg-white border w-5 h-5 flex items-center justify-center rounded text-gray-500">{String.fromCharCode(65 + i)}</span>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setCurrentQuestion(q); setIsModalOpen(true); }}
                                        className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition self-start"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition self-start"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pregunta de Evaluación">
                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Respuesta Correcta</label>
                        <select
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 outline-none transition bg-white"
                            value={currentQuestion?.correctAnswer || 0}
                            onChange={e => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(e.target.value) })}
                        >
                            <option value={0}>Opción A</option>
                            <option value={1}>Opción B</option>
                            <option value={2}>Opción C</option>
                            <option value={3}>Opción D</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Enunciado de la Pregunta</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 outline-none resize-none transition"
                            value={currentQuestion?.text || ''}
                            onChange={e => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-900">Opciones de Respuesta</label>
                        {['A', 'B', 'C', 'D'].map((label, i) => (
                            <div key={label} className={`flex items-center gap-3 p-2 rounded-xl border ${currentQuestion?.correctAnswer === i ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-transparent'}`}>
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-white border border-gray-200 text-gray-600`}>
                                    {label}
                                </span>
                                <input
                                    required
                                    placeholder={`Opción ${label}...`}
                                    className="bg-transparent border-none outline-none text-sm w-full"
                                    value={currentQuestion?.options?.[i] || ''}
                                    onChange={e => updateOption(i, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium mt-4 shadow-lg shadow-blue-200 hover:shadow-xl hover:bg-blue-700 transition transform hover:-translate-y-0.5">
                        Guardar Pregunta
                    </button>
                </form>
            </Modal>
        </div>
    );
}
