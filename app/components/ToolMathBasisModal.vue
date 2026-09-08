<script setup lang="ts">
/**
 * ToolMathBasisModal
 * 計算ツールの計算根拠（数式やステップ）を表示するためのモーダルコンポーネントです。
 * KaTeX による数式レンダリングと凡例の2カラム表示、およびモーダル制御をすべて包括します。
 */
import 'katex/dist/katex.min.css'

import { computed, getCurrentInstance, inject, type Ref, ref } from 'vue'

import type { MathStep } from '~/types/tools'
import { parseLegend, renderMath } from '~/utils/math'

const modelValue = defineModel<boolean>()

defineProps<{
  steps?: MathStep[] | null
  title?: string
}>()

interface ToolBasisModalContext {
  isOpen: Ref<boolean>
  open: () => void
  close: () => void
}

const modalContext = inject<ToolBasisModalContext | null>('toolBasisModal', null)
const localOpen = ref(false)

const instance = getCurrentInstance()
const isModelBound = computed(() => {
  const vnodeProps = instance?.vnode.props

  return !!vnodeProps && ('modelValue' in vnodeProps || 'onUpdate:modelValue' in vnodeProps)
})

const activeOpen = computed({
  get: () => {
    if (isModelBound.value) return !!modelValue.value
    if (modalContext) return modalContext.isOpen.value

    return localOpen.value
  },
  set: (val: boolean) => {
    if (isModelBound.value) {
      modelValue.value = val
    }
    if (modalContext) {
      modalContext.isOpen.value = val
    }
    localOpen.value = val
  },
})

const handleClose = () => {
  if (modalContext) {
    modalContext.close()
  }
  activeOpen.value = false
}
</script>

<template>
  <AppModal
    v-model="activeOpen"
    :title="title || '計算根拠'"
    icon="book"
    variant="tool"
    size="lg"
  >
    <div class="basis-content">
      <ClientOnly>
        <div v-if="steps && steps.length > 0" class="basis-list">
          <AppPanel
            v-for="(step, index) in steps"
            :key="index"
            class="basis-item"
          >
            <AppSectionHeader v-if="step.title" :title="step.title" size="sm" />
            <div class="math-basis">
              <!-- 左側: 計算式 -->
              <div
                class="math-expr"
                v-html="renderMath(step.tex, true)"
              />

              <!-- 右側: 凡例 -->
              <div
                v-if="step.legend && step.legend.length > 0"
                class="math-legend"
              >
                <h5 class="legend-title">【凡例】</h5>
                <dl class="legend-list">
                  <template
                    v-for="v in parseLegend(step.legend)"
                    :key="v.name"
                  >
                    <dt v-html="v.renderedSymbol" />
                    <dd>{{ v.name }}</dd>
                  </template>
                </dl>
              </div>
            </div>
          </AppPanel>
        </div>
      </ClientOnly>

      <div v-if="$slots.default" class="basis-extra">
        <slot />
      </div>
    </div>

    <template #footer>
      <AtomsButton variant="secondary" size="sm" @click="handleClose">
        閉じる
      </AtomsButton>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.basis-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-card-gap);
}

.basis-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-card-gap);
}

.basis-item {
  gap: var(--space-3);
}

.basis-extra {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.math-basis {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-panel-gap);
  align-items: center;

  @include mq("sm") {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
}

.math-expr {
  overflow: auto hidden;
  min-width: 0;
  padding: var(--space-1) 0;
  outline: none;

  :deep(.katex-display) {
    margin: 0;
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

    .tex-color-accent,
    .tex-color-accent * {
      color: var(--color-accent-main);
    }
  }
}

.math-legend {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  min-width: 200px;
  max-width: 320px;
  padding-left: var(--space-3);
  border-left: 1px solid var(--color-border);

  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);

  @include mq("sm") {
    min-width: 0;
    max-width: none;
    padding-top: var(--space-2);
    padding-left: 0;
    border-top: 1px solid var(--color-border);
    border-left: none;
  }
}

.legend-title {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.legend-list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-1) var(--space-2);
  align-items: baseline;

  dt {
    white-space: nowrap;

    &::after {
      content: ":";
    }

    :deep(.katex) {
      color: var(--color-text-muted);
    }
  }

  dd {
    min-width: 0;
    font-size: var(--font-size-2xs);
    color: var(--color-text-muted);
    overflow-wrap: break-word;
  }
}
</style>
