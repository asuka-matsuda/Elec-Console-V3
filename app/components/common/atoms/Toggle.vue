<script setup lang="ts">
/**
 * Toggle (Switch / Toggle Switch)
 * Geist デザインシステム準拠のトグルスイッチコンポーネント。
 * 単一の真偽値設定（ON/OFF）を即座に切り替えます。
 * - ネイティブ input[type="checkbox"] による確実な状態同期とキーボード操作性を両立
 * - Geist 準拠の 3 サイズ（sm / md / lg）およびカラーバリアント・直角デザインに対応
 */
import { computed, useId } from 'vue'

import type { ToggleProps } from '~/types/components'

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
} = defineProps<ToggleProps>()

const emit = defineEmits<{
  change: [value: boolean]
}>()

const defaultId = useId()
const toggleId = computed(() => id || defaultId)

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
  <label class="toggle inline-flex items-center gap-inline-gap" :class="[`toggle--${size}`, `toggle--${color}`, { 'is-active': model, 'is-disabled': disabled || loading, 'is-loading': loading }]" :title="title">
    <input :id="toggleId" v-model="model" type="checkbox" :name="name" :disabled="disabled || loading" class="sr-only" @change="handleChange">

    <span class="toggle-track inline-flex shrink-0 items-center">
      <span class="toggle-thumb flex items-center justify-center">
        <Icon v-if="activeIcon" :name="activeIcon" :spin="loading" class="toggle-icon" :class="{ 'toggle-loader': loading }" />
      </span>
    </span>

    <div v-if="label || description || $slots.default" class="toggle-content flex flex-col">
      <span class="toggle-label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description" class="toggle-description">
        {{ description }}
      </span>
    </div>
  </label>
</template>

<style scoped lang="scss">
.toggle {
  user-select: none;
  position: relative;

  @include state-interactive;

  &.is-disabled {
    @include state-disabled;
  }

  &--sm {
    font-size: var(--font-size-xs);

    .toggle-track {
      width: 2.25rem;
      height: 1.25rem;
    }

    .toggle-thumb {
      width: 0.95rem;
      height: 0.95rem;
    }

    &.is-active .toggle-thumb {
      transform: translateX(1rem);
    }

    .toggle-icon {
      font-size: 0.65rem;
    }
  }

  &--md {
    font-size: var(--font-size-sm);

    .toggle-track {
      width: 2.75rem;
      height: 1.5rem;
    }

    .toggle-thumb {
      width: 1.15rem;
      height: 1.15rem;
    }

    &.is-active .toggle-thumb {
      transform: translateX(1.25rem);
    }

    .toggle-icon {
      font-size: 0.75rem;
    }
  }

  &--lg {
    font-size: var(--font-size-base);

    .toggle-track {
      width: 3.25rem;
      height: 1.75rem;
    }

    .toggle-thumb {
      width: 1.35rem;
      height: 1.35rem;
    }

    &.is-active .toggle-thumb {
      transform: translateX(1.5rem);
    }

    .toggle-icon {
      font-size: 0.875rem;
    }
  }

  // --- カラーバリアント ---
  &--default {
    --toggle-accent: var(--theme-accent);
  }

  &--blue {
    --toggle-accent: var(--color-category-main);
  }

  &--amber {
    --toggle-accent: var(--color-status-warning);
  }

  &--green {
    --toggle-accent: var(--color-status-success);
  }

  &--red {
    --toggle-accent: var(--color-status-danger);
  }

  &--purple {
    --toggle-accent: var(--color-role-admin);
  }
}

.toggle-track {
  position: relative;

  width: 2.75rem;
  height: 1.5rem;
  padding: var(--space-0-5);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0;

  background-color: var(--surface-bg-sunken);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-interactive);

  .toggle.is-active & {
    border-color: var(--toggle-accent);
    background-color: color-mix(in srgb, var(--toggle-accent) 25%, var(--surface-bg-sunken));
    box-shadow: var(--shadow-glow-active);
  }

  .toggle:focus-within & {
    box-shadow: var(--shadow-glow-focus);
  }
}

.toggle-thumb {
  width: 1.15rem;
  height: 1.15rem;
  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0;

  background-color: var(--color-text-muted);

  transition: transform var(--duration-fast) var(--ease-base),
              background-color var(--duration-fast) var(--ease-base),
              border-color var(--duration-fast) var(--ease-base);

  .toggle.is-active & {
    border-color: var(--toggle-accent);
    background-color: var(--toggle-accent);
    box-shadow: var(--shadow-glow-focus);
  }
}

.toggle-icon {
  color: var(--color-main-bg);
}

.toggle-label {
  font-weight: var(--font-weight-medium);
  line-height: var(--leading-tight);
  color: var(--color-text-main);
}

.toggle-description {
  font-size: var(--font-size-xs);
  line-height: var(--leading-normal);
  color: var(--color-text-muted);
}
</style>
