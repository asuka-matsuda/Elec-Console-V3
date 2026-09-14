import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(() => {
  const { isMaster } = useAuth()

  if (!isMaster.value) {
    return navigateTo('/')
  }
})
