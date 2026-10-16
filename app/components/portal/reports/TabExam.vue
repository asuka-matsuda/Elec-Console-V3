<script setup lang="ts">
/**
 * 送電試験結果 帳票出力タブ
 * [Portal] 現場の送電試験進捗（Phase 1〜3）を取り込み、
 * 盤単位または全盤一括（ZIP）で公式試験成績書Excelを出力します。
 */
import { computed, onMounted, ref, watch } from 'vue'

import type { MeasurementDevice, MeasurementDeviceCategory } from '#shared/types/measurementDevice'
import type { MasterReportTemplateItem } from '#shared/types/reportTemplate'
import { useMasterTemplates } from '~/composables/master/useMasterTemplates'
import { useExamReportPrint } from '~/composables/portal/useExamReportPrint'
import { useMeasurementDevices } from '~/composables/portal/useMeasurementDevices'
import type { SelectOption } from '~/types/components'
import { generateUuid } from '~/utils/crypto'
import { downloadBlob } from '~/utils/download'
import { generateExamReportExcel, generateExamReportsZip } from '~/utils/examReportExcel'

interface Props {
  siteId: string
  siteName: string
  template: MasterReportTemplateItem | null
  hasSiteSettingExcel: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:canExport' | 'update:isExporting', val: boolean): void
  (e: 'update:exportLabel', val: string): void
}>()

const { fetchTemplateBuffer } = useMasterTemplates()
const toast = useToast()
const isExporting = ref(false)

// 測定器情報
const {
  devices,
  selectedMeggerId,
  selectedVoltmeterId,
  selectedPhaseDetectorId,
  isDevicesModalOpen,
  meggerOptions,
  voltmeterOptions,
  phaseDetectorOptions,
  selectedDevicesMap,
  fetchMeasurementDevices,
  onDeviceSelectionChange,
  onDevicesUpdated,
} = useMeasurementDevices(computed(() => props.siteId))

const deviceCategoryOptions: SelectOption[] = [
  { value: 'megger', label: '絶縁抵抗計' },
  { value: 'voltmeter', label: '電圧計' },
  { value: 'phaseDetector', label: '検相器' },
]

const draftDevices = ref<MeasurementDevice[]>([])

const openDevicesModal = () => {
  draftDevices.value = devices.value.map(d => ({ ...d }))
  isDevicesModalOpen.value = true
}

const addDraftDevice = (category: MeasurementDeviceCategory = 'megger') => {
  draftDevices.value.push({
    id: generateUuid(),
    category,
    maker: '',
    model: '',
    serialNumber: '',
    calibrationDate: '',
    note: '',
  })
}

const removeDraftDevice = (id: string) => {
  draftDevices.value = draftDevices.value.filter(d => d.id !== id)
}

const saveDraftDevices = () => {
  const validDevices = draftDevices.value
    .map(d => ({
      ...d,
      maker: d.maker.trim(),
      model: d.model.trim(),
      serialNumber: d.serialNumber.trim(),
      calibrationDate: (d.calibrationDate || '').trim(),
      note: (d.note || '').trim(),
    }))
    .filter(d => d.maker || d.model || d.serialNumber)

  onDevicesUpdated(validDevices)
  isDevicesModalOpen.value = false
  toast.success('使用測定器台帳を保存しました')
}

// 送電試験回路データ
const {
  circuits: examCircuits,
  fetchCircuits: fetchExamCircuits,
} = useExamReportPrint(
  computed(() => props.siteId),
  {
    siteName: computed(() => props.siteName),
    hasSiteSettingExcel: computed(() => props.hasSiteSettingExcel),
  },
)

const selectedExamBan = ref<string>('ALL')
const selectedExamKeiTo = ref<'ALL' | '幹線' | '二次'>('ALL')

const examKeiToOptions: SelectOption[] = [
  { value: 'ALL', label: 'すべての系統（全回路）' },
  { value: '幹線', label: '幹線のみ' },
  { value: '二次', label: '二次側のみ' },
]

