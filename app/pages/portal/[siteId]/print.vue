<script setup lang="ts">
/**
 * 送電試験結果 Excel 帳票出力画面 (旧URL互換リダイレクト)
 * /portal/:siteId/print -> /portal/:siteId/reports?tab=exam
 */
import { navigateTo, useRoute } from '#app'

const route = useRoute()
const siteId = route.params.siteId as string

await navigateTo(`/portal/${siteId}/reports?tab=exam`, { replace: true })
</script>

<template>
  <div />
</template>
