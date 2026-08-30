import { useCookie, useState, navigateTo } from '#app';
import type { User } from '~/types/auth';

/**
 * 共通 API クライアント ($api)
 * - 全リクエストに認証トークン (Bearer & Cookie) を自動付与
 * - 401 Unauthorized 時にセッション破棄＆/login への自動リダイレクトを一元処理
 */
export const useApi = () => {
  const token = useCookie<string | null>('auth_token', { default: () => null, maxAge: 60 * 60 * 24 });
  const currentUser = useState<User | null>('currentUser', () => null);

  const $api = $fetch.create({
    onRequest({ options }) {
      if (token.value) {
        const headers = new Headers(options.headers || {});
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token.value}`);
        }
        if (!headers.has('Cookie')) {
          headers.set('Cookie', `auth_token=${token.value}`);
        }
        options.headers = headers;
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        token.value = null;
        currentUser.value = null;
        if (import.meta.client) {
          navigateTo('/login');
        }
      }
    }
  });

  return {
    $api
  };
};