const examFilteredCircuits = computed(() => {
  return examCircuits.value.filter((c) => {
    if (selectedExamKeiTo.value === 'ALL') return true
    if (selectedExamKeiTo.value === '幹線') return c.keiTo?.includes('幹線')

    return !c.keiTo?.includes('幹線')
  })
})

const examBanList = computed(() => {
  const set = new Set<string>()

  for (const c of examFilteredCircuits.value) {
    if (c.banMeisho?.trim()) {
      set.add(c.banMeisho.trim())
    }
  }

  return Array.from(set).sort()
})

const examBanOptions = computed<SelectOption[]>(() => [
  {
    value: 'ALL',
    label: `全盤一括出力 (ZIP) - 全${examBanList.value.length}盤 / ${examFilteredCircuits.value.length}回路`,
  },
  ...examBanList.value.map(ban => ({
    value: ban,
    label: `${ban} (${examFilteredCircuits.value.filter(c => c.banMeisho === ban).length}回路)`,
  })),
])

const examTargetCircuits = computed(() => {
  return selectedExamBan.value === 'ALL'
    ? examFilteredCircuits.value
    : examFilteredCircuits.value.filter(c => c.banMeisho === selectedExamBan.value)
})

const examP1Count = computed(() => examTargetCircuits.value.filter(c => c.p1ConfirmedAt).length)
const examP2Count = computed(() => examTargetCircuits.value.filter(c => c.p2ConfirmedAt).length)
const examP3Count = computed(() => examTargetCircuits.value.filter(c => c.p3ConfirmedAt).length)

const canExport = computed(() => {
  return Boolean(props.template && examTargetCircuits.value.length > 0 && !isExporting.value)
})

const exportButtonLabel = computed(() => {
  if (selectedExamBan.value === 'ALL') {
    return `全${examBanList.value.length}盤の試験結果をZIP出力する`
  }

  return `「${selectedExamBan.value}」の試験結果を出力する`
})

watch(canExport, val => emit('update:canExport', val), { immediate: true })
watch(isExporting, val => emit('update:isExporting', val), { immediate: true })
watch(exportButtonLabel, val => emit('update:exportLabel', val), { immediate: true })

const exportReport = async () => {
  const tpl = props.template

  if (!tpl) return

  isExporting.value = true
  try {
    const templateBuffer = await fetchTemplateBuffer(tpl.id)

    if (!templateBuffer) return

    const isXlsm = tpl.file.filename.toLowerCase().endsWith('.xlsm')

    if (selectedExamBan.value === 'ALL') {
      if (examBanList.value.length === 0) {
        toast.error('対象となる盤が存在しません')

        return
      }

      const result = await generateExamReportsZip({
        templateBuffer,
        banMeishoList: examBanList.value,
        circuits: examFilteredCircuits.value,
        symbolSize: 28,
        isXlsm,
        siteName: props.siteName,
        devices: selectedDevicesMap.value,
      })

      downloadBlob(
        new Blob([result.buffer as unknown as BlobPart], {
          type: 'application/zip',
        }),
        result.filename,
      )
      toast.success(`「${tpl.name}」を出力しました (${examBanList.value.length}盤一括ZIP)`)
    }
    else {
      const result = await generateExamReportExcel({
        templateBuffer,
        banMeisho: selectedExamBan.value,
        circuits: examFilteredCircuits.value,
        symbolSize: 28,
        isXlsm,
        devices: selectedDevicesMap.value,
      })

      downloadBlob(
        new Blob([result.buffer as unknown as BlobPart], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        result.filename,
      )
      toast.success(`「${tpl.name}」(${selectedExamBan.value}) を出力しました`)
    }
  }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '送電試験結果Excelの生成に失敗しました'

    toast.error(msg)
  }
  finally {
    isExporting.value = false
  }
}

defineExpose({
  exportReport,
  canExport,
  exportButtonLabel,
})

