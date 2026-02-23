
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Users, BookOpen, BarChart3, LogOut, CreditCard, FileText, Building2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const menuItems = [
    { icon: <BarChart3 size={20} />, label: 'Analytics Global', href: '/admin' },
    { icon: <Building2 size={20} />, label: 'Dashboard Empresa', href: '/admin/company' },
    { icon: <FileText size={20} />, label: 'Resultados', href: '/admin/results' },
    { icon: <Users size={20} />, label: 'Usuarios', href: '/admin/users' },
    { icon: <BookOpen size={20} />, label: 'Realizar Evaluación', href: '/dashboard' },
    { icon: <BookOpen size={20} />, label: 'Banco de Preguntas general', href: '/admin/questions' },
    { icon: <FileText size={20} />, label: 'Evaluaciones personalizadas', href: '/admin/evaluations' },
    { icon: <CreditCard size={20} />, label: 'Pagos', href: '/admin/payments' },
];

export const AdminSidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        authClient.getCurrentUser().then(setUser);
    }, []);

    const handleLogout = async () => {
        await authClient.logout();
        router.push('/');
    };

    const isAdmin = user?.role === 'admin';
    const isCompanyAdmin = user?.role === 'admin_supertaxis';

    const filteredMenu = menuItems.filter(item => {
        if (isAdmin) return true;
        if (isCompanyAdmin) {
            return ['Analytics Global', 'Dashboard Empresa', 'Resultados', 'Usuarios', 'Realizar Evaluación', 'Evaluaciones personalizadas'].includes(item.label);
        }
        return false;
    });

    return (
        <div className="w-64 bg-gray-900 h-screen sticky top-0 flex flex-col p-6 text-white shrink-0 border-r border-gray-800">
            <div className="flex items-center gap-3 mb-12">
                <div className="relative w-11 h-11 bg-white rounded-2xl overflow-hidden shrink-0">
                    <Image src="/logo.png" alt="Logo" fill className="object-contain p-1" />
                </div>
                <div>
                    <h2 className="font-semibold text-lg leading-none">Admin</h2>
                    <p className="text-xs text-blue-400 font-medium uppercase tracking-wide mt-0.5">Sin Fronteras</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1.5">
                {filteredMenu.map((item) => (
                    <button
                        key={item.href}
                        onClick={() => router.push(item.href)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-normal ${pathname === item.href
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </nav>

            <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 transition-colors font-normal rounded-2xl hover:bg-gray-800"
            >
                <LogOut size={20} />
                Cerrar Sesión
            </button>
        </div>
    );
};
