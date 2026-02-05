
'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { Question, Category } from '@/lib/data';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Modal } from '@/components/Modal';
import { Plus, Edit2, Trash2, Filter } from 'lucide-react';

export default function QuestionManagement() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);

    useEffect(() => {
        const loadQuestions = async () => {
            setQuestions(await storage.getQuestions());
        };
        loadQuestions();
    }, []);

    const filteredQuestions = categoryFilter === 'ALL'
        ? questions
        : questions.filter(q => q.category === categoryFilter);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentQuestion?.text && currentQuestion?.category && currentQuestion?.options) {
            const q: Question = {
                id: currentQuestion.id || Math.random().toString(36).substr(2, 9),
                category: currentQuestion.category as Category,
                text: currentQuestion.text,
                options: currentQuestion.options,
                correctAnswer: currentQuestion.correctAnswer ?? 0
            };
            await storage.saveQuestion(q);
            setQuestions(await storage.getQuestions());
            setIsModalOpen(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar esta pregunta?')) {
            await storage.deleteQuestion(id);
            setQuestions(await storage.getQuestions());
        }
    };

    const updateOption = (idx: number, val: string) => {
        const opts = [...(currentQuestion?.options || ['', '', '', ''])];
        opts[idx] = val;
        setCurrentQuestion({ ...currentQuestion, options: opts });
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 p-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Banco de Preguntas</h1>
                        <p className="text-slate-500">Administra las {questions.length} preguntas de las diferentes categorías.</p>
                    </div>
                    <button
                        onClick={() => {
                            setCurrentQuestion({ category: 'A2', options: ['', '', '', ''], correctAnswer: 0 });
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                    >
                        <Plus size={20} /> Nueva Pregunta
                    </button>
                </header>

                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-500 uppercase">Filtrar por:</span>
                        </div>
                        <div className="flex gap-2">
                            {['ALL', 'A2', 'B1', 'C1'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat as any)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${categoryFilter === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    {cat === 'ALL' ? 'Todas' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredQuestions.map((q) => (
                            <div key={q.id} className="p-8 hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase mb-2 inline-block">
                                            {q.category}
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">{q.text}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                            {q.options.map((opt, i) => (
                                                <div key={i} className={`text-sm flex items-center gap-2 ${i === q.correctAnswer ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                                                    <span className="w-5 h-5 rounded-md border flex items-center justify-center text-[10px]">{String.fromCharCode(65 + i)}</span>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setCurrentQuestion(q); setIsModalOpen(true); }}
                                            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(q.id)}
                                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentQuestion?.id ? 'Editar Pregunta' : 'Nueva Pregunta'}
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 font-bold uppercase tracking-wider text-[10px]">Categoría</label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentQuestion?.category || 'A2'}
                                onChange={e => setCurrentQuestion({ ...currentQuestion, category: e.target.value as Category })}
                            >
                                <option value="A2">MOTO A2</option>
                                <option value="B1">CARRO B1</option>
                                <option value="C1">PÚBLICO C1</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 font-bold uppercase tracking-wider text-[10px]">Respuesta Correcta</label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentQuestion?.correctAnswer || 0}
                                onChange={e => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(e.target.value) })}
                            >
                                <option value={0}>Opción A</option>
                                <option value={1}>Opción B</option>
                                <option value={2}>Opción C</option>
                                <option value={3}>Opción D</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 font-bold uppercase tracking-wider text-[10px]">Enunciado de la Pregunta</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            value={currentQuestion?.text || ''}
                            onChange={e => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 font-bold uppercase tracking-wider text-[10px]">Opciones de Respuesta</label>
                        {['A', 'B', 'C', 'D'].map((label, i) => (
                            <div key={label} className={`flex items-center gap-2 p-2 rounded-xl transition-all ${currentQuestion?.correctAnswer === i ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-transparent'}`}>
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${currentQuestion?.correctAnswer === i ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                    {label}
                                </span>
                                <input
                                    required
                                    placeholder={`Escribe la opción ${label}...`}
                                    className="bg-transparent border-none outline-none text-sm w-full font-medium"
                                    value={currentQuestion?.options?.[i] || ''}
                                    onChange={e => updateOption(i, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all">
                        Guardar Pregunta
                    </button>
                </form>
            </Modal>
        </div>
    );
}
