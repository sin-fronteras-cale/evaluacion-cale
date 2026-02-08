'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { User } from '@/lib/data';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Modal } from '@/components/Modal';
import { UserPlus, Edit2, Trash2, Search, Mail, User as UserIcon, Info } from 'lucide-react';

interface PaymentInfo {
    id: string;
    reference: string;
    status: string;
    amountInCents: number;
    currency: string;
    paymentMethodType?: string | null;
    customerEmail?: string | null;
    userId?: string | null;
    createdAt: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user' | 'pro'>('all');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [infoUser, setInfoUser] = useState<User | null>(null);
    const [infoPayments, setInfoPayments] = useState<PaymentInfo[]>([]);
    const [isLoadingPayments, setIsLoadingPayments] = useState(false);
    const [paymentsIndex, setPaymentsIndex] = useState<PaymentInfo[]>([]);

    useEffect(() => {
        const loadUsers = async () => {
            setUsers(await storage.getUsers());
        };
        loadUsers();
    }, []);

    useEffect(() => {
        const loadPaymentsIndex = async () => {
            try {
                const res = await fetch('/api/payments');
                if (!res.ok) return;
                const payments: PaymentInfo[] = await res.json();
                setPaymentsIndex(payments);
            } catch (e) {
                console.error('Failed to load payments index', e);
            }
        };
        loadPaymentsIndex();
    }, []);

    const isApprovedPayment = (payment: PaymentInfo) => {
        const normalized = payment.status?.toLowerCase().trim();
        return normalized === 'approved' || normalized === 'aprobado';
    };

