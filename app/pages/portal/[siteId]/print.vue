<script setup lang="ts">
/**
 * 送電試験結果 Excel 帳票出力画面
 * /portal/:siteId/print
 *
 * @description テンプレートExcelに配置された %タグ% を検出し、選択した盤の試験結果を反映。
 * マクロ（VBA）を維持したまま、単一Excelまたは選択盤をまとめたZIP形式で出力・ダウンロードします。
 */
import { computed, onMounted, ref } from 'vue'

import { useHead, useRoute } from '#app'
import ModalMeasurementDevices from '~/components/portal/exam/ModalMeasurementDevices.vue'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import { useApi } from '~/composables/useApi'
import type { TableColumn } from '~/types/components'
import type {
  MeasurementDevice,
  SelectedMeasurementDevices,
} from '~/types/measurementDevice'
import type { CircuitItem } from '~/types/souden'
import {
  generateExamReportExcel,
  generateExamReportsZip,
  type SelectedDevicesMap,
  TAG_METADATA,
  type TagMetadataItem,
} from '~/utils/examReportExcel'

const TAG_COLUMNS: TableColumn<TagMetadataItem>[] = [
  { key: 'category', label: '分類', width: '100px' },
  { key: 'tag', label: 'タグ記法', width: '160px' },
  { key: 'description', label: '出力内容・変換ルール' },
]

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const { site, siteName } = useCurrentSite(siteId)
const { $api } = useApi()

const pageTitle = computed(() =>
  siteName.value ? `${siteName.value}_送電試験結果印刷` : '送電試験結果印刷',
)

useHead({
  title: computed(() => `${pageTitle.value} - Elec-Console`),
})

// 現場回路データ
const circuits = ref<CircuitItem[]>([])
const isLoadingCircuits = ref(false)
const circuitsError = ref<string | null>(null)

// フォーム設定：盤名称の選択
const selectedBan = ref<string>('ALL')
const isGenerating = ref(false)
const message = ref<{ type: 'success' | 'error', text: string } | null>(null)

// 測定機器プールおよび選択状態
const devices = ref<MeasurementDevice[]>([])
const selectedMeggerId = ref<string>('')
const selectedVoltmeterId = ref<string>('')
const selectedPhaseDetectorId = ref<string>('')
const isDevicesModalOpen = ref(false)

const meggerOptions = computed(() => [
  { value: '', label: '（指定なし / 未使用）' },
  ...devices.value
    .filter(d => d.category === 'megger')
    .map(d => ({
      value: d.id,
      label: `${d.maker} ${d.model}${d.serialNumber ? ` (製番: ${d.serialNumber})` : ''}${d.note ? ` - ${d.note}` : ''}`,
    })),
])

const voltmeterOptions = computed(() => [
  { value: '', label: '（指定なし / 未使用）' },
  ...devices.value
    .filter(d => d.category === 'voltmeter')
    .map(d => ({
      value: d.id,
      label: `${d.maker} ${d.model}${d.serialNumber ? ` (製番: ${d.serialNumber})` : ''}${d.note ? ` - ${d.note}` : ''}`,
    })),
])

const phaseDetectorOptions = computed(() => [
  { value: '', label: '（指定なし / 未使用）' },
  ...devices.value
    .filter(d => d.category === 'phaseDetector')
    .map(d => ({
      value: d.id,
      label: `${d.maker} ${d.model}${d.serialNumber ? ` (製番: ${d.serialNumber})` : ''}${d.note ? ` - ${d.note}` : ''}`,
    })),
])

const currentSelectedDevices = computed<SelectedMeasurementDevices>(() => ({
  meggerId: selectedMeggerId.value || undefined,
  voltmeterId: selectedVoltmeterId.value || undefined,
  phaseDetectorId: selectedPhaseDetectorId.value || undefined,
}))

const selectedDevicesMap = computed<SelectedDevicesMap>(() => ({
  megger: devices.value.find(d => d.id === selectedMeggerId.value) || null,
  voltmeter: devices.value.find(d => d.id === selectedVoltmeterId.value) || null,
  phaseDetector: devices.value.find(d => d.id === selectedPhaseDetectorId.value) || null,
}))

// 現場設定にExcelパスが登録されているか
const hasSiteSettingExcel = computed(() => Boolean(site.value?.excelPath?.trim()))

