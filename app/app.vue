<script setup lang="ts">
/**
 * アプリケーションルートコンポーネント
 *
 * テーマ（外観モード・アニメーション）の DOM 反映、および
 * アプリ全体で共有されるグローバル確認モーダルを描画・管理します。
 */
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

  <Modal
    v-model="isConfirmOpen"
    :title="confirmTitle"
    align="center"
  >
    <template #actions>
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

    <div class="py-item-gap">
      {{ confirmMessage }}
    </div>
  </Modal>
</template>
