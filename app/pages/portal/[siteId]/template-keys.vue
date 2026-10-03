<script setup lang="ts">
/**
 * テンプレート置換キー一覧ページ
 * /portal/:siteId/template-keys
 *
 * @description システム全体のExcelテンプレート（タグ出力、リモコン設定表、試験成績書等）で
 * 使用可能な %キー名% のマスター仕様一覧およびワンクリックコピーを提供します。
 */
import { computed, ref } from 'vue'

import { useHead, useRoute } from '#app'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import {
  TEMPLATE_KEY_CATEGORIES,
  TEMPLATE_KEYS,
  type TemplateKeyCategory,
  type TemplateKeyDefinition,
} from '~/constants/templateKeys'
import type { TableColumn, TabOption } from '~/types/components'

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const { siteName } = useCurrentSite(siteId)

const pageTitle = computed(() =>
  siteName.value ? `${siteName.value}_テンプレートキー一覧` : 'テンプレートキー一覧',
)

useHead({
  title: computed(() => `${pageTitle.value} - Elec-Console`),
})

const searchQuery = ref('')
const selectedCategory = ref<TemplateKeyCategory | 'ALL'>('ALL')
const copiedKey = ref<string | null>(null)

const categoryTabs = computed<TabOption<TemplateKeyCategory | 'ALL'>[]>(() => [
  { label: 'すべてのキー', value: 'ALL', icon: 'list', badge: TEMPLATE_KEYS.length },
  ...TEMPLATE_KEY_CATEGORIES.map(c => ({
    label: c.label,
    value: c.id,
    icon: c.icon,
    badge: TEMPLATE_KEYS.filter(k => k.category === c.id).length,
  })),
])

const filteredKeys = computed(() => {
  return TEMPLATE_KEYS.filter((k) => {
    if (selectedCategory.value !== 'ALL' && k.category !== selectedCategory.value) {
      return false
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const match
        = k.primaryKey.toLowerCase().includes(q)
          || k.tag.toLowerCase().includes(q)
          || k.label.toLowerCase().includes(q)
          || k.description.toLowerCase().includes(q)
          || k.aliases.some(a => a.toLowerCase().includes(q))

      if (!match) return false
    }

    return true
  })
})

const columns: TableColumn<TemplateKeyDefinition>[] = [
  { key: 'tag', label: '代表タグ表記', width: '180px' },
  { key: 'label', label: '項目名', width: '200px' },
  { key: 'description', label: '説明・用途' },
  { key: 'aliases', label: '利用可能な別名 (互換)', width: '220px' },
  { key: 'sampleValue', label: 'データ例', width: '160px' },
  { key: 'actions', label: '', width: '100px', align: 'center' },
]

const copyTag = async (tag: string) => {
  try {
    await navigator.clipboard.writeText(tag)
    copiedKey.value = tag
    setTimeout(() => {
      if (copiedKey.value === tag) {
        copiedKey.value = null
      }
    }, 2000)
  }
  catch (err) {
    console.warn('Clipboard copy failed', err)
  }
}
</script>

