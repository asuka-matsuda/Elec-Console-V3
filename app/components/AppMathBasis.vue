<script setup lang="ts">
import { computed } from 'vue'

import { renderMath } from '~/utils/mathUtils'

export type MathStep = {
  title?: string
  tex: string
  legend?: string[]
}

const props = defineProps<{
  tex: string
}>()

// 💡 改善1: computedを使って、データを事前にすべてHTML化しておく（再描画時の激重処理を回避）
const renderedTex = computed(() => renderMath(props.tex, true))
</script>

<template>
  <div class="c-math-basis">
    <div class="c-math-basis__math" v-html="renderedTex"></div>
  </div>
</template>

<style scoped lang="scss">
.c-math-basis {
  @include flex-start-stretch(column);

  gap: var(--space-card-gap);

  &__math {
    min-width: 0;

    &::-webkit-scrollbar {
      display: none;
    }

    :deep(.katex) {
      color: var(--color-text-main);

      .tex-status-success,
      .tex-status-success * {
        color: var(--color-status-success);
      }

      .tex-status-warning,
      .tex-status-warning * {
        color: var(--color-status-warning);
      }

      .tex-status-danger,
      .tex-status-danger * {
        color: var(--color-status-danger);
      }
    }

    :deep(.katex-display) {
      padding: var(--space-1) 0;
    }
  }
}
</style>
