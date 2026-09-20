import { useState } from '#app'
import { useApi } from '~/composables/useApi'
import type { User } from '~/types/auth'

export const useAdminUsers = () => {
  const users = useState<User[]>('admin-users', () => [])
  const { $api } = useApi()

  const fetchUsers = async () => {
    try {
      const data = await $api<User[]>('/api/users')

      users.value = data
    }
    catch (e) {
      console.error('Failed to fetch users:', e)
    }
  }

  const createUser = async (user: Partial<User>) => {
    try {
      const data = await $api<User & { initialPassword?: string }>(
        '/api/users',
        {
          method: 'POST',
          body: user,
        },
      )

      await fetchUsers()

      return data
    }
    catch (_e: unknown) {
      const err = _e as { data?: { message?: string, statusMessage?: string }, message?: string }
      const errMsg = err.data?.message || err.data?.statusMessage || err.message || 'ユーザー登録に失敗しました'

      throw new Error(errMsg, { cause: _e })
    }
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    await $api(`/api/users/${id}`, {
      method: 'PUT',
      body: updates,
    })
    await fetchUsers()
  }

  const deleteUser = async (id: string) => {
    await $api(`/api/users/${id}`, {
      method: 'DELETE',
    })
    await fetchUsers()
  }

  const assignSites = async (userId: string, siteIds: string[]) => {
    await updateUser(userId, { assignedSiteIds: siteIds })
  }

  const resetUserPassword = async (id: string) => {
    try {
      const data = await $api<{ success: boolean, initialPassword?: string }>(
        `/api/users/${id}/reset-password`,
        {
          method: 'POST',
        },
      )

      await fetchUsers()

      return data.initialPassword
    }
    catch (_e: unknown) {
      const err = _e as { data?: { message?: string, statusMessage?: string }, message?: string }
      const errMsg = err.data?.message || err.data?.statusMessage || err.message || 'パスワード初期化に失敗しました'

      throw new Error(errMsg, { cause: _e })
    }
  }

  return {
    users,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    assignSites,
    resetUserPassword,
  }
}