// 盤名称の一覧
const banList = computed(() => {
  const banSet = new Set<string>()

  for (const c of circuits.value) {
    if (c.banMeisho?.trim()) {
      banSet.add(c.banMeisho.trim())
    }
  }

  return Array.from(banSet).sort()
})

// 各盤の回路数マップ
const banCircuitCountMap = computed(() => {
  const map = new Map<string, number>()

  for (const c of circuits.value) {
    const ban = c.banMeisho?.trim()

    if (ban) {
      map.set(ban, (map.get(ban) || 0) + 1)
    }
  }

  return map
})

// 出力対象の選択肢（Selectコンポーネント用）
const banOptions = computed(() => [
  {
    value: 'ALL',
    label: `全盤一括出力 (${banList.value.length}盤 / ${circuits.value.length}回路)`,
  },
  ...banList.value.map(ban => ({
    value: ban,
    label: `${ban} (${banCircuitCountMap.value.get(ban) || 0}回路)`,
  })),
])

// 測定機器データの取得
const fetchMeasurementDevices = async () => {
  if (!siteId.value) return

  try {
    const res = await $api<{
      devices: MeasurementDevice[]
      selectedDeviceIds: SelectedMeasurementDevices
    }>(`/api/sites/${siteId.value}/measurement-devices`)

    devices.value = res.devices || []
    if (res.selectedDeviceIds) {
      selectedMeggerId.value = res.selectedDeviceIds.meggerId || ''
      selectedVoltmeterId.value = res.selectedDeviceIds.voltmeterId || ''
      selectedPhaseDetectorId.value = res.selectedDeviceIds.phaseDetectorId || ''
    }
  }
  catch (err) {
    console.error('Failed to fetch measurement devices:', err)
  }
}

// 測定機器選択の保存
const saveSelectedDeviceIds = async () => {
  if (!siteId.value) return

  try {
    await $api(`/api/sites/${siteId.value}/measurement-devices`, {
      method: 'PUT',
      body: {
        devices: devices.value,
        selectedDeviceIds: currentSelectedDevices.value,
      },
    })
  }
  catch (err) {
    console.error('Failed to save selected devices:', err)
  }
}

const onDeviceSelectionChange = () => {
  saveSelectedDeviceIds()
}

const onDevicesUpdated = (updatedDevices: MeasurementDevice[]) => {
  devices.value = updatedDevices
  if (selectedMeggerId.value && !updatedDevices.some(d => d.id === selectedMeggerId.value)) {
    selectedMeggerId.value = ''
  }
  if (selectedVoltmeterId.value && !updatedDevices.some(d => d.id === selectedVoltmeterId.value)) {
    selectedVoltmeterId.value = ''
  }
  if (selectedPhaseDetectorId.value && !updatedDevices.some(d => d.id === selectedPhaseDetectorId.value)) {
    selectedPhaseDetectorId.value = ''
  }
  saveSelectedDeviceIds()
}

// 回路データの取得
const fetchCircuits = async () => {
  if (!siteId.value) return
  isLoadingCircuits.value = true
  circuitsError.value = null

  try {
    const res = await $api<{ circuits: CircuitItem[] }>(`/api/sites/${siteId.value}/circuits`)

    circuits.value = res.circuits || []
    selectedBan.value = 'ALL'
  }
  catch (err: unknown) {
    const errorObj = err as Error

    circuitsError.value = errorObj.message || '回路データの取得に失敗しました'
  }
  finally {
    isLoadingCircuits.value = false
  }
}

