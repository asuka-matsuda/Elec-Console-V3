<script setup lang="ts">
import { watchEffect } from 'vue'

import { useModal } from '~/composables/useModal'
import { useSettings } from '~/composables/useSettings'

const { themeMode, animationEnabled } = useSettings()
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
    document.documentElement.setAttribute('data-animation', animationEnabled.value ? 'on' : 'off')
  })
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <OrganismsModal
    v-model="isConfirmOpen"
    :title="confirmTitle"
    align="center"
  >
    {{ confirmMessage }}
    <template #footer>
      <Button
        @click="onConfirmCancel"
      >
        {{ confirmCancelText }}
      </Button>
      <Button
        :variant="confirmIntent"
        @click="onConfirmExecute"
      >
        {{ confirmBtnText }}
      </Button>
    </template>
  </OrganismsModal>
</template>
