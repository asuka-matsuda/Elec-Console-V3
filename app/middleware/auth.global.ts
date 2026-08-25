import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth();

  const publicPages = ['/login'];
  const isPublicPage = publicPages.includes(to.path);

  if (!isAuthenticated.value && !isPublicPage) {
    return navigateTo('/login');
  }

  if (isAuthenticated.value && isPublicPage) {
    return navigateTo('/');
  }
});
