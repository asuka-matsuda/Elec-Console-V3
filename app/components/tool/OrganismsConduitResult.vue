<script setup lang="ts">
/**
 * OrganismsConduitResult
 * [Tool Organism] 配管サイズ計算の結果を視覚的に表示する3段縦積みコンポーネント。
 * 内線規程勧告（32%, 48%）およびユーザー指定占積率の結果を表示し、
 * フッターに内線規程の勧告根拠を表示します。
 */
import { computed } from 'vue'

import { CONDUIT_UI_LABELS } from '~/constants/conduitConstants'
import type { ConduitCalcResult } from '~/utils/tools/conduit/conduitCalcLogic'
import { formatConduitResult } from '~/utils/tools/conduit/conduitResultPresenter'

const props = defineProps<{
  result: ConduitCalcResult | null
  size?: 'sm' | 'md'
}>()

const vm = computed(() => formatConduitResult(props.result))
</script>

<template>
  <div
    class="flex flex-1 flex-col min-h-0 items-stretch"
    :class="[size === 'sm' ? 'gap-3 is-sm' : 'gap-panel-gap']"
  >
    <!-- Row 1: 32% (異種) -->
    <ResultBox
      :title="CONDUIT_UI_LABELS.TITLE_32"
      :status="vm.status32"
      :badge="vm.badge32"
      :size="size"
    >
      <template #value>
        <span>{{ vm.size32 }}</span>
        <small v-if="vm.fillText32">{{ vm.fillText32 }}</small>
      </template>
    </ResultBox>

    <!-- Row 2: 48% (同種) -->
    <ResultBox
      :title="CONDUIT_UI_LABELS.TITLE_48"
      :status="vm.status48"
      :badge="vm.badge48"
      :size="size"
    >
      <template #value>
        <span>{{ vm.size48 }}</span>
        <small v-if="vm.fillText48">{{ vm.fillText48 }}</small>
      </template>
    </ResultBox>

    <!-- Row 3: ユーザー指定 (customFillRate%) -->
    <ResultBox
      :title="vm.titleCustom"
      :status="vm.statusCustom"
      :badge="vm.badgeCustom"
      :size="size"
    >
      <template #value>
        <span>{{ vm.sizeCustom }}</span>
        <small v-if="vm.fillTextCustom">{{ vm.fillTextCustom }}</small>
      </template>
    </ResultBox>

    <!-- サブ情報: 内線規程（勧告）根拠 -->
    <ToolResultDetails>
      <ul class="m-0 p-0 flex flex-col gap-1 list-none">
        <li>3110-6 (32%以下): 異なる太さの絶縁電線を同一管内に収める場合（原則）</li>
        <li>3110-5 (48%以下): 同一太さで、かつ管の屈曲が少なく引き替えが容易な場合</li>
      </ul>
    </ToolResultDetails>
  </div>
</template>
