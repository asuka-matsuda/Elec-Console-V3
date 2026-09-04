<script setup lang="ts">
/**
 * AppRadioGroup
 * 複数の選択肢から1つを選択するための、セグメントコントロール風のラジオボタングループコンポーネント。
 */
import { computed, useId } from 'vue'

import type { RadioOption } from '~/types/components'

const model = defineModel<string | number | boolean>()

const props = defineProps<{
  options: RadioOption[]
  name?: string
}>()

const uniqueName = useId()
const groupName = computed(() => props.name || `radio-group-${uniqueName}`)
</script>

<template>
  <div class="c-segmented-control">
    <label
      v-for="option in options"
      :key="String(option.value)"
      class="c-segmented-control__item"
      :style="option.color ? { '--radio-color': option.color } : undefined"
    >
      <input
        v-model="model"
        type="radio"
        :name="groupName"
        :value="option.value"
        :disabled="option.disabled"
        class="c-segmented-control__input"
      />
      {{ option.label }}
    </label>
  </div>
</template>

<style scoped lang="scss">
.c-segmented-control {
  --radio-color: var(--theme-accent);

  @include flex-start-stretch($is-inline: true);

  flex-shrink: 0;
  gap: var(--space-0-5);
  width: max-content;
  padding: var(--space-0-5);

  @include border-base;
  @include shadow("none");

  &__input {
    pointer-events: none;

    position: absolute;

    width: 0;
    height: 0;

    opacity: 0;
  }

  &__item {
    @include click-enabled;
    @include flex-center-center($is-inline: true);
    @include text-body("md", "bold");

    position: relative;
    padding: var(--space-1) var(--space-3);
    color: var(--color-text-muted);

    @include border-base(transparent);
    @include state-base;

    &:not(:has(:disabled)) {
      &:hover:not(:has(:checked)) {
        color: var(--color-text-main);

        @include state-hover(var(--color-border));
      }

      &:has(:focus-visible) {
        @include state-focus(var(--radio-color));
        @include cyber-text-glow(var(--radio-color), 60%, var(--blur-md));
      }
    }

    &:has(:checked) {
      border-color: var(--radio-color);
      color: var(--radio-color);

      @include state-active(var(--radio-color));
      @include cyber-text-glow(var(--radio-color), 60%, var(--blur-md));
    }

    &:has(:disabled) {
      @include disabled;
    }
  }
}
</style>
