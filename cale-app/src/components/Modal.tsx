
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 backdrop-blur-md z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 20 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md z-50 px-4"
                    >
                        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                                <button 
                                    onClick={onClose} 
                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all"
                                >
                                    <X size={20} strokeWidth={2} />
                                </button>
                            </div>
                            <div className="p-6 max-h-[75vh] overflow-y-auto">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
