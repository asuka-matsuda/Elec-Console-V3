<script setup lang="ts">
/**
 * OrganismsMathBasisModal
 * [Tool Organism] 計算ツールの計算根拠（数式やステップ）を表示するためのモーダルコンポーネント。
 * KaTeX による数式レンダリングと凡例の2カラム表示、およびモーダル制御をすべて包括します。
 */
import 'katex/dist/katex.min.css'

import { computed, getCurrentInstance, inject, type Ref, ref } from 'vue'

import type { MathStep } from '~/types/tools'
import { renderMath } from '~/utils/math'

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
  <OrganismsModal
    v-model="activeOpen"
    :title="title || '計算根拠'"
    icon="book"
    variant="tool"
    size="lg"
  >
    <div class="flex flex-col gap-card-gap">
      <ClientOnly>
        <div v-if="steps && steps.length > 0" class="flex flex-col gap-card-gap">
          <AtomsPanel
            v-for="(step, index) in steps"
            :key="index"
            class="flex flex-col gap-3"
          >
            <MoleculesSectionHeader v-if="step.title" :title="step.title" size="sm" />
            <div class="grid grid-cols-1 items-stretch sm:grid-cols-[1fr_auto] sm:items-center gap-panel-gap">
              <!-- 左側: 計算式 -->
              <div
                class="math-expr min-w-0 overflow-x-hidden overflow-y-hidden py-1"
                v-html="renderMath(step.tex, true)"
              />

              <!-- 右側: 凡例 -->
              <ToolMoleculesMathLegend :items="step.legend" />
            </div>
          </AtomsPanel>
        </div>
      </ClientOnly>

      <div v-if="$slots.default" class="flex flex-col gap-2">
        <slot />
      </div>
    </div>

    <template #footer>
      <AtomsButton variant="secondary" size="sm" @click="handleClose">
        閉じる
      </AtomsButton>
    </template>
  </OrganismsModal>
</template>

<style scoped lang="scss">
.math-expr {
  overflow-x: hidden;
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
</style>
