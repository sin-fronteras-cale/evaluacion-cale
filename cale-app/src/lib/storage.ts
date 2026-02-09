
import { Question, User, ExamResult, Category, Payment } from './data';

const STORAGE_KEYS = {
    RESULTS: 'cale_results'
};

export const storage = {
    // Initialize (No longer needed to seed here, handled by data files)
    init: () => { },

    // Auth - Now managed via HTTP-only cookies and /api/auth/me endpoint
    getCurrentUser: async (): Promise<User | null> => {
        try {
            const res = await fetch('/api/auth/me', {
                credentials: 'include' // Important for sending cookies
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.user || null;
        } catch (e) {
            console.error('Error fetching current user', e);
            return null;
        }
    },

    logout: async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.error('Error logging out', e);
        }
    },

    // Users
    getUsers: async (): Promise<User[]> => {
        const res = await fetch('/api/users', {
            credentials: 'include'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.users || data || [];
    },
    saveUser: async (user: User) => {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(user)
        });
    },
    deleteUser: async (id: string) => {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'delete', id })
        });
    },

    // Questions
    getQuestions: async (category?: Category): Promise<Question[]> => {
        const res = await fetch('/api/questions', {
            credentials: 'include'
        });
        if (!res.ok) return [];
        const questions: Question[] = await res.json();
        return category ? questions.filter(q => q.category === category) : questions;
    },
    saveQuestion: async (question: Question) => {
        await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(question)
        });
    },
    deleteQuestion: async (id: string) => {
        await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'delete', id })
        });
    },

    // Results
    getResults: async (): Promise<ExamResult[]> => {
        try {
            const res = await fetch('/api/results', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                return data.results || data || [];
            }
        } catch (e) {
            console.error('Failed to load results from API', e);
        }

        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
        return raw ? JSON.parse(raw) : [];
    },
    saveResult: async (result: ExamResult) => {
        try {
            const res = await fetch('/api/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(result)
            });
            if (res.ok) return;
        } catch (e) {
            console.error('Failed to save result to API', e);
        }

        if (typeof window === 'undefined') return;
        const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
        const existing: ExamResult[] = raw ? JSON.parse(raw) : [];
        const next = [...existing, result];
        localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(next));
    },

    // Analytics
    getTopFailedQuestions: async (limit: number = 20) => {
        const results = await storage.getResults();
        const questions = await storage.getQuestions();

        const failedCounts: Record<string, { id: string, text: string, count: number }> = {};

        results.forEach(res => {
            res.failedQuestions.forEach(f => {
                if (!failedCounts[f.questionId]) {
                    const q = questions.find(q => q.id === f.questionId);
                    failedCounts[f.questionId] = { id: f.questionId, text: q?.text || 'Privado', count: 0 };
                }
                failedCounts[f.questionId].count++;
            });
        });

        return Object.values(failedCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    },

    // Payments
    getPayments: async (userId?: string): Promise<Payment[]> => {
        try {
            const url = userId ? `/api/payments?userId=${userId}` : '/api/payments';
            const res = await fetch(url, {
                credentials: 'include'
            });
            if (res.ok) return res.json();
            return [];
        } catch (e) {
            console.error('Error fetching payments', e);
            return [];
        }
    }
};
