<script setup lang="ts">
/**
 * 送電試験結果 帳票出力タブ
 * [Portal] 現場の送電試験進捗（Phase 1〜3）を取り込み、
 * 盤単位または全盤一括（ZIP）で公式試験成績書Excelを出力します。
 */
import { computed, onMounted, ref, watch } from 'vue'

import type { MasterReportTemplateItem } from '#shared/types/reportTemplate'
import { useMasterTemplates } from '~/composables/master/useMasterTemplates'
import { useExamReportPrint } from '~/composables/portal/useExamReportPrint'
import { useMeasurementDevices } from '~/composables/portal/useMeasurementDevices'
import type { SelectOption } from '~/types/components'
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
  selectedDevicesMap,
  fetchMeasurementDevices,
} = useMeasurementDevices(computed(() => props.siteId))

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
      <section class="panel flex flex-col gap-form-row-gap">
        <header class="flex items-center gap-item-gap">
          <Icon name="sliders" />
          <h4 class="pane-title">出力範囲の指定</h4>
        </header>
        <hr class="divider">

        <div class="flex flex-col gap-inline-gap">
          <label for="filter-exam-ban" class="label bold-label">出力対象の盤</label>
          <Select id="filter-exam-ban" v-model="selectedExamBan" :options="examBanOptions" class="w-full" />
          <small class="field-help-text">※「全盤一括出力」を選択した場合は、全盤の試験結果をまとめたZIPアーカイブが出力されます。</small>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="filter-exam-keito" class="label bold-label">対象系統の絞り込み</label>
          <Select id="filter-exam-keito" v-model="selectedExamKeiTo" :options="examKeiToOptions" class="w-full" />
          <small class="field-help-text">※幹線のみ、または二次側のみの試験結果に限定してExcelに出力できます。</small>
        </div>
      </section>

      <!-- 右ペイン: 測定器の紐付け確認 -->
      <section class="panel flex flex-col gap-form-row-gap">
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-item-gap">
            <Icon name="check-square" />
            <h4 class="pane-title">使用測定器（校正管理連携）</h4>
          </div>
          <Button size="sm" variant="tertiary" icon="settings" :to="`/portal/${siteId}`">現場設定で変更</Button>
        </header>
        <hr class="divider">

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-item-gap">
          <div class="device-card p-item-gap flex flex-col gap-0.5">
            <span class="device-label">絶縁抵抗計</span>
            <strong class="device-model">{{ selectedDevicesMap.megger?.model || '未設定' }}</strong>
            <small class="device-meta">No. {{ selectedDevicesMap.megger?.serialNumber || '-' }}</small>
          </div>

          <div class="device-card p-item-gap flex flex-col gap-0.5">
            <span class="device-label">電圧計</span>
            <strong class="device-model">{{ selectedDevicesMap.voltmeter?.model || '未設定' }}</strong>
            <small class="device-meta">No. {{ selectedDevicesMap.voltmeter?.serialNumber || '-' }}</small>
          </div>

          <div class="device-card p-item-gap flex flex-col gap-0.5">
            <span class="device-label">検相器</span>
            <strong class="device-model">{{ selectedDevicesMap.phaseDetector?.model || '未設定' }}</strong>
            <small class="device-meta">No. {{ selectedDevicesMap.phaseDetector?.serialNumber || '-' }}</small>
          </div>
        </div>
        <small class="field-help-text">※測定器データは試験結果Excelのヘッダー部へ自動的に差し込まれます。</small>
      </section>
    </div>

    <!-- 出力サマリー・対象回路プレビュー -->
    <section class="panel flex flex-col gap-item-gap">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-item-gap">
          <Icon name="database" />
          <h4 class="pane-title">出力対象サマリー</h4>
        </div>
        <span class="summary-text">
          対象盤: <strong>{{ selectedExamBan === 'ALL' ? `${examBanList.length}盤` : selectedExamBan }}</strong> /
          対象回路数: <strong>{{ examTargetCircuits.length }}</strong> 回路
        </span>
      </header>
      <hr class="divider">

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-item-gap">
        <div class="stat-box p-item-gap flex flex-col justify-between gap-inline-gap">
          <span class="stat-title">全対象回路</span>
          <div class="flex items-baseline gap-inline-gap">
            <span class="stat-value">{{ examTargetCircuits.length }}</span>
            <span class="unit-text">回路</span>
          </div>
          <div class="stat-spacer" />
        </div>

        <div class="stat-box p-item-gap flex flex-col justify-between gap-inline-gap">
          <div class="flex items-center justify-between">
            <span class="stat-title">Phase 1 確認済</span>
            <span class="unit-text">{{ examP1Count }}/{{ examTargetCircuits.length }}</span>
          </div>
          <span class="stat-value is-accent">{{ examP1Count }}</span>
          <Progress :value="examP1Count" :max="examTargetCircuits.length || 1" size="sm" dynamic-colors />
        </div>

        <div class="stat-box p-item-gap flex flex-col justify-between gap-inline-gap">
          <div class="flex items-center justify-between">
            <span class="stat-title">Phase 2 絶縁測定済</span>
            <span class="unit-text">{{ examP2Count }}/{{ examTargetCircuits.length }}</span>
          </div>
          <span class="stat-value is-accent">{{ examP2Count }}</span>
          <Progress :value="examP2Count" :max="examTargetCircuits.length || 1" size="sm" dynamic-colors />
        </div>

        <div class="stat-box p-item-gap flex flex-col justify-between gap-inline-gap">
          <div class="flex items-center justify-between">
            <span class="stat-title">Phase 3 送電完了</span>
            <span class="unit-text">{{ examP3Count }}/{{ examTargetCircuits.length }}</span>
          </div>
          <span class="stat-value is-accent">{{ examP3Count }}</span>
          <Progress :value="examP3Count" :max="examTargetCircuits.length || 1" size="sm" dynamic-colors />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.bold-label {
  font-weight: var(--font-weight-bold);
}

.pane-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

.device-card {
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg-elevated);
}

.device-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.device-model {
  font-size: var(--font-size-sm);
  color: var(--color-text-main);
}

.device-meta {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.summary-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);

  strong {
    color: var(--color-text-main);
  }
}

.stat-box {
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg-elevated);
}

.stat-title {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);

  &.is-accent {
    color: var(--theme-accent);
  }
}

.stat-spacer {
  height: 8px;
}

.unit-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
</style>
