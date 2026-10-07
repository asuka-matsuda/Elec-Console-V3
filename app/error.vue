<script setup lang="ts">
/**
 * グローバルエラーページ
 *
 * 404（Not Found）、500（Server Error）等の未捕捉エラー発生時に
 * ユーザー向けエラーパネルの表示およびトップページへの安全な復帰アクションを提供します。
 */
import { computed } from 'vue'

import type { NuxtError } from '#app'
import { clearError, useHead } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error?.statusCode || 500)
const isNotFound = computed(() => statusCode.value === 404)

useHead({
  title: `${statusCode.value} - Elec-Console`,
})

const handleReset = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center p-layout-pad">
    <div class="panel w-full max-w-[480px] flex flex-col items-center text-center gap-panel-gap">
      <h2 class="text-center">Elec-Console V3</h2>

      <hr class="divider is-fade-center">

      <Badge :variant="isNotFound ? 'primary' : 'danger'" size="lg" :icon="isNotFound ? 'compass' : 'triangle-alert'">
        {{ statusCode }}
      </Badge>

      <div class="flex flex-col gap-inline-gap">
        <h3>{{ isNotFound ? "指定されたページが見つかりません" : "システムエラーが発生しました" }}</h3>
        <small>
          {{
            isNotFound
              ? "アクセスしようとしたページは削除されたか、URLが変更された可能性があります。"
              : "予期せぬエラーが発生しました。しばらく待ってから再度お試しいただくか、ホームへお戻りください。"
          }}
        </small>
      </div>

      <Note v-if="error?.message && !isNotFound" variant="error" class="w-full text-left">
        {{ error.message }}
      </Note>

      <Button variant="primary" icon="home" size="lg" block @click="handleReset">ホームへ戻る</Button>
    </div>
  </main>
</template>
