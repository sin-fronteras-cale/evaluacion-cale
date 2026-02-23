'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Modal } from '@/components/Modal';
import { Plus, Edit2, Trash2, Settings } from 'lucide-react';

export default function EvaluationsManagement() {
    const router = useRouter();
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEval, setCurrentEval] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthAndLoad = async () => {
            const user = await authClient.getCurrentUser();
            if (!user || user.role !== 'admin') {
                router.push('/');
                return;
            }
            loadEvaluations();
        };
        checkAuthAndLoad();
    }, [router]);

    const loadEvaluations = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/evaluations', {
                credentials: 'include',
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setEvaluations(data.evaluations || []);
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
            const method = currentEval?.id ? 'PUT' : 'POST';
            const url = currentEval?.id ? `/api/evaluations/${currentEval.id}` : '/api/evaluations';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(currentEval)
            });

            if (res.ok) {
                setIsModalOpen(false);
                loadEvaluations();
            } else {
                alert('Error al guardar evaluación');
            }
        } catch (e) {
            alert('Error de red');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta evaluación?')) return;
        try {
            const res = await fetch(`/api/evaluations/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                loadEvaluations();
            } else {
                alert('Error al eliminar');
            }
        } catch (e) {
            alert('Error de red');
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 p-10">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Evaluaciones Personalizadas</h1>
                        <p className="text-gray-600 mt-2">Crea y administra evaluaciones a tu medida.</p>
                    </div>
                    <button
                        onClick={() => {
                            setCurrentEval({ name: '', description: '', durationMinutes: 60, questionCount: 40, isActive: true });
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"
                    >
                        <Plus size={20} /> Crear Evaluación
                    </button>
                </header>

                {isLoading ? (
                    <div className="p-10 text-center">Cargando...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {evaluations.map(ev => (
                            <div key={ev.id} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{ev.name}</h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{ev.description || 'Sin descripción'}</p>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium">{ev.durationMinutes} min</span>
                                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg font-medium">{ev.questionCount} pags / user</span>
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-medium">{ev._count.questions} en total</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 border-t pt-4 border-gray-100">
                                    <button
                                        onClick={() => router.push(`/admin/evaluations/${ev.id}`)}
                                        className="flex-1 text-center py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition"
                                    >
                                        Preguntas
                                    </button>
                                    <button
                                        onClick={() => { setCurrentEval(ev); setIsModalOpen(true); }}
                                        className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ev.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configurar Evaluación">
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1.5 font-medium">Nombre</label>
                        <input required className="w-full px-4 py-2 border rounded-xl" value={currentEval?.name || ''} onChange={e => setCurrentEval({ ...currentEval, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm mb-1.5 font-medium">Descripción</label>
                        <textarea className="w-full px-4 py-2 border rounded-xl" value={currentEval?.description || ''} onChange={e => setCurrentEval({ ...currentEval, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1.5 font-medium">Tiempo (Minutos)</label>
                            <input type="number" required min="1" className="w-full px-4 py-2 border rounded-xl" value={currentEval?.durationMinutes || ''} onChange={e => setCurrentEval({ ...currentEval, durationMinutes: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-sm mb-1.5 font-medium">Nº Preguntas al Usuario</label>
                            <input type="number" required min="1" className="w-full px-4 py-2 border rounded-xl" value={currentEval?.questionCount || ''} onChange={e => setCurrentEval({ ...currentEval, questionCount: parseInt(e.target.value) })} />
                        </div>
                    </div>
                    <div className="pt-2">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={currentEval?.isActive ?? true} onChange={e => setCurrentEval({ ...currentEval, isActive: e.target.checked })} className="w-4 h-4 rounded text-blue-600" />
                            <span className="text-sm font-medium">Evaluación Activa</span>
                        </label>
                    </div>
                    <button className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">
                        Guardar Evaluación
                    </button>
                </form>
            </Modal>
        </div>
    );
}
