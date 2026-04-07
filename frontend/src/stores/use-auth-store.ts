import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: number;
    username: string;
    nickname: string;
    avatarUrl: string;
    role: string;
  } | null;

  setAuth: (user: AuthState['user'], accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
    set({ isAuthenticated: true, user });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    set({ isAuthenticated: false, user: null });
  },
}));
