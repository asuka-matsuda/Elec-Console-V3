<script setup lang="ts">
/**
 * タグ・線名札 Excel 帳票出力画面
 * /portal/:siteId/tag-print
 *
 * @description 取り込んだExcelデータの見出しを動的に取得し、
 * ユーザー指定のA4タグテンプレートへデータを自動差し込み出力します。
 */
import { computed, onMounted } from 'vue'

import { useHead, useRoute } from '#app'
import ExcelDropzone from '~/components/portal/admin/ExcelDropzone.vue'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import { useTagReportPrint } from '~/composables/portal/useTagReportPrint'
import type { TableColumn } from '~/types/components'
import type { DynamicTagField } from '~/utils/tagReportExcel'

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const { siteName } = useCurrentSite(siteId)

const pageTitle = computed(() =>
  siteName.value ? `${siteName.value}_タグ出力` : 'タグ・線名札出力',
)

useHead({
  title: computed(() => `${pageTitle.value} - Elec-Console`),
})

const TAG_DOC_COLUMNS: TableColumn<DynamicTagField>[] = [
  { key: 'key', label: 'Excel列見出し', width: '160px' },
  { key: 'tag', label: 'テンプレートタグ記法', width: '180px' },
  { key: 'sampleValue', label: 'データ例（プレビュー）' },
]

const {
  dynamicHeaders,
  filteredRows,
  isLoadingData,
  dataError,
  templateFile,
  selectedKeiTo,
  selectedBan,
  flowDirection,
  isGenerating,
  message,
  banOptions,
  keiToOptions,
  flowDirectionOptions,
  summary,
  fetchSiteData,
  handleTemplateFileSelect,
  generateReport,
} = useTagReportPrint(siteId, {
  siteName,
})

onMounted(() => {
  fetchSiteData()
})
</script>

