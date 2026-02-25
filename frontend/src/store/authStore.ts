import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isEventManager: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token });
      },
      logout: () => {
        set({ user: null, token: null });
      },
      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.role === 'Admin',
      isEventManager: () =>
        get().user?.role === 'Event Manager' || get().user?.role === 'Admin',
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
