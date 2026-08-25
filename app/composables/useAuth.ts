import { computed } from 'vue';
import { useCookie, useState, useRouter } from '#app';
import type { User } from '~/types/auth';

export const useAuth = () => {
  const token = useCookie<string | null>('auth_token', { default: () => null, maxAge: 60 * 60 * 24 });
  const currentUser = useState<User | null>('currentUser', () => null);
  const router = useRouter();

  const initAuth = () => {
    if (token.value === 'dummy-admin-token') {
      currentUser.value = { id: '1', name: 'システム管理者', role: 'admin' };
    } else if (token.value === 'dummy-worker-token') {
      currentUser.value = { id: '2', name: '一般作業員', role: 'worker' };
    }
  };

  const login = async (id: string, pass: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (id === 'admin' && pass === 'admin') {
      token.value = 'dummy-admin-token';
      currentUser.value = { id: '1', name: 'システム管理者', role: 'admin' };
      return { success: true };
    } else if (id === 'worker' && pass === 'worker') {
      token.value = 'dummy-worker-token';
      currentUser.value = { id: '2', name: '一般作業員', role: 'worker' };
      return { success: true };
    }
    
    return { success: false, message: 'IDまたはパスワードが違います' };
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
