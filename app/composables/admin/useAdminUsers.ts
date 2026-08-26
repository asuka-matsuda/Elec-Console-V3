import { useState } from '#app';
import type { User } from '~/types/auth';

export const useAdminUsers = () => {
  const users = useState<User[]>('admin-users', () => []);
  
  const fetchUsers = async () => {
    try {
      // $fetch を使用することで、キャッシュを無視して確実に再取得する
      const data = await $fetch<User[]>('/api/users');
      users.value = data;
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  const createUser = async (user: Partial<User>) => {
    try {
      const data = await $fetch<any>('/api/users', {
        method: 'POST',
        body: user
      });
      await fetchUsers();
      return data;
    } catch (e: any) {
      throw new Error(e.data?.statusMessage || 'ユーザー登録に失敗しました', { cause: e });
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    await $fetch(`/api/users/${id}`, {
      method: 'PUT',
      body: updates
    });
    await fetchUsers();
  };

  const deleteUser = async (id: string) => {
    await $fetch(`/api/users/${id}`, {
      method: 'DELETE'
    });
    await fetchUsers();
  };

  const assignSites = async (userId: string, siteIds: string[]) => {
    await updateUser(userId, { assignedSiteIds: siteIds });
  };

  const resetUserPassword = async (id: string) => {
    try {
      const data = await $fetch<any>(`/api/users/${id}/reset-password`, {
        method: 'POST'
      });
      await fetchUsers();
      return data.initialPassword;
    } catch (e: any) {
      throw new Error(e.data?.statusMessage || 'パスワード初期化に失敗しました', { cause: e });
    }
  };

  return {
    users,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    assignSites,
    resetUserPassword,
  };
};
