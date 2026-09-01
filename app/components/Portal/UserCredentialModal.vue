<script setup lang="ts">
import { printUserCredential } from '~/utils/printUserCredential'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  user: {
    lastName: string
    firstName: string
    loginId: string
    initialPassword?: string
  } | null
}>()

const handlePrint = () => {
  if (props.user) {
    printUserCredential(props.user)
  }
}

const handleCopyPassword = () => {
  if (props.user?.initialPassword) {
    navigator.clipboard.writeText(props.user.initialPassword)
    alert('初期パスワードをコピーしました。')
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="ログイン情報の発行完了"
  >
    <div class="c-user-credential-modal">
      <p class="c-user-credential-modal__desc">
        以下のログイン情報を作業員へお伝えください。<br />
        （初期パスワードはこの画面を閉じると二度と表示されません）
      </p>

      <div
        v-if="user"
        class="c-user-credential-modal__credential-box"
      >
        <AppFormGroup label="氏名">
          <div class="c-user-credential-modal__credential-value">
            {{ user.lastName }} {{ user.firstName }}
          </div>
        </AppFormGroup>
        <AppFormGroup label="ログインID">
          <div class="c-user-credential-modal__credential-value">
            {{ user.loginId }}
          </div>
        </AppFormGroup>
        <AppFormGroup label="初期パスワード">
          <div
            class="c-user-credential-modal__credential-value c-user-credential-modal__credential-value--password"
          >
            {{ user.initialPassword || "（既に設定済みです）" }}
          </div>
        </AppFormGroup>
      </div>
    </div>

    <template #footer>
      <AppButton
        variant="secondary"
        icon="document"
        @click="handleCopyPassword"
      >
        PWをコピー
      </AppButton>
      <AppButton
        variant="secondary"
        icon="document"
        @click="handlePrint"
      >
        印刷する
      </AppButton>
      <AppButton
        variant="primary"
        @click="isOpen = false"
      >
        閉じる
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.c-user-credential-modal {
  &__desc {
    @include text-desc;
  }

  &__credential-box {
    @include flex-start-stretch($direction: column);

    gap: var(--space-stack-gap);
    padding: var(--space-card-pad);
    background: transparent;
    backdrop-filter: blur(var(--blur-sm));

    @include border-base(var(--theme-accent), 20%);
  }

  &__credential-value {
    @include text-title("sm");

    padding: var(--space-control-py-md) 0;

    &--password {
      @include text-mono("lg", "bold");

      color: var(--color-status-success);
    }
  }
}
</style>
