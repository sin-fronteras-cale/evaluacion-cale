
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Question, Category } from '@/lib/data';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Modal } from '@/components/Modal';
import { Plus, Edit2, Trash2, Filter, Search } from 'lucide-react';

export default function QuestionManagement() {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'Conocimiento' | 'Actitudinal'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkAuthAndLoadQuestions = async () => {
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

            // Cargar preguntas y evaluaciones
            loadData();
        };

        const loadData = async () => {
            try {
                setIsLoading(true);
                setError('');

                // Fetch Categories/Evaluations first
                const evalRes = await fetch('/api/evaluations', { credentials: 'include' });
                if (evalRes.ok) {
                    const evalData = await evalRes.json();
                    setEvaluations(evalData.evaluations || []);
                }

                console.log('Fetching questions from /api/questions...');
                const res = await fetch('/api/questions', {
                    credentials: 'include'
                });
                console.log('Response status:', res.status);
                if (!res.ok) {
                    if (res.status === 401) {
                        setError('No autenticado. Por favor inicia sesión.');
                    } else {
                        const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
                        setError(errorData.error || 'Error al cargar preguntas');
                    }
                    console.error('Failed to load questions:', res.status);
                    return;
                }
                const data = await res.json();
                console.log('Questions loaded:', data.questions?.length || 0);
                setQuestions(data.questions || []);
            } catch (e) {
                console.error('Error loading questions:', e);
                setError('Error de conexión al cargar preguntas');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthAndLoadQuestions();
    }, [router]);

    const categoryLabels: Record<string, string> = {
        A2: 'Moto A2',
        B1: 'Carro B1',
        C1: 'Publico C1',
        supertaxis: 'Supertaxis'
    };

    // Add dynamic evaluations to labels
    evaluations.forEach(ev => {
        if (!categoryLabels[ev.id]) {
            categoryLabels[ev.id] = ev.name;
        }
    });

    const getQuestionType = (id: string) => {
        const match = id.match(/-(\d+)$/);
        const num = match ? parseInt(match[1], 10) : 0;
        if (num >= 1 && num <= 70) return 'Conocimiento';
        if (num >= 71 && num <= 100) return 'Actitudinal';
        return 'Sin tipo';
    };

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredQuestions = questions.filter(q => {
        if (categoryFilter !== 'ALL' && q.category !== categoryFilter) return false;
        if (typeFilter !== 'ALL' && getQuestionType(q.id) !== typeFilter) return false;
        if (!normalizedSearch) return true;
        const haystack = [
            q.text,
            q.category,
            categoryLabels[q.category],
            ...q.options
        ].join(' ').toLowerCase();
        return haystack.includes(normalizedSearch);
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentQuestion?.text && currentQuestion?.category && currentQuestion?.options) {
            const q: Question = {
                id: currentQuestion.id || `${currentQuestion.category}-${Date.now()}`,
                category: currentQuestion.category as Category,
                text: currentQuestion.text,
                options: currentQuestion.options,
                correctAnswer: currentQuestion.correctAnswer ?? 0
            };

            try {
                const res = await fetch('/api/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(q)
                });

                if (!res.ok) {
                    alert('Error al guardar la pregunta');
                    return;
                }

                // Reload questions
                const questionsRes = await fetch('/api/questions', {
                    credentials: 'include'
                });
                if (questionsRes.ok) {
                    const data = await questionsRes.json();
                    setQuestions(data);
                }

                setIsModalOpen(false);
            } catch (e) {
                console.error('Error saving question:', e);
                alert('Error al guardar la pregunta');
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar esta pregunta?')) {
            try {
                const res = await fetch('/api/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ action: 'delete', id })
                });

                if (!res.ok) {
                    alert('Error al eliminar la pregunta');
                    return;
                }

                // Reload questions
                const questionsRes = await fetch('/api/questions', {
                    credentials: 'include'
                });
                if (questionsRes.ok) {
                    const data = await questionsRes.json();
                    setQuestions(data);
                }
            } catch (e) {
                console.error('Error deleting question:', e);
                alert('Error al eliminar la pregunta');
            }
        }
    };

    const updateOption = (idx: number, val: string) => {
        const opts = [...(currentQuestion?.options || ['', '', '', ''])];
        opts[idx] = val;
        setCurrentQuestion({ ...currentQuestion, options: opts });
    };

    return (
        <div className="flex min-h-screen bg-white">
            <AdminSidebar />
            <main className="flex-1 p-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900">Banco de Preguntas</h1>
                        <p className="text-gray-600">Administra las {questions.length} preguntas de las diferentes categorías.</p>
                    </div>
                    <button
                        onClick={() => {
                            setCurrentQuestion({ category: 'A2', options: ['', '', '', ''], correctAnswer: 0 });
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                        <Plus size={20} /> Nueva Pregunta
                    </button>
                </header>

                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">Filtrar por:</span>
                        </div>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar preguntas..."
                                    className="w-full md:w-64 pl-9 pr-3 py-2 rounded-full text-sm border border-gray-200 bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                {['ALL', 'Conocimiento', 'Actitudinal'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setTypeFilter(type as any)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${typeFilter === type ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {type === 'ALL' ? 'Todos' : type}
                                    </button>
                                ))}
                            </div>
                            {['ALL', 'A2', 'B1', 'C1', ...evaluations.map(e => e.id)].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat as any)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${categoryFilter === cat ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {cat === 'ALL' ? 'Todas' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {error && (
                            <div className="p-12 text-center">
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 max-w-md mx-auto">
                                    <p className="font-semibold mb-2">Error al cargar preguntas</p>
                                    <p className="text-sm">{error}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                                    >
                                        Recargar página
                                    </button>
                                </div>
                            </div>
                        )}
                        {!error && isLoading && (
                            <div className="p-12 text-center text-gray-600">
                                <p>Cargando preguntas...</p>
                            </div>
                        )}
                        {!error && !isLoading && filteredQuestions.length === 0 && (
                            <div className="p-12 text-center text-gray-600">
                                <p className="font-medium">No hay preguntas para mostrar</p>
                                {questions.length > 0 && (
                                    <p className="text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
                                )}
                                {questions.length === 0 && (
                                    <p className="text-sm mt-2">Agrega tu primera pregunta con el botón "Nueva Pregunta"</p>
                                )}
                            </div>
                        )}
                        {!error && !isLoading && filteredQuestions.length > 0 && (
                            filteredQuestions.map((q) => (
                                <div key={q.id} className="p-8 hover:bg-gray-50/50 transition-colors group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded uppercase inline-block">
                                                    {q.category}
                                                </span>
                                                <span className="text-xs font-medium text-gray-600">
                                                    Categoria: {categoryLabels[q.category]}
                                                </span>
                                                <span className="text-xs font-medium text-gray-600">
                                                    Tipo: {getQuestionType(q.id)}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{q.text}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                                {q.options.map((opt, i) => (
                                                    <div key={i} className={`text-sm flex items-center gap-2 ${i === q.correctAnswer ? 'text-emerald-600 font-semibold' : 'text-gray-600'}`}>
                                                        <span className="w-5 h-5 rounded-md border flex items-center justify-center text-[10px]">{String.fromCharCode(65 + i)}</span>
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setCurrentQuestion(q); setIsModalOpen(true); }}
                                                className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(q.id)}
                                                className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentQuestion?.id ? 'Editar Pregunta' : 'Nueva Pregunta'}
            >
                <form onSubmit={handleSave} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-normal text-gray-900 mb-2">Categoría</label>
                            <select
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all bg-white"
                                value={currentQuestion?.category || 'A2'}
                                onChange={e => setCurrentQuestion({ ...currentQuestion, category: e.target.value as Category })}
                            >
                                <option value="A2">MOTO A2</option>
                                <option value="B1">CARRO B1</option>
                                <option value="C1">PÚBLICO C1</option>
                                {evaluations.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-normal text-gray-900 mb-2">Respuesta Correcta</label>
                            <select
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all bg-white"
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
                        <label className="block text-sm font-normal text-gray-900 mb-2">Enunciado de la Pregunta</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none resize-none transition-all"
                            value={currentQuestion?.text || ''}
                            onChange={e => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-normal text-gray-900">Opciones de Respuesta</label>
                        {['A', 'B', 'C', 'D'].map((label, i) => (
                            <div key={label} className={`flex items-center gap-2 p-2 rounded-xl transition-all ${currentQuestion?.correctAnswer === i ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50 border border-transparent'}`}>
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm ${currentQuestion?.correctAnswer === i ? 'bg-emerald-600 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}>
                                    {label}
                                </span>
                                <input
                                    required
                                    placeholder={`Escribe la opción ${label}...`}
                                    className="bg-transparent border-none outline-none text-sm w-full font-normal"
                                    value={currentQuestion?.options?.[i] || ''}
                                    onChange={e => updateOption(i, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-normal shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]">
                        Guardar Pregunta
                    </button>
                </form>
            </Modal>
        </div>
    );
}
