'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
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
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user' | 'pro' | 'supertaxis' | 'admin_supertaxis'>('all');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
    const [adminRole, setAdminRole] = useState<string>('');
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [infoUser, setInfoUser] = useState<User | null>(null);
    const [infoPayments, setInfoPayments] = useState<PaymentInfo[]>([]);
    const [isLoadingPayments, setIsLoadingPayments] = useState(false);
    const [paymentsIndex, setPaymentsIndex] = useState<PaymentInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkAuthAndLoadData = async () => {
            // Verificar autenticación primero
            const user = await authClient.getCurrentUser();
            if (!user) {
                console.error('No authenticated user, redirecting to login');
                router.push('/');
                return;
            }

            if (user.role !== 'admin' && user.role !== 'admin_supertaxis') {
                console.error('User is not authorized, redirecting to dashboard');
                router.push('/dashboard');
                return;
            }

            setAdminRole(user.role?.toLowerCase() || 'user');

            // Cargar datos
            loadUsers();
        };

        const loadUsers = async () => {
            try {
                setIsLoading(true);
                setError('');
                const res = await fetch('/api/users', {
                    credentials: 'include'
                });
                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        setError('No tienes permisos para acceder a esta sección');
                    } else {
                        setError('Error al cargar usuarios');
                    }
                    return;
                }
                const data = await res.json();
                setUsers(data.users || []);
            } catch (e) {
                console.error('Error loading users:', e);
                setError('Error de conexión al cargar usuarios');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthAndLoadData();
    }, [router]);

    useEffect(() => {
        const loadPaymentsIndex = async () => {
            try {
                const res = await fetch('/api/payments', {
                    credentials: 'include'
                });
                if (!res.ok) return;
                const data = await res.json();
                const payments: PaymentInfo[] = data.payments || [];
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
            try {
                const userData = {
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email,
                    role: currentUser.role || 'user',
                    password: currentUser.password,
                    phone: currentUser.phone,
                    idType: currentUser.idType,
                    idNumber: currentUser.idNumber,
                    city: currentUser.city,
                    department: currentUser.department,
                    isPro: currentUser.isPro || false,
                    companyTag: currentUser.companyTag
                };

                const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(userData)
                });

                if (!res.ok) {
                    alert('Error al guardar el usuario');
                    return;
                }

                // Reload users
                const usersRes = await fetch('/api/users', {
                    credentials: 'include'
                });
                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setUsers(data.users || []);
                }

                setIsModalOpen(false);
            } catch (e) {
                console.error('Error saving user:', e);
                alert('Error al guardar el usuario');
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            try {
                const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ action: 'delete', id })
                });

                if (!res.ok) {
                    alert('Error al eliminar el usuario');
                    return;
                }

                // Reload users
                const usersRes = await fetch('/api/users', {
                    credentials: 'include'
                });
                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setUsers(data.users || []);
                }
            } catch (e) {
                console.error('Error deleting user:', e);
                alert('Error al eliminar el usuario');
            }
        }
    };

    const openInfo = async (user: User) => {
        setInfoUser(user);
        setIsInfoOpen(true);
        setIsLoadingPayments(true);
        try {
            const res = await fetch('/api/payments', {
                credentials: 'include'
            });
            if (!res.ok) {
                setInfoPayments([]);
                return;
            }
            const data = await res.json();
            const payments: PaymentInfo[] = data.payments || [];
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
        <div className="flex min-h-screen bg-white">
            <AdminSidebar />
            <main className="flex-1 p-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900">Gestión de Usuarios</h1>
                        <p className="text-gray-600">Registra y administra las cuentas de conductores.</p>
                    </div>
                    <button
                        onClick={() => { setCurrentUser({ role: 'user' }); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                        <UserPlus size={20} /> Nuevo Usuario
                    </button>
                </header>

                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Search className="text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o correo..."
                                className="bg-transparent border-none outline-none text-gray-900 w-full font-normal"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {[
                                { key: 'all', label: 'Todos' },
                                { key: 'admin', label: 'Administrador Central' },
                                { key: 'admin_supertaxis', label: 'Administrador Supertaxis' },
                                { key: 'supertaxis', label: 'Usuario Supertaxis' },
                                { key: 'user', label: 'Estudiantes' },
                                { key: 'pro', label: 'Pro' }
                            ].map(option => (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => setRoleFilter(option.key as typeof roleFilter)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${roleFilter === option.key
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
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
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                Con pago
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-12 text-center">
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 max-w-md mx-auto">
                                <p className="font-semibold mb-2">Error al cargar usuarios</p>
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
                            <p>Cargando usuarios...</p>
                        </div>
                    )}

                    {!error && !isLoading && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/80 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide">Usuario</th>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide">Identificación</th>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide">Ubicación</th>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide">Estado/Rol</th>
                                        <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-wide text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                                        <UserIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{user.name}</p>
                                                        <p className="text-sm text-gray-600 flex items-center gap-1"><Mail size={12} /> {user.email}</p>
                                                        {user.phone && (
                                                            <p className="text-xs text-gray-500">{user.phone}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-medium text-gray-900">{user.idType || 'N/A'}</p>
                                                <p className="text-xs text-gray-600">{user.idNumber || 'Sin número'}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-medium text-gray-900">{user.city || 'Sin ciudad'}</p>
                                                <p className="text-xs text-gray-600">{user.department || 'Sin departamento'}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600' :
                                                    user.role === 'admin_supertaxis' ? 'bg-purple-50 text-purple-600' :
                                                        user.role === 'supertaxis' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {user.role === 'admin' ? 'Admin Central' :
                                                        user.role === 'admin_supertaxis' ? 'Administrador Supertaxis' :
                                                            user.role === 'supertaxis' ? 'Supertaxis' : 'Estudiante'}
                                                </span>
                                                {user.isPro && (
                                                    <span className="ml-2 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold uppercase tracking-wide">
                                                        Pro
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openInfo(user)}
                                                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                                        title="Ver información"
                                                    >
                                                        <Info size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setCurrentUser(user); setIsModalOpen(true); }}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        disabled={user.role === 'admin'}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"
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
                    )}
                </div>
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentUser?.id ? 'Editar Usuario' : 'Nuevo Usuario'}
            >
                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="block text-sm font-normal text-gray-900 mb-2">Nombre</label>
                        <input
                            required
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                            value={currentUser?.name || ''}
                            onChange={e => setCurrentUser({ ...currentUser, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-normal text-gray-900 mb-2">Celular</label>
                        <input
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                            value={currentUser?.phone || ''}
                            onChange={e => setCurrentUser({ ...currentUser, phone: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-normal text-gray-900 mb-2">Tipo ID</label>
                            <select
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base bg-white"
                                value={currentUser?.idType || 'CC'}
                                onChange={e => setCurrentUser({ ...currentUser, idType: e.target.value })}
                            >
                                <option value="CC">Cédula</option>
                                <option value="CE">Cédula Extranjería</option>
                                <option value="TI">Tarjeta Identidad</option>
                                <option value="PAS">Pasaporte</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-normal text-gray-900 mb-2">Número ID</label>
                            <input
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                                value={currentUser?.idNumber || ''}
                                onChange={e => setCurrentUser({ ...currentUser, idNumber: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-normal text-gray-900 mb-2">Ciudad</label>
                            <input
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                                value={currentUser?.city || ''}
                                onChange={e => setCurrentUser({ ...currentUser, city: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-normal text-gray-900 mb-2">Departamento</label>
                            <input
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                                value={currentUser?.department || ''}
                                onChange={e => setCurrentUser({ ...currentUser, department: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-normal text-gray-900 mb-2">Correo</label>
                        <input
                            required type="email"
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                            value={currentUser?.email || ''}
                            onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-normal text-gray-900 mb-2">Rol</label>
                        <select
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base bg-white"
                            value={currentUser?.role || 'user'}
                            onChange={e => setCurrentUser({ ...currentUser, role: e.target.value as any })}
                        >
                            <option value="user">Usuario Estudiante</option>
                            <option value="supertaxis">Usuario Supertaxis</option>
                            <option value="admin">Administrador Central</option>
                            <option value="admin_supertaxis">Administrador Supertaxis</option>
                        </select>
                    </div>

                    {adminRole === 'admin' && (
                        <div>
                            <label className="block text-sm font-normal text-gray-900 mb-2">Etiqueta de Empresa (Opcional)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                                value={currentUser?.companyTag || ''}
                                onChange={e => setCurrentUser({ ...currentUser, companyTag: e.target.value })}
                                placeholder="ej: supertaxis"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-normal text-gray-900 mb-2">Contraseña</label>
                        <input
                            type="password"
                            required={!currentUser?.id}
                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-base"
                            placeholder={currentUser?.id ? "Dejar en blanco para no cambiar" : "••••••••"}
                            value={currentUser?.password || ''}
                            onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center gap-3 py-2">
                        <input
                            type="checkbox"
                            id="isPro"
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={currentUser?.isPro || false}
                            onChange={e => setCurrentUser({ ...currentUser, isPro: e.target.checked })}
                        />
                        <label htmlFor="isPro" className="text-sm font-medium text-gray-900 cursor-pointer">
                            Usuario Pro (Examen de 40 preguntas)
                        </label>
                    </div>
                    <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-normal mt-6 transition-all hover:scale-[1.01]">Guardar Usuario</button>
                </form>
            </Modal>

            <Modal
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="Informacion del usuario"
            >
                <div className="space-y-4 text-sm">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</p>
                        <p className="text-gray-900 font-semibold">{infoUser?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Correo</p>
                        <p className="text-gray-900 font-semibold">{infoUser?.email || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefono</p>
                        <p className="text-gray-900 font-semibold">{infoUser?.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Identificacion</p>
                        <p className="text-gray-900 font-semibold">{infoUser?.idType || 'N/A'} · {infoUser?.idNumber || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ubicacion</p>
                        <p className="text-gray-900 font-semibold">{infoUser?.city || 'N/A'}, {infoUser?.department || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rol</p>
                        <p className="text-gray-900 font-semibold">{infoUser?.role || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Politica aceptada</p>
                        <p className="text-gray-900 font-semibold">{formatDateTime(infoUser?.policyAcceptedAt)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pagos</p>
                        {isLoadingPayments && (
                            <p className="text-gray-600">Cargando pagos...</p>
                        )}
                        {!isLoadingPayments && infoPayments.length === 0 && (
                            <p className="text-gray-600">Sin pagos registrados.</p>
                        )}
                        {!isLoadingPayments && infoPayments.length > 0 && (
                            <div className="space-y-2">
                                {infoPayments.map((payment) => (
                                    <div key={payment.id} className="rounded-xl border border-gray-200 px-3 py-2.5">
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <span>{new Date(payment.createdAt).toLocaleString()}</span>
                                            <span className="font-semibold text-gray-700">{payment.status}</span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-sm">
                                            <span className="font-semibold text-gray-900">${formatCOP(payment.amountInCents)} {payment.currency}</span>
                                            <span className="text-gray-600">{payment.paymentMethodType || 'N/A'}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-600 break-all">{payment.reference}</div>
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
