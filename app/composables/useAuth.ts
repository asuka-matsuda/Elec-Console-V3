import { computed } from 'vue';
import { useCookie, useState, useRouter, useFetch } from '#app';
import type { User } from '~/types/auth';

export const useAuth = () => {
  const token = useCookie<string | null>('auth_token', { default: () => null, maxAge: 60 * 60 * 24 });
  const currentUser = useState<User | null>('currentUser', () => null);
  const router = useRouter();

  const initAuth = async (force = false) => {
    if (token.value && (!currentUser.value || force)) {
      try {
        const { data, error } = await useFetch('/api/auth/me', {
          headers: {
            cookie: `auth_token=${token.value}`
          }
        });
        if (!error.value && data.value) {
          currentUser.value = (data.value as { user: import('~/types/auth').User }).user;
        } else {
          logout(); // トークンが無効な場合はログアウト
        }
      } catch (e) {
        console.error('Session restore failed');
      }
    }
  };

  const login = async (loginId: string, pass: string) => {
    try {
      const { data, error } = await useFetch('/api/auth/login', {
        method: 'POST',
        body: { loginId, password: pass }
      });

      if (error.value || !data.value) {
        return { success: false, message: 'ログインIDまたはパスワードが違います。' };
      }

      const response = data.value as { success: boolean; token: string; user: import('~/types/auth').User; mustChangePassword?: boolean };
      if (response.success) {
        token.value = response.token;
        currentUser.value = response.user;
        
        if (response.mustChangePassword) {
          return { success: true, mustChangePassword: true };
        }
        return { success: true };
      }
      
      return { success: false, message: 'ログインに失敗しました。' };
    } catch (e) {
      return { success: false, message: 'サーバー通信エラーが発生しました。' };
    }
  };

  const logout = () => {
    token.value = null;
    currentUser.value = null;
    router.push('/login');
  };

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => currentUser.value?.role === 'admin');

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    initAuth
  };
};
