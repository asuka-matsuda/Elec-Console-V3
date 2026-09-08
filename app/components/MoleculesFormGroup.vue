<script setup lang="ts">
/**
 * MoleculesFormGroup
 * [Molecules] フォームのラベル、入力項目、エラーメッセージ、ヘルプテキストをグループ化して表示するコンポーネント。
 */
interface Props {
  label?: string
  required?: boolean
  requiredLabel?: string
  error?: string
  help?: string
  forId?: string
}

withDefaults(defineProps<Props>(), {
  required: false,
  requiredLabel: 'REQUIRED',
})
</script>

<template>
  <div class="flex flex-col gap-2 w-full form-group">
    <!-- ラベル領域 -->
    <label
      v-if="label"
      :for="forId"
      class="flex items-center gap-2 select-none cursor-pointer"
    >
      <span class="inline-flex items-center gap-1 label-text">
        {{ label }}
      </span>
      <AtomsBadge
        v-if="required"
        color="var(--color-status-danger)"
      >
        {{ requiredLabel }}
      </AtomsBadge>
    </label>

    <!-- コントロール領域 -->
    <div class="flex flex-col gap-1 control">
      <slot />

      <!-- エラーメッセージ -->
      <transition name="fade-slide">
        <p v-if="error" class="error" role="alert">
          {{ error }}
        </p>
      </transition>

      <!-- ヘルプテキスト -->
      <p v-if="help && !error" class="help">
        {{ help }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-group {
  &:focus-within .label-text {
    color: var(--theme-accent);

    &::before {
      --glow-color: var(--theme-accent);

      transform: scaleY(1.2);
      box-shadow: var(--shadow-glow-sm);
    }
  }

  &:has(.error, .is-error) .label-text {
    color: var(--color-status-danger);

    &::before {
      --glow-color: var(--color-status-danger);

      background-color: var(--color-status-danger);
      box-shadow: var(--shadow-glow-sm);
    }
  }
}

.label-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
  letter-spacing: var(--tracking-wide);

  transition: var(--transition-base);

  &::before {
    content: "";

    flex-shrink: 0;

    width: var(--space-0-5);
    height: var(--font-size-xs);
    border-radius: var(--radius-sm);

    background-color: var(--theme-accent);

    transition:
      transform var(--transition-fast),
      background-color var(--transition-fast),
      box-shadow var(--transition-fast);
  }
}

.control {
  font-size: var(--font-size-sm);
}

.error {
  --glow-color: var(--color-status-danger);

  font-size: var(--font-size-2xs);
  color: var(--color-status-danger);
  text-shadow: var(--text-glow-sm);
  letter-spacing: var(--tracking-wide);
}

.help {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-wide);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-base),
    transform var(--duration-fast) var(--ease-base);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