onMounted(() => {
  fetchExamCircuits()
  fetchMeasurementDevices()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-panel-gap min-h-0 overflow-y-auto">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-panel-gap items-start">
      <!-- 左ペイン: 出力範囲・系統指定 -->
      <section class="panel flex flex-col gap-panel-gap">
        <header class="flex items-center gap-item-gap">
          <Icon name="sliders" />
          <h4>出力範囲の指定</h4>
        </header>
        <hr class="divider">

        <div class="flex flex-col gap-form-row-gap">
          <div class="flex flex-col gap-inline-gap">
            <label for="filter-exam-ban" class="label">出力対象の盤</label>
            <Select id="filter-exam-ban" v-model="selectedExamBan" :options="examBanOptions" class="w-full" />
            <small>※「全盤一括出力」を選択した場合は、全盤の試験結果をまとめたZIPアーカイブが出力されます。</small>
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="filter-exam-keito" class="label">対象系統の絞り込み</label>
            <Select id="filter-exam-keito" v-model="selectedExamKeiTo" :options="examKeiToOptions" class="w-full" />
            <small>※幹線のみ、または二次側のみの試験結果に限定してExcelに出力できます。</small>
          </div>
        </div>
      </section>

      <!-- 右ペイン: 測定器の紐付け・登録 -->
      <section class="panel flex flex-col gap-panel-gap">
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-item-gap">
            <Icon name="check-square" />
            <h4>使用測定器（校正管理連携）</h4>
          </div>
          <Button size="sm" variant="secondary" icon="settings" @click="openDevicesModal">測定器台帳を登録・編集</Button>
        </header>
        <hr class="divider">

        <div class="flex flex-col gap-form-row-gap">
          <div class="flex flex-col gap-inline-gap">
            <label for="select-device-megger" class="label">絶縁抵抗計</label>
            <Select id="select-device-megger" v-model="selectedMeggerId" :options="meggerOptions" @update:model-value="onDeviceSelectionChange" />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="select-device-voltmeter" class="label">電圧計</label>
            <Select id="select-device-voltmeter" v-model="selectedVoltmeterId" :options="voltmeterOptions" @update:model-value="onDeviceSelectionChange" />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="select-device-phase" class="label">検相器</label>
            <Select id="select-device-phase" v-model="selectedPhaseDetectorId" :options="phaseDetectorOptions" @update:model-value="onDeviceSelectionChange" />
          </div>
        </div>
        <small>※測定器データは試験結果Excelのヘッダー部へ自動的に差し込まれます。</small>
      </section>
    </div>

    <!-- 出力サマリー・対象回路プレビュー -->
    <section class="panel flex flex-col gap-panel-gap">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-item-gap">
          <Icon name="database" />
          <h4>出力対象サマリー</h4>
        </div>
        <small>
          対象盤: <strong>{{ selectedExamBan === 'ALL' ? `${examBanList.length}盤` : selectedExamBan }}</strong> /
          対象回路数: <strong>{{ examTargetCircuits.length }}</strong> 回路
        </small>
      </header>
      <hr class="divider">

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-item-gap">
        <div class="result-tile is-sm flex flex-col justify-between gap-inline-gap">
          <header class="tile-header flex items-center justify-between">
            <span>全対象回路</span>
          </header>
          <output class="tile-value flex items-baseline gap-inline-gap">
            <span>{{ examTargetCircuits.length }}</span>
            <span class="value-unit">回路</span>
          </output>
        </div>

        <div class="result-tile is-sm flex flex-col justify-between gap-inline-gap">
          <header class="tile-header flex items-center justify-between">
            <span>Phase 1 確認済</span>
            <small>{{ examP1Count }}/{{ examTargetCircuits.length }}</small>
          </header>
          <output class="tile-value flex items-baseline gap-inline-gap">
            <span>{{ examP1Count }}</span>
            <span class="value-unit">回路</span>
          </output>
          <Progress :value="examP1Count" :max="examTargetCircuits.length || 1" size="sm" dynamic-colors />
        </div>

        <div class="result-tile is-sm flex flex-col justify-between gap-inline-gap">
          <header class="tile-header flex items-center justify-between">
            <span>Phase 2 絶縁測定済</span>
            <small>{{ examP2Count }}/{{ examTargetCircuits.length }}</small>
          </header>
          <output class="tile-value flex items-baseline gap-inline-gap">
            <span>{{ examP2Count }}</span>
            <span class="value-unit">回路</span>
          </output>
          <Progress :value="examP2Count" :max="examTargetCircuits.length || 1" size="sm" dynamic-colors />
        </div>

        <div class="result-tile is-sm flex flex-col justify-between gap-inline-gap">
          <header class="tile-header flex items-center justify-between">
            <span>Phase 3 送電完了</span>
            <small>{{ examP3Count }}/{{ examTargetCircuits.length }}</small>
          </header>
          <output class="tile-value flex items-baseline gap-inline-gap">
            <span>{{ examP3Count }}</span>
            <span class="value-unit">回路</span>
          </output>
          <Progress :value="examP3Count" :max="examTargetCircuits.length || 1" size="sm" dynamic-colors />
        </div>
      </div>
    </section>

    <!-- 測定器台帳 登録・編集モーダル -->
    <Modal v-model="isDevicesModalOpen" title="使用測定器台帳の登録・編集" icon="settings" size="lg">
      <div class="flex flex-col gap-item-gap">
        <div class="flex items-center justify-between">
          <small>現場で使用する絶縁抵抗計・電圧計・検相器を登録します。</small>
          <Button size="sm" variant="secondary" icon="plus" @click="addDraftDevice()">測定器を追加</Button>
        </div>

        <EmptyState v-if="draftDevices.length === 0" icon="sliders" title="登録されている測定器はありません" description="「測定器を追加」ボタンから現場で使用する計器を登録してください。" />

        <ul v-else class="flex flex-col gap-item-gap max-h-[420px] overflow-y-auto">
          <li v-for="dev in draftDevices" :key="dev.id" class="panel is-sunken p-panel-pad-compact flex flex-col gap-inline-gap">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-inline-gap">
              <div class="flex flex-col gap-micro-gap">
                <label :for="`dev-cat-${dev.id}`" class="label">種別</label>
                <Select :id="`dev-cat-${dev.id}`" v-model="dev.category" :options="deviceCategoryOptions" size="sm" />
              </div>
              <div class="flex flex-col gap-micro-gap">
                <label :for="`dev-maker-${dev.id}`" class="label">メーカー</label>
                <Input :id="`dev-maker-${dev.id}`" v-model="dev.maker" placeholder="例: 日置電機" size="sm" />
              </div>
              <div class="flex flex-col gap-micro-gap">
                <label :for="`dev-model-${dev.id}`" class="label">型式・モデル</label>
                <Input :id="`dev-model-${dev.id}`" v-model="dev.model" placeholder="例: IR4052" size="sm" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-inline-gap items-end">
              <div class="flex flex-col gap-micro-gap">
                <label :for="`dev-sn-${dev.id}`" class="label">製造番号 (No.)</label>
                <Input :id="`dev-sn-${dev.id}`" v-model="dev.serialNumber" placeholder="例: 12345678" size="sm" />
              </div>
              <div class="flex flex-col gap-micro-gap">
                <label :for="`dev-cal-${dev.id}`" class="label">校正年月・有効期限</label>
                <Input :id="`dev-cal-${dev.id}`" v-model="dev.calibrationDate" placeholder="例: 2026/04" size="sm" />
              </div>
              <Button variant="danger" size="sm" icon="trash-2" @click="removeDraftDevice(dev.id)">削除</Button>
            </div>
          </li>
        </ul>
      </div>

      <template #footer>
        <Button variant="secondary" @click="isDevicesModalOpen = false">キャンセル</Button>
        <Button variant="primary" icon="save" @click="saveDraftDevices">台帳を保存する</Button>
      </template>
    </Modal>
  </div>
</template>
