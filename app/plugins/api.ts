import { defineNuxtPlugin, useCookie, useState, navigateTo } from '#app';
import type { User } from '~/types/auth';

export default defineNuxtPlugin(() => {
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
    provide: {
      api: $api
    }
  };
});
