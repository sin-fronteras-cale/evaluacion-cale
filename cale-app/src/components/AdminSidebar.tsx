
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Users, BookOpen, BarChart3, LogOut, Shield } from 'lucide-react';
import { storage } from '@/lib/storage';

const menuItems = [
    { icon: <BarChart3 size={20} />, label: 'Analytics', href: '/admin' },
    { icon: <Users size={20} />, label: 'Usuarios', href: '/admin/users' },
    { icon: <BookOpen size={20} />, label: 'Preguntas', href: '/admin/questions' },
];

export const AdminSidebar = () => {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        storage.setCurrentUser(null);
        router.push('/');
    };

    return (
        <div className="w-64 bg-slate-900 h-screen sticky top-0 flex flex-col p-6 text-white shrink-0">
            <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">SF</div>
                <div>
                    <h2 className="font-bold text-lg leading-none">Admin</h2>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Sin Fronteras</p>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.href}
                        onClick={() => router.push(item.href)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${pathname === item.href ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800'
                            }`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </nav>

            <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors font-medium"
            >
                <LogOut size={20} />
                Cerrar Sesión
            </button>
        </div>
    );
};
