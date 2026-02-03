
'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { User } from '@/lib/data';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Modal } from '@/components/Modal';
import { UserPlus, Edit2, Trash2, Search, Mail, User as UserIcon } from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);

    useEffect(() => {
        const loadUsers = async () => {
            setUsers(await storage.getUsers());
        };
        loadUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser?.name && currentUser?.email) {
            const newUser: User = {
                id: currentUser.id || Math.random().toString(36).substr(2, 9),
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role || 'user',
                password: currentUser.password,
                isPro: currentUser.isPro || false
            };
            await storage.saveUser(newUser);
            setUsers(await storage.getUsers());
            setIsModalOpen(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            await storage.deleteUser(id);
            setUsers(await storage.getUsers());
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 p-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Gestión de Usuarios</h1>
                        <p className="text-slate-500">Registra y administra las cuentas de conductores.</p>
                    </div>
                    <button
                        onClick={() => { setCurrentUser({ role: 'user' }); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                    >
                        <UserPlus size={20} /> Nuevo Usuario
                    </button>
                </header>

                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <Search className="text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            className="bg-transparent border-none outline-none text-slate-900 w-full font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado/Rol</th>
                                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                                    <UserIcon size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{user.name}</p>
                                                    <p className="text-sm text-slate-500 flex items-center gap-1"><Mail size={12} /> {user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {user.role}
                                            </span>
                                            {user.isPro && (
                                                <span className="ml-2 px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                    Pro
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setCurrentUser(user); setIsModalOpen(true); }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    disabled={user.role === 'admin'}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentUser?.id ? 'Editar Usuario' : 'Nuevo Usuario'}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                        <input
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={currentUser?.name || ''}
                            onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
                        <input
                            required type="email"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={currentUser?.email || ''}
                            onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={currentUser?.role || 'user'}
                            onChange={e => setCurrentUser({ ...currentUser, role: e.target.value as any })}
                        >
                            <option value="user">Usuario Estudiante</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            required={!currentUser?.id}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder={currentUser?.id ? "Dejar en blanco para no cambiar" : "••••••••"}
                            value={currentUser?.password || ''}
                            onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center gap-2 py-2">
                        <input
                            type="checkbox"
                            id="isPro"
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={currentUser?.isPro || false}
                            onChange={e => setCurrentUser({ ...currentUser, isPro: e.target.checked })}
                        />
                        <label htmlFor="isPro" className="text-sm font-bold text-slate-700 cursor-pointer">
                            Usuario Pro (Examen de 40 preguntas)
                        </label>
                    </div>
                    <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold mt-4">Guardar Usuario</button>
                </form>
            </Modal>
        </div>
    );
}
