<script setup lang="ts">
/**
 * リモコン設定表 帳票出力タブ
 * [Portal] 現場の負荷アドレス・グループ・パターン割り当てを取り込み、
 * リモコン設定表Excel（アドレス表/グループ表/パターン表）を出力します。
 */
import { computed, onMounted, ref, watch } from 'vue'

import type { RemoteExportTarget } from '#shared/types/remoteControl'
import type { MasterReportTemplateItem } from '#shared/types/reportTemplate'
import { useMasterTemplates } from '~/composables/master/useMasterTemplates'
import { useRemoteControlSetting } from '~/composables/portal/useRemoteControlSetting'
import type { RadioOption, SelectOption } from '~/types/components'
import { downloadBlob } from '~/utils/download'
import { generateRemoteReportExcel } from '~/utils/remoteReportExcel'

interface Props {
  siteId: string
  siteName: string
  template: MasterReportTemplateItem | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:canExport' | 'update:isExporting', val: boolean): void
  (e: 'update:exportLabel', val: string): void
}>()

const { fetchTemplateBuffer } = useMasterTemplates()
const toast = useToast()
const isExporting = ref(false)

// リモコンデータ管理
const {
  remoteCircuits,
  config: remoteConfig,
  banList: remoteBanList,
  densoKeiToList: remoteDensoKeiToList,
  fetchSiteRemoteData,
} = useRemoteControlSetting(computed(() => props.siteId), { siteName: computed(() => props.siteName) })

const remoteExportTarget = ref<RemoteExportTarget>('address')
const remoteSelectedBan = ref<string>('ALL')
const remoteSelectedDenso = ref<string>('ALL')

const remoteExportTargetOptions: RadioOption<RemoteExportTarget>[] = [
  { value: 'address', label: '① 負荷アドレス表' },
  { value: 'group', label: '② グループ設定表' },
  { value: 'pattern', label: '③ パターン設定表' },
]

const remoteBanOptions = computed<SelectOption[]>(() => [
  { value: 'ALL', label: `全盤対象 (${remoteCircuits.value.length}回路)` },
  ...remoteBanList.value.map(b => ({
    value: b,
    label: `${b} (${remoteCircuits.value.filter(c => c.banMeisho === b).length}回路)`,
  })),
])

const remoteDensoOptions = computed<SelectOption[]>(() => [
  { value: 'ALL', label: `全系統 (${remoteCircuits.value.length}回路)` },
  ...remoteDensoKeiToList.value.map(d => ({
    value: d,
    label: `伝送系統 ${d}`,
  })),
])

const filteredRemoteCircuits = computed(() => {
  return remoteCircuits.value.filter((c) => {
    if (remoteSelectedBan.value !== 'ALL' && c.banMeisho !== remoteSelectedBan.value) return false
    if (remoteSelectedDenso.value !== 'ALL' && c.densoKeiTo !== remoteSelectedDenso.value) return false

    return true
  })
})

const canExport = computed(() => {
  return Boolean(props.template && filteredRemoteCircuits.value.length > 0 && !isExporting.value)
})

const exportButtonLabel = computed(() => {
  const targetName = remoteExportTarget.value === 'address'
    ? 'アドレス表'
    : remoteExportTarget.value === 'group'
      ? 'グループ設定表'
      : 'パターン設定表'

  const banSuffix = remoteSelectedBan.value !== 'ALL' ? ` [${remoteSelectedBan.value}]` : ''

  return `${targetName}${banSuffix} を出力する`
})

watch(canExport, val => emit('update:canExport', val), { immediate: true })
watch(isExporting, val => emit('update:isExporting', val), { immediate: true })
watch(exportButtonLabel, val => emit('update:exportLabel', val), { immediate: true })

