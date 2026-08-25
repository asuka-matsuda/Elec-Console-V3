import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware(() => {
  const { isAdmin } = useAuth();
  
  if (!isAdmin.value) {
    return navigateTo('/portal');
  }
});
