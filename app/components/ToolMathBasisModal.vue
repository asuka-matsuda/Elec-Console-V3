<script setup lang="ts">
/**
 * ToolMathBasisModal
 * 計算ツールの計算根拠（数式やステップ）を表示するためのモーダルコンポーネントです。
 * KaTeX による数式レンダリングと凡例の2カラム表示、およびモーダル制御をすべて包括します。
 */
import 'katex/dist/katex.min.css'

import katex from 'katex'
import { computed, getCurrentInstance, inject, type Ref, ref } from 'vue'

export type MathStep = {
  title?: string
  tex: string
  legend?: string[]
}

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

const renderMath = (mathStr: string, isDisplay: boolean = true) => {
  if (!mathStr) return ''
  try {
    return katex.renderToString(mathStr, {
      displayMode: isDisplay,
      throwOnError: false,
      trust: true,
      strict: false,
    })
  }
  catch (e) {
    console.error('KaTeX render error:', e)

    return mathStr
  }
}

const parseLegend = (legendArray: string[] | undefined) => {
  if (!legendArray) return []

  return legendArray.map((leg) => {
    const parts = leg.split(':')
    let rawSymbol = parts[0]?.trim() || ''

    rawSymbol = rawSymbol.replace(/\\\(/g, '').replace(/\\\)/g, '').trim()
    const name = parts.slice(1).join(':')?.trim() || leg

    return {
      name,
      renderedSymbol: renderMath(rawSymbol, false),
    }
  })
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
    <div class="c-basis-content">
      <ClientOnly>
        <div v-if="steps && steps.length > 0" class="c-basis-content__list">
          <AppCard
            v-for="(step, index) in steps"
            :key="index"
            class="c-basis-content__card"
            :title="step.title"
          >
            <div class="c-math-basis">
              <!-- 左側: 計算式 -->
              <div
                class="c-math-basis__math"
                v-html="renderMath(step.tex, true)"
              />

              <!-- 右側: 凡例 -->
              <div
                v-if="step.legend && step.legend.length > 0"
                class="c-math-legend"
              >
                <h5 class="c-math-legend__title">【凡例】</h5>
                <dl class="c-math-legend__list">
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
          </AppCard>
        </div>
      </ClientOnly>

      <div v-if="$slots.default" class="c-basis-content__extra">
        <slot />
      </div>
    </div>

    <template #footer>
      <AppButton variant="secondary" size="sm" @click="handleClose">
        閉じる
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.c-basis-content {
  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);

  &__list {
    @include flex-start-stretch($direction: column);

    gap: var(--space-card-gap);
  }

  &__card {
    gap: var(--space-3);
  }

  &__extra {
    @include flex-start-stretch($direction: column);

    gap: var(--space-2);
  }
}

.c-math-basis {
  @include grid(1fr auto);

  align-items: center;

  @include mq("sm") {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  &__math {
    overflow-x: auto;
    min-width: 0;

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
}

.c-math-legend {
  @include flex-start-stretch(column);
  @include text-meta("xs", "bold");

  gap: var(--space-1);

  min-width: 180px;
  max-width: 260px;
  padding-left: var(--space-3);
  border-left: 1px solid var(--color-border);

  @include mq("sm") {
    min-width: 0;
    max-width: none;
    padding-top: var(--space-2);
    padding-left: 0;
    border-top: 1px solid var(--color-border);
    border-left: none;
  }

  &__list {
    @include grid(max-content 1fr, var(--space-1) var(--space-2));

    align-items: baseline;

    dt {
      &::after {
        content: ":";
      }

      :deep(.katex) {
        color: var(--color-text-muted);
      }
    }

    dd {
      @include text-meta("2xs", "regular");
    }
  }
}
</style>
