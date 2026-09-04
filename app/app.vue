<script setup lang="ts">
import { watchEffect } from 'vue'

import { useModal } from '~/composables/useModal'
import { useSettings } from '~/composables/useSettings'

const { themeMode } = useSettings()
const {
  isOpen: isConfirmOpen,
  title: confirmTitle,
  message: confirmMessage,
  cancelText: confirmCancelText,
  confirmText: confirmBtnText,
  intent: confirmIntent,
  handleCancel: onConfirmCancel,
  handleConfirm: onConfirmExecute,
} = useModal()

if (import.meta.client) {
  watchEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode.value)
  })
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <AppModal
    v-model="isConfirmOpen"
    :title="confirmTitle"
    align="center"
  >
    {{ confirmMessage }}
    <template #footer>
      <AppButton
        variant="secondary"
        @click="onConfirmCancel"
      >
        {{ confirmCancelText }}
      </AppButton>
      <AppButton
        :variant="confirmIntent"
        @click="onConfirmExecute"
      >
        {{ confirmBtnText }}
      </AppButton>
    </template>
  </AppModal>
</template>
