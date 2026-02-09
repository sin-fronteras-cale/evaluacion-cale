// Client-side authentication helpers
// These functions wrap the new cookie-based auth system

import { User } from './data';

export const authClient = {
  /**
   * Login user with email and password
   * Sets HTTP-only cookie automatically
   */
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      console.log('[auth-client] Iniciando login para:', cleanEmail);
      console.log('[auth-client] Password length:', password.length);
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email: cleanEmail, password })
      });

      console.log('[auth-client] Status de respuesta:', res.status);
      console.log('[auth-client] Response headers:', Object.fromEntries(res.headers.entries()));
      
      const data = await res.json();
      console.log('[auth-client] Datos de respuesta completa:', data);

      if (!res.ok) {
        console.error('[auth-client] ❌ ERROR - Status:', res.status);
        console.error('[auth-client] ❌ ERROR - Message:', data.error);
        console.error('[auth-client] ❌ ERROR - Full response:', data);
        return { success: false, error: data?.error || 'Credenciales incorrectas' };
      }

      console.log('[auth-client] ✅ LOGIN EXITOSO');
      console.log('[auth-client] ✅ Usuario recibido:', data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('[auth-client] 💥 EXCEPCIÓN en login:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  },

  /**
   * Logout current user
   * Clears HTTP-only cookie
   */
  logout: async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      // Clear any local session tracking
      localStorage.removeItem('cale_last_active');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  /**
   * Get current authenticated user
   * Returns null if not authenticated
   */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (!res.ok) return null;

      const data = await res.json();
      return data.user || null;
    } catch (error) {
      console.error('getCurrentUser error:', error);
      return null;
    }
  },

  /**
   * Change password for authenticated user
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data?.error || 'Error al cambiar contraseña' };
      }

      return { success: true };
    } catch (error) {
      console.error('changePassword error:', error);
      return { success: false, error: 'Error al cambiar contraseña' };
    }
  },

  /**
   * Request password reset email
   */
  forgotPassword: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data?.error || 'Error al enviar correo' };
      }

      return { success: true };
    } catch (error) {
      console.error('forgotPassword error:', error);
      return { success: false, error: 'Error al enviar correo' };
    }
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data?.error || 'Error al restablecer contraseña' };
      }

      return { success: true };
    } catch (error) {
      console.error('resetPassword error:', error);
      return { success: false, error: 'Error al restablecer contraseña' };
    }
  }
};