<template>
  <div class="flex flex-col gap-section-gap h-full">
    <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
      <h2 class="flex items-center gap-item-gap">
        <Icon name="key" class="text-primary" />
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

    <section class="panel flex flex-col gap-panel-gap">
      <header class="flex items-center gap-item-gap">
        <h3 class="flex items-center gap-item-gap">
          <Icon name="info" class="text-primary" />
          <span>テンプレートExcel作成ガイド</span>
        </h3>
      </header>
      <hr class="divider">

      <ol class="grid grid-cols-1 md:grid-cols-3 gap-item-gap">
        <li class="guide-box p-item-gap flex flex-col gap-inline-gap">
          <strong class="guide-title text-accent">1. 自由なセル配置</strong>
          <p class="guide-desc">
            用意したExcelテンプレート内の任意のセルに、以下の <code>%キー名%</code> を入力するだけで、出力時に回路台帳の値へ自動置換されます。
          </p>
        </li>

        <li class="guide-box p-item-gap flex flex-col gap-inline-gap">
          <strong class="guide-title text-accent">2. 全角・半角どちらもOK</strong>
          <p class="guide-desc">
            <code>%回路名称%</code> でも <code>％回路名称％</code> でも自動で同一キーとして認識されます。別名（エイリアス）もすべてサポートしています。
          </p>
        </li>

        <li class="guide-box p-item-gap flex flex-col gap-inline-gap">
          <strong class="guide-title text-accent">3. 全帳票で統一</strong>
          <p class="guide-desc">
            タグ・線名札出力、リモコン設定表、試験成績書など、どの機能のテンプレートでも同一のキー表記をお使いいただけます。
          </p>
        </li>
      </ol>
    </section>

    <section class="flex flex-col gap-panel-gap">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-item-gap">
        <nav class="tabs flex items-center gap-inline-gap overflow-x-auto w-full sm:w-auto">
          <button
            v-for="tab in categoryTabs"
            :key="tab.value"
            type="button"
            class="tabs-item"
            :class="{ 'is-active': selectedCategory === tab.value }"
            @click="selectedCategory = tab.value"
          >
            <Icon v-if="tab.icon" :name="tab.icon" size="sm" />
            <span>{{ tab.label }}</span>
            <span v-if="tab.badge !== undefined" class="badge">
              {{ tab.badge }}
            </span>
          </button>
        </nav>

        <div class="w-full sm:w-72">
          <Input
            v-model="searchQuery"
            placeholder="キー名・項目名で絞り込み..."
          />
        </div>
      </div>

      <Table
        :columns="columns"
        :data="filteredKeys"
        row-key="tag"
        empty-text="該当する置換キーが見つかりません"
      >
        <template #cell-tag="{ row }">
          <code class="tag-code" @click="copyTag(row.tag)">
            {{ row.tag }}
          </code>
        </template>

        <template #cell-label="{ row }">
          <strong class="key-label">{{ row.label }}</strong>
        </template>

        <template #cell-description="{ row }">
          <span class="key-desc">{{ row.description }}</span>
        </template>

        <template #cell-aliases="{ row }">
          <div class="flex flex-wrap items-center gap-inline-gap">
            <span
              v-for="a in row.aliases"
              :key="a"
              class="alias-badge"
              @click="copyTag(`%${a}%`)"
            >
              %{{ a }}%
            </span>
          </div>
        </template>

        <template #cell-sampleValue="{ row }">
          <span class="sample-text">{{ row.sampleValue }}</span>
        </template>

        <template #cell-actions="{ row }">
          <Button
            :variant="copiedKey === row.tag ? 'success' : undefined"
            :icon="copiedKey === row.tag ? 'check' : 'copy'"
            @click="copyTag(row.tag)"
          >
            {{ copiedKey === row.tag ? 'コピー済' : 'コピー' }}
          </Button>
        </template>
      </Table>
    </section>
  </div>
</template>

<style scoped lang="scss">
.guide-box {
  border: var(--border-width-base) solid var(--color-border);
  background: var(--surface-bg-sunken);
}

.guide-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.guide-desc {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);

  code {
    padding: 0.1em 0.3em;
    font-family: var(--font-mono);
    color: var(--theme-accent);
    background: var(--surface-bg-elevated);
  }
}

.tag-code {
  display: inline-block;

  padding: var(--space-1) var(--space-2);
  border: var(--border-width-base) solid var(--color-border);

  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--theme-accent);

  background-color: var(--surface-bg-sunken);

  @include state-interactive;

  &:hover {
    border-color: var(--theme-accent);
  }
}

.key-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-main);
}

.key-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.alias-badge {
  padding: 0.1em 0.35em;
  border: var(--border-width-base) solid var(--color-border);

  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);

  background-color: var(--surface-bg-elevated);

  @include state-interactive;

  &:hover {
    border-color: var(--color-text-secondary);
    color: var(--color-text-main);
  }
}

.sample-text {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.text-accent {
  color: var(--theme-accent);
}
</style>