    const hasPayment = (user: User) => {
        return paymentsIndex.some(p => {
            if (!isApprovedPayment(p)) return false;
            const matchesUserId = p.userId && p.userId === user.id;
            const matchesEmail = p.customerEmail && p.customerEmail === user.email;
            const matchesReference = p.reference && p.reference.includes(`PRO-${user.id}-`);
            return matchesUserId || matchesEmail || matchesReference;
        });
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = [u.name, u.email, u.phone, u.idNumber, u.city, u.department]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;
        const matchesRole = roleFilter === 'all'
            || (roleFilter === 'pro' ? Boolean(u.isPro) : u.role === roleFilter);

        if (!matchesRole) return false;
        if (paymentFilter === 'paid') return hasPayment(u);
        return true;
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser?.name && currentUser?.email) {
            const newUser: User = {
                id: currentUser.id || Math.random().toString(36).substr(2, 9),
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role || 'user',
                password: currentUser.password,
                phone: currentUser.phone,
                idType: currentUser.idType,
                idNumber: currentUser.idNumber,
                city: currentUser.city,
                department: currentUser.department,
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

    const openInfo = async (user: User) => {
        setInfoUser(user);
        setIsInfoOpen(true);
        setIsLoadingPayments(true);
        try {
            const res = await fetch('/api/payments');
            if (!res.ok) {
                setInfoPayments([]);
                return;
            }
            const payments: PaymentInfo[] = await res.json();
            const filtered = payments.filter(p => {
                if (!isApprovedPayment(p)) return false;
                const matchesUserId = p.userId && p.userId === user.id;
                const matchesEmail = p.customerEmail && p.customerEmail === user.email;
                const matchesReference = p.reference && p.reference.includes(`PRO-${user.id}-`);
                return matchesUserId || matchesEmail || matchesReference;
            });
            const sorted = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setInfoPayments(sorted);
        } catch (e) {
            console.error('Failed to load payments', e);
            setInfoPayments([]);
        } finally {
            setIsLoadingPayments(false);
        }
    };

    const formatDateTime = (value?: string) => {
        if (!value) return 'No aceptada';
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? 'No aceptada' : parsed.toLocaleString();
    };

    const formatCOP = (amountInCents: number) => {
        const amount = amountInCents / 100;
        return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount);
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
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Search className="text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o correo..."
                                className="bg-transparent border-none outline-none text-slate-900 w-full font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {[
                                { key: 'all', label: 'Todos' },
                                { key: 'admin', label: 'Administradores' },
                                { key: 'user', label: 'Usuarios' },
                                { key: 'pro', label: 'Pro' }
                            ].map(option => (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => setRoleFilter(option.key as typeof roleFilter)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${roleFilter === option.key
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setPaymentFilter(prev => prev === 'paid' ? 'all' : 'paid')}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${paymentFilter === 'paid'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                Con pago
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identificacion</th>
                                    <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicacion</th>
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
                                                    {user.phone && (
                                                        <p className="text-xs text-slate-400">{user.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-semibold text-slate-900">{user.idType || 'N/A'}</p>
                                            <p className="text-xs text-slate-500">{user.idNumber || 'Sin numero'}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-semibold text-slate-900">{user.city || 'Sin ciudad'}</p>
                                            <p className="text-xs text-slate-500">{user.department || 'Sin departamento'}</p>
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
                                                    onClick={() => openInfo(user)}
                                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                                                    title="Ver informacion"
                                                >
                                                    <Info size={18} />
                                                </button>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Celular</label>
                        <input
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={currentUser?.phone || ''}
                            onChange={e => setCurrentUser({ ...currentUser, phone: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Identificacion</label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentUser?.idType || 'CC'}
                                onChange={e => setCurrentUser({ ...currentUser, idType: e.target.value })}
                            >
                                <option value="CC">Cedula</option>
                                <option value="CE">Cedula de Extranjeria</option>
                                <option value="TI">Tarjeta de Identidad</option>
                                <option value="PAS">Pasaporte</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Numero de Identificacion</label>
                            <input
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentUser?.idNumber || ''}
                                onChange={e => setCurrentUser({ ...currentUser, idNumber: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
                            <input
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentUser?.city || ''}
                                onChange={e => setCurrentUser({ ...currentUser, city: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                            <input
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentUser?.department || ''}
                                onChange={e => setCurrentUser({ ...currentUser, department: e.target.value })}
                            />
                        </div>
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

            <Modal
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="Informacion del usuario"
            >
                <div className="space-y-4 text-sm">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</p>
                        <p className="text-slate-900 font-semibold">{infoUser?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correo</p>
                        <p className="text-slate-900 font-semibold">{infoUser?.email || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefono</p>
                        <p className="text-slate-900 font-semibold">{infoUser?.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identificacion</p>
                        <p className="text-slate-900 font-semibold">{infoUser?.idType || 'N/A'} · {infoUser?.idNumber || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ubicacion</p>
                        <p className="text-slate-900 font-semibold">{infoUser?.city || 'N/A'}, {infoUser?.department || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rol</p>
                        <p className="text-slate-900 font-semibold">{infoUser?.role || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Politica aceptada</p>
                        <p className="text-slate-900 font-semibold">{formatDateTime(infoUser?.policyAcceptedAt)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pagos</p>
                        {isLoadingPayments && (
                            <p className="text-slate-500">Cargando pagos...</p>
                        )}
                        {!isLoadingPayments && infoPayments.length === 0 && (
                            <p className="text-slate-500">Sin pagos registrados.</p>
                        )}
                        {!isLoadingPayments && infoPayments.length > 0 && (
                            <div className="space-y-2">
                                {infoPayments.map((payment) => (
                                    <div key={payment.id} className="rounded-lg border border-slate-200 px-3 py-2">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{new Date(payment.createdAt).toLocaleString()}</span>
                                            <span className="font-semibold text-slate-700">{payment.status}</span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-sm">
                                            <span className="font-semibold text-slate-900">${formatCOP(payment.amountInCents)} {payment.currency}</span>
                                            <span className="text-slate-500">{payment.paymentMethodType || 'N/A'}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500 break-all">{payment.reference}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
