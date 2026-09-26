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
import PanelPrintConfig from '~/components/portal/PanelPrintConfig.vue'
import PanelPrintTagDoc from '~/components/portal/PanelPrintTagDoc.vue'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import { useExamReportPrint } from '~/composables/portal/useExamReportPrint'
import { useMeasurementDevices } from '~/composables/portal/useMeasurementDevices'

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const { site, siteName } = useCurrentSite(siteId)

const pageTitle = computed(() =>
  siteName.value ? `${siteName.value}_送電試験結果印刷` : '送電試験結果印刷',
)

useHead({
  title: computed(() => `${pageTitle.value} - Elec-Console`),
})

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
    <SectionHeader
      :title="pageTitle"
      icon="printer"
    >
      <template #actions>
        <Button
          icon="arrow-left"
          :to="`/portal/${siteId}/souden`"
        >
          送電試験へ戻る
        </Button>
      </template>
    </SectionHeader>

    <Disclaimer v-if="circuitsError" :text="circuitsError" />
    <Disclaimer v-if="message" :text="message.text" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-panel-gap items-start">
      <PanelPrintConfig
        v-model:selected-ban="selectedBan"
        v-model:selected-megger-id="selectedMeggerId"
        v-model:selected-voltmeter-id="selectedVoltmeterId"
        v-model:selected-phase-detector-id="selectedPhaseDetectorId"
        class="lg:col-span-1"
        :has-site-setting-excel="hasSiteSettingExcel"
        :ban-options="banOptions"
        :ban-count="banList.length"
        :is-loading-circuits="isLoadingCircuits"
        :is-generating="isGenerating"
        :megger-options="meggerOptions"
        :voltmeter-options="voltmeterOptions"
        :phase-detector-options="phaseDetectorOptions"
        @open-devices-modal="isDevicesModalOpen = true"
        @device-selection-change="onDeviceSelectionChange"
        @generate="handleGenerate"
      />

      <PanelPrintTagDoc class="lg:col-span-2" />
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
