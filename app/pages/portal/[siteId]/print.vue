<script setup lang="ts">
/**
 * 送電試験結果 Excel 帳票出力画面
 * /portal/:siteId/print
 *
 * @description テンプレートExcelに配置された %タグ% を検出し、選択した盤の試験結果を反映。
 * マクロ（VBA）を維持したまま、単一Excelまたは選択盤をまとめたZIP形式で出力・ダウンロードします。
 */
import { computed, onMounted } from 'vue'

import { useHead, useRoute } from '#app'
import ModalMeasurementDevices from '~/components/portal/exam/ModalMeasurementDevices.vue'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import { useExamReportPrint } from '~/composables/portal/useExamReportPrint'
import { useMeasurementDevices } from '~/composables/portal/useMeasurementDevices'
import type { TableColumn } from '~/types/components'
import {
  TAG_METADATA,
  type TagMetadataItem,
} from '~/utils/examReportExcel'

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const { site, siteName } = useCurrentSite(siteId)

const pageTitle = computed(() =>
  siteName.value ? `${siteName.value}_送電試験結果印刷` : '送電試験結果印刷',
)

useHead({
  title: computed(() => `${pageTitle.value} - Elec-Console`),
})

const TAG_COLUMNS: TableColumn<TagMetadataItem>[] = [
  { key: 'category', label: '分類', width: '100px' },
  { key: 'tag', label: 'タグ記法', width: '160px' },
  { key: 'description', label: '出力内容・変換ルール' },
]

const {
  devices,
  selectedMeggerId,
  selectedVoltmeterId,
  selectedPhaseDetectorId,
  isDevicesModalOpen,
  meggerOptions,
  voltmeterOptions,
  phaseDetectorOptions,
  currentSelectedDevices,
  selectedDevicesMap,
  fetchMeasurementDevices,
  onDeviceSelectionChange,
  onDevicesUpdated,
} = useMeasurementDevices(siteId)

const hasSiteSettingExcel = computed(() => Boolean(site.value?.excelPath?.trim()))

const {
  isLoadingCircuits,
  circuitsError,
  selectedBan,
  isGenerating,
  message,
  banList,
  banOptions,
  fetchCircuits,
  generateReport,
} = useExamReportPrint(siteId, {
  siteName,
  hasSiteSettingExcel,
})

const handleGenerate = () => {
  generateReport(selectedDevicesMap.value)
}

onMounted(() => {
  fetchCircuits()
  fetchMeasurementDevices()
})
</script>

<template>
  <div class="flex flex-col gap-section-gap h-full">
    <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
      <h2 class="flex items-center gap-item-gap">
        <Icon name="printer" class="text-primary" />
        <span>{{ pageTitle }}</span>
      </h2>
      <div class="flex items-center gap-item-gap">
        <Button
          icon="arrow-left"
          :to="`/portal/${siteId}/souden`"
        >
          送電試験へ戻る
        </Button>
      </div>
    </header>
    <hr class="divider">

    <Alert
      v-if="circuitsError"
      variant="danger"
      :text="circuitsError"
    />
    <Alert
      v-if="message"
      :variant="message.type === 'error' ? 'danger' : 'success'"
      :text="message.text"
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-panel-gap items-start">
      <form class="panel lg:col-span-1 flex flex-col gap-panel-gap" @submit.prevent="handleGenerate">
        <header class="flex items-center gap-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="sliders" class="text-primary" />
            <span>帳票出力設定</span>
          </h3>
        </header>
        <hr class="divider">

        <Alert
          v-if="!hasSiteSettingExcel"
          variant="warning"
          text="現場設定にExcelテンプレートが登録されていません。管理画面からExcelファイルを登録してください。"
        />

        <div class="flex flex-col gap-inline-gap">
          <label for="print-ban" class="label">出力対象の盤</label>
          <Select
            id="print-ban"
            v-model="selectedBan"
            :options="banOptions"
            :disabled="isLoadingCircuits || banList.length === 0"
            placeholder="出力対象を選択..."
          />
        </div>

        <hr class="divider">

        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h4 class="flex items-center gap-item-gap">
            <Icon name="wrench" class="text-primary" />
            <span>使用測定機器の指定</span>
          </h4>
          <div class="flex items-center gap-item-gap">
            <Button
              icon="settings"
              title="機器台帳の管理"
              @click="isDevicesModalOpen = true"
            >
              機器台帳
            </Button>
          </div>
        </header>
        <hr class="divider">

        <div class="flex flex-col gap-inline-gap">
          <label for="print-megger" class="label">絶縁抵抗計 (%絶縁計_...%)</label>
          <Select
            id="print-megger"
            v-model="selectedMeggerId"
            :options="meggerOptions"
            @update:model-value="onDeviceSelectionChange"
          />
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="print-voltmeter" class="label">電圧計 (%電圧計_...%)</label>
          <Select
            id="print-voltmeter"
            v-model="selectedVoltmeterId"
            :options="voltmeterOptions"
            @update:model-value="onDeviceSelectionChange"
          />
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="print-phase-detector" class="label">検相器 (%検相器_...%)</label>
          <Select
            id="print-phase-detector"
            v-model="selectedPhaseDetectorId"
            :options="phaseDetectorOptions"
            @update:model-value="onDeviceSelectionChange"
          />
        </div>

        <hr class="divider">

        <Button
          type="submit"
          :icon="selectedBan === 'ALL' ? 'archive' : 'download'"
          class="w-full"
          :loading="isGenerating"
          :disabled="!hasSiteSettingExcel || banList.length === 0 || !selectedBan"
        >
          <template v-if="banList.length === 0">
            対象の盤がありません
          </template>
          <template v-else-if="selectedBan === 'ALL'">
            全盤を一括ZIP出力 ({{ banList.length }}盤)
          </template>
          <template v-else>
            「{{ selectedBan }}」のExcel帳票を出力
          </template>
        </Button>
      </form>

      <section class="lg:col-span-2 flex flex-col gap-panel-gap min-w-0">
        <header class="flex items-center gap-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="file-text" class="text-primary" />
            <span>Excelテンプレート タグ記述仕様</span>
          </h3>
        </header>
        <hr class="divider">

        <Alert
          variant="info"
          text="テンプレートとなる Excel シート内のセルに以下の %タグ名% を記述してください。出力時に対象盤の全回路が下方向へ自動展開されます。"
        />

        <Table
          :columns="TAG_COLUMNS"
          :data="TAG_METADATA"
          row-key="tag"
          class="max-h-[520px]"
        >
          <template #cell-tag="{ value }">
            <code class="tag-code">{{ value }}</code>
          </template>
        </Table>
      </section>
    </div>

    <ModalMeasurementDevices
      v-model="isDevicesModalOpen"
      :site-id="siteId"
      :devices="devices"
      :selected-device-ids="currentSelectedDevices"
      @updated="onDevicesUpdated"
    />
  </div>
</template>

<style scoped lang="scss">
.tag-code {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}
</style>
