<script setup lang="ts">
/**
 * MasterWordBreakTab
 * マスター管理者専用: 改行禁止ワード設定タブ。
 * システム全体の改行禁止ワードの追加・一覧・削除・永続化保存を行います。
 */
import { computed, onMounted, ref } from 'vue'

import { useNoBreakWords } from '~/composables/useNoBreakWords'

const { words, fetchWords, saveWords, applyNoBreak } = useNoBreakWords()

// 編集中のローカルワードリスト（未保存状態の管理）
const localWords = ref<string[]>([])
const newWordInput = ref('')
const inputError = ref('')
const saveSuccessMessage = ref('')
const isSaving = ref(false)

// リアルタイムプレビュー用テキスト
const previewInput = ref('自動倉庫 1-1（第1分電盤 動力回路）')

onMounted(async () => {
  await fetchWords()
  localWords.value = [...words.value]
})

// 保存されていない差分があるか判定
const hasUnsavedChanges = computed(() => {
  if (localWords.value.length !== words.value.length) return true

  return localWords.value.some((w, i) => w !== words.value[i])
})

// 単語の追加
const handleAddWord = () => {
  inputError.value = ''
  saveSuccessMessage.value = ''

  const trimmed = newWordInput.value.trim()

  if (!trimmed) {
    inputError.value = '単語を入力してください。'

    return
  }

  if (trimmed.length < 2) {
    inputError.value = '2文字以上の単語を入力してください。'

    return
  }

  if (trimmed.length > 50) {
    inputError.value = '50文字以内で入力してください。'

    return
  }

  if (localWords.value.includes(trimmed)) {
    inputError.value = 'その単語は既に登録されています。'

    return
  }

  localWords.value.push(trimmed)
  newWordInput.value = ''
}

// 単語の削除
const handleRemoveWord = (index: number) => {
  saveSuccessMessage.value = ''
  localWords.value.splice(index, 1)
}

// 変更の保存
const handleSave = async () => {
  isSaving.value = true
  saveSuccessMessage.value = ''
  inputError.value = ''

  try {
    const res = await saveWords(localWords.value)

    if (res.success) {
      saveSuccessMessage.value = '改行禁止ワードを保存しました。'
      localWords.value = [...words.value]
    }
    else {
      inputError.value = res.message || '保存に失敗しました。'
    }
  }
  finally {
    isSaving.value = false
  }
}

// 変更の破棄（リセット）
const handleReset = () => {
  localWords.value = [...words.value]
  inputError.value = ''
  saveSuccessMessage.value = ''
}

// プレビュー用の整形結果
const formattedPreview = computed(() => {
  return applyNoBreak(previewInput.value)
})
</script>

