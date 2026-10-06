<script setup lang="ts">
/**
 * Switch (Toggle)
 * Geist デザインシステム準拠のトグルスイッチコンポーネント。
 * 単一の真偽値設定（ON/OFF）を即座に切り替えます。
 * - ネイティブ input[type="checkbox"] による確実な状態同期とキーボード操作性を両立
 * - Geist 準拠の 3 サイズ（sm / md / lg）およびカラーバリアント・直角デザインに対応
 */
import { computed, useId } from 'vue'

import type { SwitchProps } from '~/types/components'

const model = defineModel<boolean>({ default: false })

const {
  id,
  name,
  label,
  description,
  size = 'md',
  color = 'default',
  disabled = false,
  loading = false,
  iconChecked,
  iconUnchecked,
  title,
} = defineProps<SwitchProps>()

const emit = defineEmits<{
  change: [value: boolean]
}>()

const defaultId = useId()
const switchId = computed(() => id || defaultId)

const activeIcon = computed(() => {
  if (loading) return 'loader'
  if (model.value && iconChecked) return iconChecked
  if (!model.value && iconUnchecked) return iconUnchecked

  return null
})

const handleChange = () => {
  emit('change', model.value)
}
</script>

<template>
  <label class="switch inline-flex items-center gap-inline-gap" :class="[`switch--${size}`, `switch--${color}`, { 'is-active': model, 'is-disabled': disabled || loading, 'is-loading': loading }]" :title="title">
    <input :id="switchId" v-model="model" type="checkbox" :name="name" :disabled="disabled || loading" class="sr-only" @change="handleChange">

    <span class="switch-track inline-flex shrink-0 items-center">
      <span class="switch-thumb flex items-center justify-center">
        <Icon v-if="activeIcon" :name="activeIcon" :spin="loading" class="switch-icon" :class="{ 'switch-loader': loading }" />
      </span>
    </span>

    <div v-if="label || description || $slots.default" class="switch-content flex flex-col">
      <span class="switch-label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description" class="switch-description">{{ description }}</span>
    </div>
  </label>
</template>

<style scoped lang="scss">
.switch {
  --switch-accent: var(--theme-accent);

  user-select: none;
  position: relative;

  @include state-interactive;

  &.is-disabled {
    @include state-disabled;
  }

  // --- Sizes ---
  &--sm {
    font-size: var(--font-size-xs);

    .switch-track {
      width: 2.25rem;
      height: 1.25rem;
    }

    .switch-thumb {
      width: 0.95rem;
      height: 0.95rem;
    }

    &.is-active .switch-thumb {
      transform: translateX(1rem);
    }

    .switch-icon {
      font-size: 0.65rem;
    }
  }

  &--md {
    font-size: var(--font-size-sm);

    .switch-track {
      width: 2.75rem;
      height: 1.5rem;
    }

    .switch-thumb {
      width: 1.15rem;
      height: 1.15rem;
    }

    &.is-active .switch-thumb {
      transform: translateX(1.25rem);
    }

    .switch-icon {
      font-size: 0.75rem;
    }
  }

  &--lg {
    font-size: var(--font-size-base);

    .switch-track {
      width: 3.25rem;
      height: 1.75rem;
    }

    .switch-thumb {
      width: 1.35rem;
      height: 1.35rem;
    }

    &.is-active .switch-thumb {
      transform: translateX(1.5rem);
    }

    .switch-icon {
      font-size: 0.85rem;
    }
  }

  // --- Color Variants ---
  &--blue {
    --switch-accent: var(--color-category-main);
  }

  &--amber {
    --switch-accent: var(--color-status-warning);
  }

  &--green {
    --switch-accent: var(--color-status-success);
  }

  &--red {
    --switch-accent: var(--color-status-danger);
  }

  &--purple {
    --switch-accent: var(--color-role-admin);
  }
}

.switch-track {
  position: relative;

  width: 2.75rem;
  height: 1.5rem;
  padding: var(--space-0-5);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0;

  background-color: var(--surface-bg-sunken);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-interactive);

  .switch.is-active & {
    border-color: var(--switch-accent);
    background-color: color-mix(in srgb, var(--switch-accent) 25%, var(--surface-bg-sunken));
    box-shadow: var(--shadow-glow-active);
  }

  .switch:focus-within & {
    box-shadow: var(--shadow-glow-focus);
  }
}

.switch-thumb {
  width: 1.15rem;
  height: 1.15rem;
  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0;

  background-color: var(--color-text-muted);

  transition: transform var(--duration-fast) var(--ease-base),
              background-color var(--duration-fast) var(--ease-base),
              border-color var(--duration-fast) var(--ease-base);

  .switch.is-active & {
    border-color: var(--switch-accent);
    background-color: var(--switch-accent);
    box-shadow: var(--shadow-glow-focus);
  }
}

.switch-icon {
  color: var(--color-main-bg);
}

.switch-label {
  font-weight: var(--font-weight-medium);
  line-height: var(--leading-tight);
  color: var(--color-text-main);
}

.switch-description {
  font-size: var(--font-size-xs);
  line-height: var(--leading-normal);
  color: var(--color-text-muted);
}
</style>
