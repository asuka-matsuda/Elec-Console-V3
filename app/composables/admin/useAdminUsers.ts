/**
 * ユーザーマスター管理 Composable
 *
 * @description 全ユーザーアカウントの一覧取得・新規登録・ロール変更・パスワード初期化を管理します。
 * @returns {Object} users ユーザー一覧Ref, fetchUsers 取得関数, createUser 登録関数, updateUser 更新関数, deleteUser 削除関数, resetUserPassword 初期化関数
 */

import { useState } from '#app'
import { useApi } from '~/composables/useApi'
import type { User } from '~/types/auth'
import { type AppException, parseToAppException } from '~/utils/errors'

export const useAdminUsers = () => {
  const users = useState<User[]>('admin-users', () => [])
  const fetchError = useState<AppException | null>('admin-users-error', () => null)
  const { $api } = useApi()

  const fetchUsers = async () => {
    try {
      fetchError.value = null
      const data = await $api<User[]>('/api/users')

      users.value = data
    }
    catch (e: unknown) {
      const appErr = parseToAppException(e)

      fetchError.value = appErr
      console.error('Failed to fetch users:', appErr.getUserFacingMessage())
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
    catch (e: unknown) {
      throw parseToAppException(e)
    }
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      await $api(`/api/users/${id}`, {
        method: 'PUT',
        body: updates,
      })
      await fetchUsers()
    }
    catch (e: unknown) {
      throw parseToAppException(e)
    }
  }

  const deleteUser = async (id: string) => {
    try {
      await $api(`/api/users/${id}`, {
        method: 'DELETE',
      })
      await fetchUsers()
    }
    catch (e: unknown) {
      throw parseToAppException(e)
    }
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
    catch (e: unknown) {
      throw parseToAppException(e)
    }
  }

  return {
    users,
    fetchError,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    assignSites,
    resetUserPassword,
  }
}
