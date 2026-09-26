<script setup lang="ts">
/**
 * PanelPrintTagDoc
 * [Portal Organisms] 送電試験帳票のExcelテンプレートに埋め込むタグ仕様一覧パネル。
 */
import type { TableColumn } from '~/types/components'
import {
  TAG_METADATA,
  type TagMetadataItem,
} from '~/utils/examReportExcel'

const TAG_COLUMNS: TableColumn<TagMetadataItem>[] = [
  { key: 'category', label: '分類', width: '100px' },
  { key: 'tag', label: 'タグ記法', width: '160px' },
  { key: 'description', label: '出力内容・変換ルール' },
]
</script>

<template>
  <Panel class="flex flex-col gap-panel-gap">
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
        <Badge>{{ value }}</Badge>
      </template>
    </Table>
  </Panel>
</template>