const exportReport = async () => {
  const tpl = props.template

  if (!tpl) return

  const targetCircuits = filteredRemoteCircuits.value

  if (targetCircuits.length === 0) {
    toast.error('出力対象となる回路が存在しません')

    return
  }

  isExporting.value = true
  try {
    const templateBuffer = await fetchTemplateBuffer(tpl.id)

    if (!templateBuffer) return

    const result = await generateRemoteReportExcel({
      templateBuffer,
      circuits: targetCircuits,
      config: remoteConfig.value,
      siteName: props.siteName,
      exportTarget: remoteExportTarget.value,
    })

    downloadBlob(
      new Blob([result.buffer as unknown as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      result.filename,
    )
    toast.success(`「${tpl.name}」を出力しました (${targetCircuits.length}回路)`)
  }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'リモコン設定表Excelの生成に失敗しました'

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
  fetchSiteRemoteData()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-panel-gap min-h-0 overflow-y-auto">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-panel-gap items-start">
      <!-- 出力種別の選択 -->
      <section class="panel flex flex-col gap-form-row-gap">
        <header class="flex items-center gap-item-gap">
          <Icon name="file-text" />
          <h4 class="pane-title">1. 出力種別の選択</h4>
        </header>
        <hr class="divider">

        <div class="flex flex-col gap-item-gap">
          <Radio
            v-for="opt in remoteExportTargetOptions"
            :key="opt.value"
            v-model="remoteExportTarget"
            :value="opt.value"
            :label="opt.label"
            name="remote-target"
          />
        </div>
        <small class="field-help-text">※現場で編成されたアドレス表、グループ設定表、またはパターン設定表から選んで出力します。</small>
      </section>

      <!-- 盤・伝送系統の絞り込み (盤ごとに収めたい場合) -->
      <section class="panel flex flex-col gap-form-row-gap">
        <header class="flex items-center gap-item-gap">
          <Icon name="filter" />
          <h4 class="pane-title">2. 対象盤・系統の指定</h4>
        </header>
        <hr class="divider">

        <div class="flex flex-col gap-inline-gap">
          <label for="filter-remote-ban" class="label bold-label">盤で絞り込み</label>
          <Select id="filter-remote-ban" v-model="remoteSelectedBan" :options="remoteBanOptions" class="w-full" />
          <small class="field-help-text">※特定の盤に収めて出力したい場合は、対象の盤を選択してください。</small>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="filter-remote-denso" class="label bold-label">伝送系統</label>
          <Select id="filter-remote-denso" v-model="remoteSelectedDenso" :options="remoteDensoOptions" class="w-full" />
        </div>
      </section>
    </div>

    <!-- 出力サマリー -->
    <section class="panel flex flex-col gap-item-gap">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-item-gap">
          <Icon name="sliders" />
          <h4 class="pane-title">リモコン編成サマリー</h4>
        </div>
        <span class="summary-text">
          出力対象負荷: <strong>{{ filteredRemoteCircuits.length }}</strong> 回路
        </span>
      </header>
      <hr class="divider">

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-item-gap">
        <div class="stat-box p-item-gap flex flex-col items-center justify-center">
          <span class="stat-title">負荷アドレス</span>
          <span class="stat-value">{{ filteredRemoteCircuits.length }} <small class="unit-text">件</small></span>
        </div>
        <div class="stat-box p-item-gap flex flex-col items-center justify-center">
          <span class="stat-title">登録グループ</span>
          <span class="stat-value is-accent">{{ Object.keys(remoteConfig.assignments).length }} <small class="unit-text">割当</small></span>
        </div>
        <div class="stat-box p-item-gap flex flex-col items-center justify-center">
          <span class="stat-title">登録パターン</span>
          <span class="stat-value is-accent">{{ Object.values(remoteConfig.assignments).filter(a => a.patterns?.length).length }} <small class="unit-text">割当</small></span>
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

.summary-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);

  strong {
    color: var(--color-text-main);
  }
}

.stat-box {
  min-height: 84px;
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

.unit-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
</style>
