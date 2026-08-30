<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * AppTable
 *
 * 汎用的なデータテーブル用コンポーネントです。
 * ヘッダー（th）のみglass-colorを使用し、ボディは透明。
 * 行（tr）ホバー時には発光エフェクト（ui-hover-glow）が適用されます。
 */

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

const props = defineProps<{
  columns?: TableColumn[];
  data?: T[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}>();

const emit = defineEmits<{
  (e: 'sort', payload: { key: string; order: 'asc' | 'desc' }): void;
}>();

const handleSort = (col: TableColumn) => {
  if (!col.sortable) return;
  
  let newOrder: 'asc' | 'desc' = 'asc';
  if (props.sortBy === col.key) {
    newOrder = props.sortOrder === 'asc' ? 'desc' : 'asc';
  }
  emit('sort', { key: col.key, order: newOrder });
};
</script>

<template>
  <div class="c-table-wrapper">
    <table class="c-table">
      <!-- 従来の手書き用スロットまたはcolumns propによる自動生成 -->
      <thead v-if="$slots.header || columns">
        <slot name="header">
          <tr v-if="columns">
            <th 
              v-for="col in columns" 
              :key="col.key"
              :class="{ 'is-sortable': col.sortable }"
              @click="handleSort(col)"
            >
              <div class="c-table__th-inner">
                <span>{{ col.label }}</span>
                <AppIcon 
                  v-if="col.sortable && sortBy === col.key" 
                  :name="sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'" 
                  size="sm" 
                  class="c-table__sort-icon"
                />
                <AppIcon 
                  v-else-if="col.sortable" 
                  name="minus" 
                  size="sm" 
                  class="c-table__sort-icon is-inactive"
                />
              </div>
            </th>
          </tr>
        </slot>
      </thead>

      <!-- 従来の手書き用スロットまたはdata propによる自動生成 -->
      <tbody v-if="$slots.body || (data && columns)">
        <slot name="body">
          <template v-if="data && columns">
            <tr
              v-for="(row, index) in data"
              :key="index"
            >
              <td
                v-for="col in columns"
                :key="col.key"
              >
                <slot
                  :name="`cell-${col.key}`"
                  :value="row[col.key]"
                  :row="row"
                >
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
          </template>
        </slot>
      </tbody>

      <tfoot v-if="$slots.footer">
        <slot name="footer" />
      </tfoot>
    </table>
  </div>
</template>

<style scoped lang="scss">
.c-table-wrapper {
  // --- その他 ---
  overflow: auto;

  // --- レイアウト・配置 ---
  flex: 1;

  // --- ボックスモデル ---
  width: 100%;
  min-height: 0;

  @include border-base;
}

.c-table {
  border-spacing: 0;
  border-collapse: separate;

  // --- ボックスモデル ---
  width: 100%;

  // --- タイポグラフィ ---
  text-align: left;

  // --- 疑似クラス ---
  :deep(th),
  :deep(td) {
    // --- ボックスモデル ---
    padding: var(--pad-section);
    border-bottom: var(--border-width-base) solid var(--color-border);

    // --- タイポグラフィ ---
    white-space: nowrap;
    vertical-align: middle;
  }

  :deep(td) {
    // --- タイポグラフィ ---
    font-family: var(--font-mono);
  }

  :deep(th) {
    // --- 継承 ---
    @include text-label;

    // --- レイアウト・配置 ---
    position: sticky;
    z-index: 2;
    top: 0;

    border-bottom-width: calc(var(--border-width-base) * 2);

    // --- タイポグラフィ ---
    color: var(--color-text-muted);

    // --- 視覚効果 ---
    backdrop-filter: blur(var(--blur-md));

    &.is-sortable {
      cursor: pointer;
      transition: background-color var(--transition-fast) ease;

      &:hover {
        background-color: rgb(255 255 255 / 5%); // hover効果
      }
    }

    .c-table__th-inner {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }

    .c-table__sort-icon {
      color: var(--color-text-main);

      &.is-inactive {
        color: var(--color-text-muted);
        opacity: 0.3;
      }
    }
  }

  :deep(tbody tr) {
    // --- レイアウト・配置 ---
    position: relative; /* Required for z-index and box-shadow to appear correctly on rows */

    // --- 視覚効果 ---
    @include state-base;

    // --- 疑似クラス ---
    &:last-child td {
      // --- ボックスモデル ---
      border-bottom: none;
    }

    &:hover {
      // --- レイアウト・配置 ---
      z-index: 1;

      /* テーブル行ホバー時の発光エフェクト */
      @include state-hover;

      /* 行全体を光らせるため、セルの背景を上書きさせない */

      // --- ボックスモデル ---
      outline: var(--border-width-base) solid
        theme-color(var(--color-category-main), 80%);
      outline-offset: calc(var(--border-width-base) * -1);
    }
  }
}
</style>