<template>
  <div class="flex flex-col gap-6 master-word-break">
    <!-- 説明・ルールカード -->
    <Panel class="rule-panel">
      <div class="flex items-center gap-2 mb-2 rule-panel__title">
        <Icon name="info" size="sm" />
        <span>改行禁止ルールの概要</span>
      </div>
      <p class="mb-3">
        テーブルの盤名称やテキスト表示時に、単語の途中で不自然に折り返されるのを防止する設定です。現場別ではなくシステム全体に適用されます。
      </p>
      <div class="flex flex-col gap-2 p-3 sub-rule-box">
        <div class="flex items-start gap-2">
          <span class="shrink-0 sub-rule-label">初期自動ルール:</span>
          <span>
            <strong>「〇-〇」</strong>（例: <code>1-1</code>, <code>1L-1</code>）および
            <strong>「〇〇盤」</strong>（例: <code>分電盤</code>, <code>電灯盤</code>, <code>動力盤</code> など）はシステムで自動的に改行禁止になります。手動で登録する必要はありません。
          </span>
        </div>
        <div class="flex items-start gap-2">
          <span class="shrink-0 sub-rule-label sub-rule-label--manual">手動登録ワード:</span>
          <span>
            「自動倉庫」などの施設名や特殊な単語を以下で追加してください。
          </span>
        </div>
      </div>
    </Panel>

    <!-- 単語入力・追加フォーム -->
    <Panel>
      <h3 class="mb-3">
        新規ワードの追加
      </h3>
      <form class="flex flex-wrap items-center gap-3" @submit.prevent="handleAddWord">
        <div class="flex-1 min-w-[200px]">
          <Input
            v-model="newWordInput"
            placeholder="例: 自動倉庫, 受変電設備"
            :error="!!inputError"
            @keydown.enter.prevent="handleAddWord"
          />
        </div>
        <Button
          type="submit"
          icon="plus"
        >
          追加する
        </Button>
      </form>
      <p v-if="inputError" class="mt-2 error-text">
        {{ inputError }}
      </p>
    </Panel>

    <!-- 登録済みワード一覧 -->
    <Panel>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-2">
          <h3>
            登録済みワード一覧
          </h3>
          <span class="words-count">({{ localWords.length }}件)</span>
          <Badge v-if="hasUnsavedChanges" id="system:unsaved" class="animate-pulse" />
        </div>

        <div class="flex items-center gap-2">
          <Button
            v-if="hasUnsavedChanges"
            :disabled="isSaving"
            @click="handleReset"
          >
            元に戻す
          </Button>
          <Button
            variant="success"
            icon="check"
            :loading="isSaving"
            :disabled="!hasUnsavedChanges"
            @click="handleSave"
          >
            変更を保存
          </Button>
        </div>
      </div>

      <!-- 保存完了メッセージ -->
      <div v-if="saveSuccessMessage" class="flex items-center gap-2 p-2 mb-3 success-banner">
        <Icon name="check-circle" size="sm" />
        <span>{{ saveSuccessMessage }}</span>
      </div>

      <!-- ワードバッジ一覧 -->
      <div v-if="localWords.length > 0" class="flex flex-wrap gap-2 min-h-[48px]">
        <span
          v-for="(word, index) in localWords"
          :key="`${word}-${index}`"
          class="inline-flex items-center gap-1.5 py-1 px-2.5 word-tag"
        >
          <span>{{ word }}</span>
          <button
            type="button"
            class="inline-flex items-center justify-center p-0.5 delete-btn"
            title="削除"
            @click="handleRemoveWord(index)"
          >
            <Icon name="x" size="sm" />
          </button>
        </span>
      </div>

      <!-- 0件時（MoleculesEmptyState で統一） -->
      <MoleculesEmptyState
        v-else
        icon="type"
        title="登録されている手動ワードはありません"
        description="「新規ワードの追加」から追加してください。"
        class="py-6"
      />
    </Panel>

    <!-- リアルタイムプレビュー枠 -->
    <Panel>
      <h3 class="mb-2">
        改行動作プレビュー
      </h3>
      <p class="mb-3">
        以下の入力欄にテスト文字列を入力すると、右側の狭小枠（盤情報幅想定: 100px）でどのように折り返されるか確認できます。
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block mb-1">テスト入力文</label>
          <Input v-model="previewInput" placeholder="テスト文字列を入力" />
        </div>
        <div>
          <label class="block mb-1">表示シミュレーション（幅100px・文節折り返し）</label>
          <div class="p-2 preview-box">
            <span>
              {{ formattedPreview }}
            </span>
          </div>
        </div>
      </div>
    </Panel>
  </div>
</template>

<style scoped lang="scss">
.master-word-break {
  --glow-color: var(--color-category-management, var(--color-category-tool));

  h3 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-main);
  }

  p,
  label {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  .rule-panel {
    border-left: 4px solid var(--glow-color);

    .rule-panel__title {
      font-weight: var(--font-weight-semibold);
    }

    .sub-rule-box {
      border: var(--border-width-base) solid var(--color-border-subtle, var(--color-border));
      font-size: var(--font-size-xs);
      color: var(--color-text-main);
      background-color: var(--surface-bg-elevated);
    }
  }

  .error-text {
    font-size: var(--font-size-xs);
    color: var(--color-status-danger);
  }

  .success-banner {
    border: 1px solid var(--color-status-success);
    font-size: var(--font-size-xs);
    color: var(--color-status-success);
    background-color: color-mix(in srgb, var(--color-status-success) 15%, transparent);
  }

  .word-tag {
    border: var(--border-width-base) solid var(--color-border);

    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);

    background-color: var(--surface-bg-elevated);

    transition: var(--transition-interactive);

    &:hover {
      border-color: var(--glow-color);
      box-shadow: var(--shadow-glow-sm);
    }

    .delete-btn {
      cursor: pointer;

      border: none;

      color: var(--color-text-muted);

      background: none;

      transition: var(--transition-interactive);

      &:hover {
        color: var(--color-status-danger);
      }
    }
  }

  .preview-box {
    width: 100px;
    min-height: 60px;
    border: var(--border-width-base) solid var(--color-border);
    background-color: var(--surface-bg);

    span {
      display: block;

      font-size: var(--font-size-xs);
      line-height: 1.3;
      color: var(--color-text-main);
      word-break: auto-phrase;
      white-space: normal;
    }
  }

  .sub-rule-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);

    &--manual {
      color: var(--theme-accent);
    }
  }

  .words-count {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-normal);
    color: var(--color-text-muted);
  }
}
</style>