// 帳票出力（単一またはZIP一括ダウンロード）
const handleGenerateReport = async () => {
  if (!selectedBan.value) {
    message.value = { type: 'error', text: '出力対象の盤を選択してください' }

    return
  }

  if (!hasSiteSettingExcel.value) {
    message.value = { type: 'error', text: '現場設定にExcelファイルパスが登録されていません' }

    return
  }

  isGenerating.value = true
  message.value = null

  try {
    // 現場設定のExcel生バイナリを取得
    const res = await fetch(`/api/sites/${siteId.value}/circuits/template`)

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))

      throw new Error(errorData.message || '現場設定テンプレートの取得に失敗しました')
    }

    const ext = res.headers.get('X-Excel-Extension') || ''
    const isXlsm = ext.toLowerCase() === '.xlsm'
    const templateBuffer = await res.arrayBuffer()
    const symbolSize = 28

    // 全盤一括選択の場合は ZIP でまとめて出力
    if (selectedBan.value === 'ALL') {
      const zipResult = await generateExamReportsZip({
        templateBuffer,
        banMeishoList: banList.value,
        circuits: circuits.value,
        symbolSize,
        isXlsm,
        siteName: siteName.value || '現場',
        devices: selectedDevicesMap.value,
      })

      const blob = new Blob([zipResult.buffer as unknown as BlobPart], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = zipResult.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      message.value = {
        type: 'success',
        text: `「${zipResult.filename}」を出力しました（${banList.value.length}盤 / 合計 ${zipResult.totalCircuits}件）`,
      }
    }
    else {
      // 単一盤選択の場合は単一Excelファイルを出力
      const singleBan = selectedBan.value
      const report = await generateExamReportExcel({
        templateBuffer,
        banMeisho: singleBan,
        circuits: circuits.value,
        symbolSize,
        isXlsm,
        devices: selectedDevicesMap.value,
      })

      const mimeType = isXlsm
        ? 'application/vnd.ms-excel.sheet.macroEnabled.12'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const blob = new Blob([report.buffer as unknown as BlobPart], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = report.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      message.value = {
        type: 'success',
        text: `「${report.filename}」を出力しました（対象回路: ${report.circuitsCount}件）`,
      }
    }
  }
  catch (err: unknown) {
    const errorObj = err as Error

    console.error('Report generation error:', errorObj)
    message.value = {
      type: 'error',
      text: errorObj.message || '帳票の生成に失敗しました',
    }
  }
  finally {
    isGenerating.value = false
  }
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
      <Panel class="lg:col-span-1 flex flex-col gap-4">
        <SectionHeader
          title="帳票出力設定"
          icon="sliders"
          tag="h3"
          variant="hud"
        />

        <Disclaimer
          v-if="!hasSiteSettingExcel"
          text="現場設定にExcelテンプレートが登録されていません。管理画面からExcelファイルを登録してください。"
        />

        <FormGroup label="出力対象の盤">
          <Select
            v-model="selectedBan"
            :options="banOptions"
            :disabled="isLoadingCircuits || banList.length === 0"
            placeholder="出力対象を選択..."
          />
        </FormGroup>

        <Divider />

        <SectionHeader
          title="使用測定機器の指定"
          icon="tool"
          tag="h4"
          variant="hud"
        >
          <template #actions>
            <Button
              icon="settings"
              title="機器台帳の管理"
              @click="isDevicesModalOpen = true"
            >
              機器台帳
            </Button>
          </template>
        </SectionHeader>

        <FormGroup label="絶縁抵抗計 (%絶縁計_...%)">
          <Select
            v-model="selectedMeggerId"
            :options="meggerOptions"
            @update:model-value="onDeviceSelectionChange"
          />
        </FormGroup>

        <FormGroup label="電圧計 (%電圧計_...%)">
          <Select
            v-model="selectedVoltmeterId"
            :options="voltmeterOptions"
            @update:model-value="onDeviceSelectionChange"
          />
        </FormGroup>

        <FormGroup label="検相器 (%検相器_...%)">
          <Select
            v-model="selectedPhaseDetectorId"
            :options="phaseDetectorOptions"
            @update:model-value="onDeviceSelectionChange"
          />
        </FormGroup>

        <Divider />

        <Button
          variant="default"
          :icon="selectedBan === 'ALL' ? 'archive' : 'download'"
          block
          :loading="isGenerating"
          :disabled="!hasSiteSettingExcel || banList.length === 0 || !selectedBan"
          @click="handleGenerateReport"
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
      </Panel>

      <Panel class="lg:col-span-2 flex flex-col gap-4">
        <SectionHeader
          title="Excelテンプレート タグ記述仕様"
          icon="file-text"
          tag="h3"
          variant="hud"
        />

        <Disclaimer
          text="テンプレートとなる Excel シート内のセルに以下の %タグ名% を記述してください。出力時に対象盤の全回路が下方向へ自動展開されます。"
        />

        <Table
          :columns="TAG_COLUMNS"
          :data="TAG_METADATA"
          row-key="tag"
          class="max-h-[520px]"
        >
          <template #cell-tag="{ value }">
            <Badge color="var(--color-primary)">{{ value }}</Badge>
          </template>
        </Table>
      </Panel>
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
