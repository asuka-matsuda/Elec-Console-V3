<script setup lang="ts">
/**
 * リモコン設定表 帳票出力タブ
 * [Portal] 現場の負荷アドレス・グループ・パターン割り当てを取り込み、
 * リモコン設定表Excel（アドレス表/グループ表/パターン表）を出力します。
 */
import { computed, onMounted, ref, watch } from 'vue'

import type { MasterReportTemplateItem } from '#shared/types/reportTemplate'
import { useMasterTemplates } from '~/composables/master/useMasterTemplates'
import { useRemoteControlSetting } from '~/composables/portal/useRemoteControlSetting'
import type { SelectOption } from '~/types/components'
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

const remoteSelectedBan = ref<string>('ALL')
const remoteSelectedDenso = ref<string>('ALL')

const symbolEnabled = ref(true)
const symbolWidth = ref(41)
const symbolHeight = ref(24)

const STORAGE_KEY_SYMBOL_SETTINGS = 'elec_remote_symbol_settings'

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
  const banSuffix = remoteSelectedBan.value !== 'ALL' ? ` [${remoteSelectedBan.value}]` : ''

  return `アドレス設定表${banSuffix} を出力する`
})

watch(canExport, val => emit('update:canExport', val), { immediate: true })
watch(isExporting, val => emit('update:isExporting', val), { immediate: true })
watch(exportButtonLabel, val => emit('update:exportLabel', val), { immediate: true })

watch([symbolEnabled, symbolWidth, symbolHeight], () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(
        STORAGE_KEY_SYMBOL_SETTINGS,
        JSON.stringify({
          enabled: symbolEnabled.value,
          width: symbolWidth.value,
          height: symbolHeight.value,
        }),
      )
    }
    catch {
      // ignore
    }
  }
})

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
      exportTarget: 'address',
      selectedDenso: remoteSelectedDenso.value,
      symbolOptions: {
        enabled: symbolEnabled.value,
        width: symbolWidth.value,
        height: symbolHeight.value,
      },
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

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SYMBOL_SETTINGS)

      if (saved) {
        const parsed = JSON.parse(saved)

        if (typeof parsed.enabled === 'boolean') symbolEnabled.value = parsed.enabled
        if (typeof parsed.width === 'number') symbolWidth.value = parsed.width
        if (typeof parsed.height === 'number') symbolHeight.value = parsed.height
      }
    }
    catch {
      // ignore
    }
  }
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-panel-gap min-h-0 overflow-y-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-panel-gap items-start">
      <!-- 盤・伝送系統の絞り込み (盤ごとに収めたい場合) -->
      <section class="panel flex flex-col gap-form-row-gap">
        <header class="flex items-center gap-item-gap">
          <Icon name="filter" />
          <h4>1. 対象盤・系統の指定</h4>
        </header>
        <hr class="divider">

        <div class="flex flex-col gap-inline-gap">
          <label for="filter-remote-ban" class="label">盤で絞り込み</label>
          <Select id="filter-remote-ban" v-model="remoteSelectedBan" :options="remoteBanOptions" class="w-full" />
          <small>※特定の盤に収めて出力したい場合は、対象の盤を選択してください。</small>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="filter-remote-denso" class="label">伝送系統</label>
          <Select id="filter-remote-denso" v-model="remoteSelectedDenso" :options="remoteDensoOptions" class="w-full" />
        </div>
      </section>

      <!-- 回路記号の印字設定 (アドレス設定表用) -->
      <section class="panel flex flex-col gap-form-row-gap">
        <header class="flex items-center gap-item-gap">
          <Icon name="sliders" />
          <h4>2. 回路記号の印字設定</h4>
        </header>
        <hr class="divider">

        <div class="flex items-center justify-between">
          <Toggle id="remote-symbol-toggle" v-model="symbolEnabled" label="回路記号を印字" size="sm" />
        </div>

        <div v-if="symbolEnabled" class="flex flex-col gap-form-row-gap">
          <div class="grid grid-cols-2 gap-item-gap">
            <div class="flex flex-col gap-micro-gap">
              <label for="remote-symbol-w" class="label">横幅 (px)</label>
              <Input
                id="remote-symbol-w"
                v-model.number="symbolWidth"
                type="number"
                :min="10"
                :max="100"
                size="sm"
              />
            </div>
            <div class="flex flex-col gap-micro-gap">
              <label for="remote-symbol-h" class="label">縦幅 (px)</label>
              <Input
                id="remote-symbol-h"
                v-model.number="symbolHeight"
                type="number"
                :min="10"
                :max="100"
                size="sm"
              />
            </div>
          </div>
          <small>※回路番号セル（標準: 41×24px）の中央に背景透過で印字します。</small>
        </div>
      </section>
    </div>

    <!-- 出力サマリー -->
    <section class="panel flex flex-col gap-item-gap">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-item-gap">
          <Icon name="sliders" />
          <h4>リモコン編成サマリー</h4>
        </div>
        <small>
          出力対象負荷: <strong>{{ filteredRemoteCircuits.length }}</strong> 回路
        </small>
      </header>
      <hr class="divider">

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-item-gap">
        <div class="panel is-elevated p-panel-pad-compact flex flex-col items-center justify-center">
          <small>負荷アドレス</small>
          <h4>{{ filteredRemoteCircuits.length }} <small>件</small></h4>
        </div>
        <div class="panel is-elevated p-panel-pad-compact flex flex-col items-center justify-center">
          <small>登録グループ (Web確認用)</small>
          <h4 style="color: var(--theme-accent)">{{ Object.keys(remoteConfig.assignments).length }} <small>割当</small></h4>
        </div>
        <div class="panel is-elevated p-panel-pad-compact flex flex-col items-center justify-center">
          <small>登録パターン (Web確認用)</small>
          <h4 style="color: var(--theme-accent)">{{ Object.values(remoteConfig.assignments).filter(a => a.patterns?.length).length }} <small>割当</small></h4>
        </div>
      </div>
      <small>※Excel帳票出力は個別アドレス設定表のみ対応しています（グループ・パターン編成の設定・確認はWeb画面上で行えます）。</small>
    </section>
  </div>
</template>
