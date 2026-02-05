
import { Question, User, ExamResult, Category } from './data';

const STORAGE_KEYS = {
    CURRENT_USER: 'cale_current_user'
};

export const storage = {
    // Initialize (No longer needed to seed here, handled by data files)
    init: () => { },

    // Auth (Session management remains in localStorage for simplicity)
    getCurrentUser: (): User | null => {
        if (typeof window === 'undefined') return null;
        const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return user ? JSON.parse(user) : null;
    },

    setCurrentUser: (user: User | null) => {
        if (typeof window === 'undefined') return;
        if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    // Users
    getUsers: async (): Promise<User[]> => {
        const res = await fetch('/api/users');
        if (!res.ok) return [];
        return res.json();
    },
    saveUser: async (user: User) => {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
    },
    deleteUser: async (id: string) => {
        await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });
    },

    // Questions
    getQuestions: async (category?: Category): Promise<Question[]> => {
        const res = await fetch('/api/questions');
        if (!res.ok) return [];
        const questions: Question[] = await res.json();
        return category ? questions.filter(q => q.category === category) : questions;
    },
    saveQuestion: async (question: Question) => {
        await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(question)
        });
    },
    deleteQuestion: async (id: string) => {
        await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id })
        });
    },

    // Results
    getResults: async (): Promise<ExamResult[]> => {
        const res = await fetch('/api/results');
        if (!res.ok) return [];
        return res.json();
    },
    saveResult: async (result: ExamResult) => {
        await fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        });
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
    }
};