<template>
  <div class="flex flex-col gap-section-gap h-full">
    <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
      <h2 class="flex items-center gap-item-gap">
        <Icon name="tag" class="text-primary" />
        <span>{{ pageTitle }}</span>
      </h2>
      <div class="flex items-center gap-item-gap">
        <Button
          icon="arrow-left"
          :to="`/portal/${siteId}`"
        >
          現場ポータルへ戻る
        </Button>
      </div>
    </header>
    <hr class="divider">

    <Alert
      v-if="dataError"
      variant="danger"
      :text="dataError"
    />
    <Alert
      v-if="message"
      :variant="message.type === 'error' ? 'danger' : 'success'"
      :text="message.text"
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-panel-gap items-start">
      <form class="panel lg:col-span-1 flex flex-col gap-panel-gap" @submit.prevent="generateReport">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="sliders" class="text-primary" />
            <span>タグ出力設定</span>
          </h3>
          <div v-if="siteId" class="flex items-center gap-item-gap">
            <Button
              icon="key"
              :to="`/portal/${siteId}/template-keys`"
              target="_blank"
            >
              出力キー一覧
            </Button>
          </div>
        </header>
        <hr class="divider">

        <div class="flex flex-col gap-inline-gap">
          <span class="label">1. タグ用フォーマット (A4テンプレートExcel)</span>
          <ExcelDropzone
            :model-value="templateFile"
            :disabled="isGenerating"
            accept=".xlsx, .xlsm"
            @update:model-value="handleTemplateFileSelect"
          />
          <small class="text-note">
            ※ご用意いただいたA4タグ枠が配置されたExcelファイル（.xlsx）を指定してください。
          </small>
        </div>

        <hr class="divider">

        <header class="flex items-center gap-item-gap">
          <h4 class="flex items-center gap-item-gap">
            <Icon name="filter" class="text-primary" />
            <span>出力対象の絞り込み</span>
          </h4>
        </header>
        <hr class="divider">

        <div class="flex flex-col gap-inline-gap">
          <label for="tag-keito" class="label">系統種別</label>
          <Select
            id="tag-keito"
            v-model="selectedKeiTo"
            :options="keiToOptions"
            :disabled="isLoadingData || isGenerating"
          />
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="tag-ban" class="label">対象の盤</label>
          <Select
            id="tag-ban"
            v-model="selectedBan"
            :options="banOptions"
            :disabled="isLoadingData || isGenerating"
            placeholder="盤を選択..."
          />
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="tag-flow-direction" class="label">タグ枠への流し込み順</label>
          <Select
            id="tag-flow-direction"
            v-model="flowDirection"
            :options="flowDirectionOptions"
            :disabled="isGenerating"
          />
          <small class="text-note">
            ※ラベルシールの面順（左から右か、上から下か）に合わせて指定します。
          </small>
        </div>

        <hr class="divider">

        <div class="flex flex-col gap-item-gap">
          <p class="summary-row flex justify-between items-center">
            <span class="text-secondary">出力対象データ:</span>
            <strong class="text-accent">{{ filteredRows.length }} 件</strong>
          </p>

          <Button
            type="submit"
            icon="printer"
            class="w-full"
            :disabled="!templateFile || filteredRows.length === 0 || isGenerating"
            :loading="isGenerating"
          >
            タグExcelを出力
          </Button>
        </div>
      </form>

      <section class="lg:col-span-2 flex flex-col gap-panel-gap min-w-0">
        <header class="flex flex-col gap-inline-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="file-spreadsheet" class="text-primary" />
            <span>動的テンプレートタグ仕様</span>
          </h3>
        </header>
        <hr class="divider">

        <Alert
          variant="info"
          text="取り込んだExcelのテーブル見出しからキーを動的生成しています。用意したA4フォーマットのセル内に以下の %タグ名% を記述してください。列を追加した場合も自動で新しいキーとして認識されます。"
        />

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-item-gap">
          <div class="summary-tile flex flex-col items-center justify-center gap-inline-gap">
            <span class="summary-tile__title">総回路数</span>
            <span class="summary-tile__value">{{ summary.total }}</span>
          </div>

          <div class="summary-tile flex flex-col items-center justify-center gap-inline-gap">
            <span class="summary-tile__title">幹線データ</span>
            <span class="summary-tile__value text-accent">{{ summary.kansen }}</span>
          </div>

          <div class="summary-tile flex flex-col items-center justify-center gap-inline-gap">
            <span class="summary-tile__title">二次側データ</span>
            <span class="summary-tile__value">{{ summary.secondary }}</span>
          </div>

          <div class="summary-tile is-target flex flex-col items-center justify-center gap-inline-gap">
            <span class="summary-tile__title">現在の出力対象</span>
            <span class="summary-tile__value text-target">{{ summary.filteredTotal }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-item-gap">
          <div class="flex items-center justify-between">
            <h4>
              利用可能な動的キー一覧 ({{ dynamicHeaders.length }}項目)
            </h4>
            <small v-if="isLoadingData" class="text-note">データ読み込み中...</small>
          </div>

          <Table
            :columns="TAG_DOC_COLUMNS"
            :data="dynamicHeaders"
            row-key="tag"
            class="max-h-[460px]"
          >
            <template #cell-tag="{ value }">
              <code class="tag-code">{{ value }}</code>
            </template>
            <template #cell-sampleValue="{ value }">
              <span class="sample-text">{{ value || '-' }}</span>
            </template>
          </Table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.text-note {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.summary-row {
  font-size: var(--font-size-sm);
}

.text-secondary {
  color: var(--color-text-muted);
}

.summary-tile {
  padding: var(--space-1) var(--space-2);
  border: var(--border-width-base) solid var(--color-border);
  background: var(--surface-bg);
  box-shadow: var(--shadow-sink);

  &.is-target {
    border-color: color-mix(in srgb, var(--color-category-main) 40%, transparent);
  }

  &__title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);
  }

  &__value {
    font-family: var(--font-mono);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
    line-height: var(--line-height-tight);
    color: var(--color-text-main);
  }
}

.text-accent {
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  color: var(--color-status-info);
}

.text-target {
  color: var(--color-category-main);
}

.tag-code {
  padding: var(--space-1) var(--space-2);
  border: var(--border-width-base) solid var(--color-border);

  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-status-info);

  background-color: var(--surface-bg-sunken);
}

.sample-text {
  overflow: hidden;

  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
