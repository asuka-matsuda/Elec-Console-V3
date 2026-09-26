<script setup lang="ts">
/**
 * PanelPrintConfig
 * [Portal Organisms] 送電試験帳票の出力設定パネル。
 * 出力対象の盤選択、使用測定機器（メガ・電圧計・検相器）の指定、機器台帳モーダルの起動、
 * および帳票生成実行ボタンを提供します。
 */
import type { SelectOption } from '~/types/components'

const selectedBan = defineModel<string>('selectedBan', { default: 'ALL' })
const selectedMeggerId = defineModel<string>('selectedMeggerId', { default: '' })
const selectedVoltmeterId = defineModel<string>('selectedVoltmeterId', { default: '' })
const selectedPhaseDetectorId = defineModel<string>('selectedPhaseDetectorId', { default: '' })

defineProps<{
  hasSiteSettingExcel: boolean
  banOptions: SelectOption[]
  banCount: number
  isLoadingCircuits: boolean
  isGenerating: boolean
  meggerOptions: SelectOption[]
  voltmeterOptions: SelectOption[]
  phaseDetectorOptions: SelectOption[]
}>()

const emit = defineEmits<{
  openDevicesModal: []
  deviceSelectionChange: []
  generate: []
}>()
</script>

<template>
  <Panel class="flex flex-col gap-4">
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
        :disabled="isLoadingCircuits || banCount === 0"
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
          @click="emit('openDevicesModal')"
        >
          機器台帳
        </Button>
      </template>
    </SectionHeader>

    <FormGroup label="絶縁抵抗計 (%絶縁計_...%)">
      <Select
        v-model="selectedMeggerId"
        :options="meggerOptions"
        @update:model-value="emit('deviceSelectionChange')"
      />
    </FormGroup>

    <FormGroup label="電圧計 (%電圧計_...%)">
      <Select
        v-model="selectedVoltmeterId"
        :options="voltmeterOptions"
        @update:model-value="emit('deviceSelectionChange')"
      />
    </FormGroup>

    <FormGroup label="検相器 (%検相器_...%)">
      <Select
        v-model="selectedPhaseDetectorId"
        :options="phaseDetectorOptions"
        @update:model-value="emit('deviceSelectionChange')"
      />
    </FormGroup>

    <Divider />

    <Button
      variant="default"
      :icon="selectedBan === 'ALL' ? 'archive' : 'download'"
      block
      :loading="isGenerating"
      :disabled="!hasSiteSettingExcel || banCount === 0 || !selectedBan"
      @click="emit('generate')"
    >
      <template v-if="banCount === 0">
        対象の盤がありません
      </template>
      <template v-else-if="selectedBan === 'ALL'">
        全盤を一括ZIP出力 ({{ banCount }}盤)
      </template>
      <template v-else>
        「{{ selectedBan }}」のExcel帳票を出力
      </template>
    </Button>
  </Panel>
</template>
